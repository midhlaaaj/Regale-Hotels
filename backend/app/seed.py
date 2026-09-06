import asyncio
import secrets
from datetime import date, timedelta

from app.core.security import hash_password
from app.db import async_session
from app.models import (
    Availability,
    Package,
    Property,
    RatePlan,
    RoomType,
    Testimonial,
    User,
    UserRole,
)

IMAGES = {
    "alleppey": "https://lh3.googleusercontent.com/aida-public/AB6AXuCgrtkDFA8wpunJIf_o1drN6FaSlwB2DVTF0W5sFttfRlD_OCF5-SOXvlm1HPRztIPmABl8NfXhdMCQ5XTqXVyqg1cEjEr9bEq2AYvAFJeTc7AQvd8Y0cb2VhOZjbOHwweVMZBAglYydTjOd0slnoZ_0zUgQ0px6cCLlrODK1eRqThWwXzv3oqJ8FjRGMH9QTSWjEOHpZ8xYH_TEmg7qTyfRTmPOJRHiT0H4M6AJWCi2fDq7B1vDtoe",
    "munnar": "https://lh3.googleusercontent.com/aida-public/AB6AXuC6nxX0NBg11sCWdsNXtjQVrK52khPBXBC_aJawVzuPP6Biw4OiEMuJL3G39OfHUfDxcz3f6okOcYwZ91QfsGMm-TrL6fb3f-yYqGilqrQK190Iy-VtdIKJwkEL9j9AONu6ZW-rneZoh0c_TpTj01agfGEDCSFRcmaE-sGV7FqCBv_FVuYW8G-deN5VWgXuebB43JZdTxnxx7Ez3NhTsXbOcYalgC6dZOdMSEnkhSGGNoi3X6jTJDHd",
    "kochi": "https://lh3.googleusercontent.com/aida-public/AB6AXuBdQDvONBwoPAXkrNXi1vccKDbhp2TqZJMmV1y1Of1Umt_e7FOBPqOskZbUVlacKTqeh8PPvKR6MNU4q7yLy0obFAMwHWF8kueCnox4WOuMWcU52Nh7YQUdXd9ZQXsGRsqhzJu9CYrPZo67pbh-L2aebbTD2ARWC_NgjszUj6zfQ-eonlxvDyZXygZkwW5Jf_H9SRKjsqz4iVqZPmJLuOHWweCsJsJA7tU9jVqg-ZVnC53pWyF-DS7x",
    "varkala": "https://lh3.googleusercontent.com/aida-public/AB6AXuBvApowZ86A7hdu7XHDVq6tGhlMx9gRL_aHxzCkFR0hIkbGbBOCZG_YVjd_PhvRWqXAsbz_y6GDBVT416OSjqhm52sQ0eap1nhvMdBZBVlac0DYKaHpPMdrYBYI2fsJs70k0uw649kr86wG7nXbd6lIGLOE0vsnEXOccbmPZLWg-Y1FijoheVScC-pG9xjy4gdZkhPZkliFcl9lyUrhg2LuU4kPoMgSr2-UxvqCiNq8_IxsGEHgJeHV",
}

PROPERTIES = [
    dict(
        name="The Alleppey Ledger",
        slug="alleppey-ledger",
        city="Alleppey",
        state="Kerala",
        description="A restored spice merchant's home on the banks of Lake Vembanad. "
        "Wake to the sound of country boats and the scent of cardamom drying in the courtyard.",
        cover_image_url=IMAGES["alleppey"],
        latitude=9.4981,
        longitude=76.3388,
        amenities=["Backwaters", "Infinity Pool", "Ayurvedic Spa", "Houseboat Transfers", "Free Wi-Fi"],
        rooms=[
            dict(name="Vembanad View Room", description="A quiet room overlooking the lake, dressed in linen and dark wood.", max_occupancy=2, base_price=8500),
            dict(name="Spice Merchant Suite", description="The home's original master suite, with a private sit-out over the water.", max_occupancy=3, base_price=12500),
        ],
    ),
    dict(
        name="Munnar Estate",
        slug="munnar-estate",
        city="Munnar",
        state="Kerala",
        description="Perched among rolling tea gardens, offering cool mountain air and silence. "
        "A working estate bungalow reimagined as an intimate six-room retreat.",
        cover_image_url=IMAGES["munnar"],
        latitude=10.0889,
        longitude=77.0595,
        amenities=["Hills", "Tea Estate Walks", "Fireplace Lounge", "Bonfire Deck", "Free Wi-Fi"],
        rooms=[
            dict(name="Tea Garden Room", description="Cool mornings, mist over the slopes, a private balcony facing the estate.", max_occupancy=2, base_price=12000),
            dict(name="Misty Ridge Suite", description="The estate's highest room, with an in-room fireplace for the hill chill.", max_occupancy=3, base_price=17000),
        ],
    ),
    dict(
        name="Mattancherry Manor",
        slug="mattancherry-manor",
        city="Kochi",
        state="Kerala",
        description="A quiet, architectural gem tucked away in the historic spice quarter of Fort Kochi. "
        "High ceilings, exposed beams, and the calm of a bygone trading-port era.",
        cover_image_url=IMAGES["kochi"],
        latitude=9.9585,
        longitude=76.2588,
        amenities=["Heritage", "Rooftop Dining", "Butler Service", "Airport Transfers", "Free Wi-Fi"],
        rooms=[
            dict(name="Colonial Room", description="A restored heritage room with a four-poster bed and arched doorways.", max_occupancy=2, base_price=15500),
            dict(name="Arched Terrace Suite", description="A corner suite with a private terrace overlooking the spice-quarter rooftops.", max_occupancy=3, base_price=21000),
        ],
    ),
    dict(
        name="Varkala Cliff Villa",
        slug="varkala-cliff-villa",
        city="Varkala",
        state="Kerala",
        description="Perched on Varkala's red cliffs above the Arabian Sea, "
        "built around a banyan-shaded courtyard pool with the surf audible from every room.",
        cover_image_url=IMAGES["varkala"],
        latitude=8.7379,
        longitude=76.7163,
        amenities=["Coastal", "Private Pool", "Beach Shuttle", "Poolside Bar", "Free Wi-Fi"],
        rooms=[
            dict(name="Courtyard Room", description="Ground-floor room opening directly onto the pool courtyard.", max_occupancy=2, base_price=18000),
            dict(name="Banyan Pool Suite", description="The villa's largest suite, with a private plunge pool under the banyan.", max_occupancy=4, base_price=26000),
        ],
    ),
]

TESTIMONIALS = [
    dict(property_slug="varkala-cliff-villa", guest_name="Sarah Jenkins", guest_location="London", rating=5,
         quote="A masterclass in understated luxury. The attention to detail in the architecture and the warmth of the staff made our stay unforgettable."),
    dict(property_slug="alleppey-ledger", guest_name="Arjun Mehta", guest_location="Mumbai", rating=5,
         quote="The Alleppey Ledger is a rare find. It feels less like a hotel and more like being invited to a beautiful, historic private home."),
    dict(property_slug="munnar-estate", guest_name="Elena Rossi", guest_location="Milan", rating=5,
         quote="Waking up to the mist over the tea estates in Munnar was magical. The minimalist design perfectly complements the dramatic landscape."),
]

PACKAGES = [
    dict(
        property_slug="alleppey-ledger",
        name="Backwater Escape",
        nights=4,
        description="Four nights in the Spice Merchant Suite with a private houseboat afternoon, a daily Ayurvedic massage, and all meals included.",
        price=52000,
        meal_plan="All meals included",
        rooms_included=1,
        max_guests=2,
    ),
    dict(
        property_slug="munnar-estate",
        name="Tea Estate Retreat",
        nights=3,
        description="Three nights in the Tea Garden Room with a guided walk through the working tea gardens, breakfast and dinner daily, and a bonfire evening.",
        price=38000,
        meal_plan="Breakfast & dinner included",
        rooms_included=1,
        max_guests=2,
    ),
    dict(
        property_slug="varkala-cliff-villa",
        name="Cliffside Getaway",
        nights=5,
        description="Five nights, four days at the Courtyard Room with full board, a sunset toddy tasting, and a private beach shuttle on arrival and departure.",
        price=78000,
        meal_plan="All meals included",
        rooms_included=1,
        max_guests=2,
    ),
]

AVAILABILITY_DAYS = 120
DEFAULT_ROOMS_AVAILABLE = 4


async def seed() -> None:
    async with async_session() as session:
        slug_to_property_id: dict[str, int] = {}

        for prop_data in PROPERTIES:
            rooms_data = prop_data.pop("rooms")
            property_ = Property(**prop_data)
            session.add(property_)
            await session.flush()
            slug_to_property_id[property_.slug] = property_.id

            for room_data in rooms_data:
                room_type = RoomType(
                    property_id=property_.id,
                    images=[prop_data["cover_image_url"]],
                    **room_data,
                )
                session.add(room_type)
                await session.flush()

                base_price = room_data["base_price"]
                session.add(
                    RatePlan(
                        room_type_id=room_type.id,
                        name="Flexible",
                        fixed_price=base_price,
                        refundable=True,
                        includes_breakfast=False,
                        valid_from=date.today(),
                        valid_to=date.today() + timedelta(days=365),
                    )
                )
                session.add(
                    RatePlan(
                        room_type_id=room_type.id,
                        name="Non-refundable + Breakfast",
                        fixed_price=round(base_price * 0.92, 2),
                        refundable=False,
                        includes_breakfast=True,
                        valid_from=date.today(),
                        valid_to=date.today() + timedelta(days=365),
                    )
                )

                for i in range(AVAILABILITY_DAYS):
                    session.add(
                        Availability(
                            room_type_id=room_type.id,
                            date=date.today() + timedelta(days=i),
                            rooms_available=DEFAULT_ROOMS_AVAILABLE,
                        )
                    )

        for t in TESTIMONIALS:
            session.add(
                Testimonial(
                    property_id=slug_to_property_id[t["property_slug"]],
                    guest_name=t["guest_name"],
                    guest_location=t["guest_location"],
                    rating=t["rating"],
                    quote=t["quote"],
                    approved=True,
                    featured=True,
                )
            )

        for p in PACKAGES:
            session.add(Package(property_id=slug_to_property_id[p.pop("property_slug")], **p))

        session.add(
            User(
                name="Midhlaj",
                email="midhlajmidhu004@gmail.com",
                password_hash=hash_password("Regale@123"),
                role=UserRole.super_admin,
                property_id=None,
            )
        )
        manager_password = secrets.token_urlsafe(18)
        session.add(
            User(
                name="Alleppey Manager",
                email="manager.alleppey@regale.in",
                password_hash=hash_password(manager_password),
                role=UserRole.property_manager,
                property_id=slug_to_property_id["alleppey-ledger"],
            )
        )

        await session.commit()
        print("Seed complete:", slug_to_property_id)
        print(f"Generated property-manager login: manager.alleppey@regale.in / {manager_password}")


if __name__ == "__main__":
    asyncio.run(seed())
