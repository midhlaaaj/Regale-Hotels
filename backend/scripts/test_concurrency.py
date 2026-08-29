"""Fires N simultaneous booking requests for the same room/dates against a room
type with limited capacity, to prove the row-locking in services/booking.py
actually serializes them instead of allowing a double-booking."""

import asyncio

import httpx

BASE = "http://127.0.0.1:8000"
ROOM_TYPE_ID = 9  # Alleppey Ledger's Vembanad View Room (capacity 4 per seed.py)
CHECKIN = "2026-10-01"
CHECKOUT = "2026-10-02"
CONCURRENT_REQUESTS = 6  # more than the seeded capacity of 4


async def attempt(client: httpx.AsyncClient, i: int):
    payload = {
        "property_id": 5,
        "room_type_id": ROOM_TYPE_ID,
        "rate_plan_id": 15,
        "check_in": CHECKIN,
        "check_out": CHECKOUT,
        "guests_count": 2,
        "payment_method": "online",
        "guest": {"name": f"Concurrent Guest {i}", "email": f"concurrent{i}@example.com", "phone": "9000000000"},
    }
    resp = await client.post(f"{BASE}/api/bookings", json=payload)
    return i, resp.status_code


async def main():
    async with httpx.AsyncClient(timeout=30) as client:
        results = await asyncio.gather(*[attempt(client, i) for i in range(CONCURRENT_REQUESTS)])

    succeeded = [i for i, code in results if code == 200]
    conflicted = [i for i, code in results if code == 409]
    print(f"Fired {CONCURRENT_REQUESTS} concurrent bookings for room_type={ROOM_TYPE_ID} on {CHECKIN}")
    print(f"  succeeded (200): {len(succeeded)} -> requests {succeeded}")
    print(f"  rejected  (409): {len(conflicted)} -> requests {conflicted}")
    other = [(i, c) for i, c in results if c not in (200, 409)]
    if other:
        print(f"  unexpected status codes: {other}")
    assert len(succeeded) <= 4, "MORE BOOKINGS SUCCEEDED THAN CAPACITY — double-booking bug!"
    print("PASS: no more bookings succeeded than the room's capacity.")


if __name__ == "__main__":
    asyncio.run(main())
