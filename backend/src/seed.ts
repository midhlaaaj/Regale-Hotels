/** Equivalent to the old `python -m app.seed`: loads 4 demo properties, rooms,
 * rate plans, availability, testimonials, packages, and two admin accounts. */
import crypto from "crypto";
import { pool, withTransaction } from "./db";
import { hashPassword } from "./security";
import { UserRole } from "./types/enums";

const IMAGES: Record<string, string> = {
  alleppey:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCgrtkDFA8wpunJIf_o1drN6FaSlwB2DVTF0W5sFttfRlD_OCF5-SOXvlm1HPRztIPmABl8NfXhdMCQ5XTqXVyqg1cEjEr9bEq2AYvAFJeTc7AQvd8Y0cb2VhOZjbOHwweVMZBAglYydTjOd0slnoZ_0zUgQ0px6cCLlrODK1eRqThWwXzv3oqJ8FjRGMH9QTSWjEOHpZ8xYH_TEmg7qTyfRTmPOJRHiT0H4M6AJWCi2fDq7B1vDtoe",
  munnar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC6nxX0NBg11sCWdsNXtjQVrK52khPBXBC_aJawVzuPP6Biw4OiEMuJL3G39OfHUfDxcz3f6okOcYwZ91QfsGMm-TrL6fb3f-yYqGilqrQK190Iy-VtdIKJwkEL9j9AONu6ZW-rneZoh0c_TpTj01agfGEDCSFRcmaE-sGV7FqCBv_FVuYW8G-deN5VWgXuebB43JZdTxnxx7Ez3NhTsXbOcYalgC6dZOdMSEnkhSGGNoi3X6jTJDHd",
  kochi:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBdQDvONBwoPAXkrNXi1vccKDbhp2TqZJMmV1y1Of1Umt_e7FOBPqOskZbUVlacKTqeh8PPvKR6MNU4q7yLy0obFAMwHWF8kueCnox4WOuMWcU52Nh7YQUdXd9ZQXsGRsqhzJu9CYrPZo67pbh-L2aebbTD2ARWC_NgjszUj6zfQ-eonlxvDyZXygZkwW5Jf_H9SRKjsqz4iVqZPmJLuOHWweCsJsJA7tU9jVqg-ZVnC53pWyF-DS7x",
  varkala:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBvApowZ86A7hdu7XHDVq6tGhlMx9gRL_aHxzCkFR0hIkbGbBOCZG_YVjd_PhvRWqXAsbz_y6GDBVT416OSjqhm52sQ0eap1nhvMdBZBVlac0DYKaHpPMdrYBYI2fsJs70k0uw649kr86wG7nXbd6lIGLOE0vsnEXOccbmPZLWg-Y1FijoheVScC-pG9xjy4gdZkhPZkliFcl9lyUrhg2LuU4kPoMgSr2-UxvqCiNq8_IxsGEHgJeHV",
};

interface RoomSeed {
  name: string;
  description: string;
  max_occupancy: number;
  base_price: number;
}

interface PropertySeed {
  name: string;
  slug: string;
  city: string;
  state: string;
  description: string;
  cover_image_url: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  rooms: RoomSeed[];
}

const PROPERTIES: PropertySeed[] = [
  {
    name: "The Alleppey Ledger",
    slug: "alleppey-ledger",
    city: "Alleppey",
    state: "Kerala",
    description:
      "A restored spice merchant's home on the banks of Lake Vembanad. Wake to the sound of country boats and the scent of cardamom drying in the courtyard.",
    cover_image_url: IMAGES.alleppey,
    latitude: 9.4981,
    longitude: 76.3388,
    amenities: ["Backwaters", "Infinity Pool", "Ayurvedic Spa", "Houseboat Transfers", "Free Wi-Fi"],
    rooms: [
      { name: "Vembanad View Room", description: "A quiet room overlooking the lake, dressed in linen and dark wood.", max_occupancy: 2, base_price: 8500 },
      { name: "Spice Merchant Suite", description: "The home's original master suite, with a private sit-out over the water.", max_occupancy: 3, base_price: 12500 },
    ],
  },
  {
    name: "Munnar Estate",
    slug: "munnar-estate",
    city: "Munnar",
    state: "Kerala",
    description:
      "Perched among rolling tea gardens, offering cool mountain air and silence. A working estate bungalow reimagined as an intimate six-room retreat.",
    cover_image_url: IMAGES.munnar,
    latitude: 10.0889,
    longitude: 77.0595,
    amenities: ["Hills", "Tea Estate Walks", "Fireplace Lounge", "Bonfire Deck", "Free Wi-Fi"],
    rooms: [
      { name: "Tea Garden Room", description: "Cool mornings, mist over the slopes, a private balcony facing the estate.", max_occupancy: 2, base_price: 12000 },
      { name: "Misty Ridge Suite", description: "The estate's highest room, with an in-room fireplace for the hill chill.", max_occupancy: 3, base_price: 17000 },
    ],
  },
  {
    name: "Mattancherry Manor",
    slug: "mattancherry-manor",
    city: "Kochi",
    state: "Kerala",
    description:
      "A quiet, architectural gem tucked away in the historic spice quarter of Fort Kochi. High ceilings, exposed beams, and the calm of a bygone trading-port era.",
    cover_image_url: IMAGES.kochi,
    latitude: 9.9585,
    longitude: 76.2588,
    amenities: ["Heritage", "Rooftop Dining", "Butler Service", "Airport Transfers", "Free Wi-Fi"],
    rooms: [
      { name: "Colonial Room", description: "A restored heritage room with a four-poster bed and arched doorways.", max_occupancy: 2, base_price: 15500 },
      { name: "Arched Terrace Suite", description: "A corner suite with a private terrace overlooking the spice-quarter rooftops.", max_occupancy: 3, base_price: 21000 },
    ],
  },
  {
    name: "Varkala Cliff Villa",
    slug: "varkala-cliff-villa",
    city: "Varkala",
    state: "Kerala",
    description:
      "Perched on Varkala's red cliffs above the Arabian Sea, built around a banyan-shaded courtyard pool with the surf audible from every room.",
    cover_image_url: IMAGES.varkala,
    latitude: 8.7379,
    longitude: 76.7163,
    amenities: ["Coastal", "Private Pool", "Beach Shuttle", "Poolside Bar", "Free Wi-Fi"],
    rooms: [
      { name: "Courtyard Room", description: "Ground-floor room opening directly onto the pool courtyard.", max_occupancy: 2, base_price: 18000 },
      { name: "Banyan Pool Suite", description: "The villa's largest suite, with a private plunge pool under the banyan.", max_occupancy: 4, base_price: 26000 },
    ],
  },
];

const TESTIMONIALS = [
  {
    property_slug: "varkala-cliff-villa",
    guest_name: "Sarah Jenkins",
    guest_location: "London",
    rating: 5,
    quote: "A masterclass in understated luxury. The attention to detail in the architecture and the warmth of the staff made our stay unforgettable.",
  },
  {
    property_slug: "alleppey-ledger",
    guest_name: "Arjun Mehta",
    guest_location: "Mumbai",
    rating: 5,
    quote: "The Alleppey Ledger is a rare find. It feels less like a hotel and more like being invited to a beautiful, historic private home.",
  },
  {
    property_slug: "munnar-estate",
    guest_name: "Elena Rossi",
    guest_location: "Milan",
    rating: 5,
    quote: "Waking up to the mist over the tea estates in Munnar was magical. The minimalist design perfectly complements the dramatic landscape.",
  },
];

const PACKAGES = [
  {
    property_slug: "alleppey-ledger",
    name: "Backwater Escape",
    nights: 4,
    description: "Four nights in the Spice Merchant Suite with a private houseboat afternoon, a daily Ayurvedic massage, and all meals included.",
    price: 52000,
    meal_plan: "All meals included",
    rooms_included: 1,
    max_guests: 2,
  },
  {
    property_slug: "munnar-estate",
    name: "Tea Estate Retreat",
    nights: 3,
    description: "Three nights in the Tea Garden Room with a guided walk through the working tea gardens, breakfast and dinner daily, and a bonfire evening.",
    price: 38000,
    meal_plan: "Breakfast & dinner included",
    rooms_included: 1,
    max_guests: 2,
  },
  {
    property_slug: "varkala-cliff-villa",
    name: "Cliffside Getaway",
    nights: 5,
    description: "Five nights, four days at the Courtyard Room with full board, a sunset toddy tasting, and a private beach shuttle on arrival and departure.",
    price: 78000,
    meal_plan: "All meals included",
    rooms_included: 1,
    max_guests: 2,
  },
];

const AVAILABILITY_DAYS = 120;
const DEFAULT_ROOMS_AVAILABLE = 4;

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed(): Promise<void> {
  await withTransaction(async (client) => {
    const slugToPropertyId = new Map<string, number>();
    const today = new Date();
    const validTo = addDays(today, 365);
    const validFrom = addDays(today, 0);

    for (const prop of PROPERTIES) {
      const propRes = await client.query<{ id: number }>(
        `INSERT INTO properties (name, slug, city, state, description, cover_image_url, latitude, longitude, amenities)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [prop.name, prop.slug, prop.city, prop.state, prop.description, prop.cover_image_url, prop.latitude, prop.longitude, JSON.stringify(prop.amenities)]
      );
      const propertyId = propRes.rows[0].id;
      slugToPropertyId.set(prop.slug, propertyId);

      for (const room of prop.rooms) {
        const roomRes = await client.query<{ id: number }>(
          `INSERT INTO room_types (property_id, name, description, max_occupancy, base_price, images)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [propertyId, room.name, room.description, room.max_occupancy, room.base_price, JSON.stringify([prop.cover_image_url])]
        );
        const roomTypeId = roomRes.rows[0].id;

        await client.query(
          `INSERT INTO rate_plans (room_type_id, name, fixed_price, refundable, includes_breakfast, valid_from, valid_to)
           VALUES ($1,'Flexible',$2,true,false,$3,$4)`,
          [roomTypeId, room.base_price, validFrom, validTo]
        );
        await client.query(
          `INSERT INTO rate_plans (room_type_id, name, fixed_price, refundable, includes_breakfast, valid_from, valid_to)
           VALUES ($1,'Non-refundable + Breakfast',$2,false,true,$3,$4)`,
          [roomTypeId, Math.round(room.base_price * 0.92 * 100) / 100, validFrom, validTo]
        );

        for (let i = 0; i < AVAILABILITY_DAYS; i++) {
          await client.query(
            `INSERT INTO availability (room_type_id, date, rooms_available) VALUES ($1,$2,$3)`,
            [roomTypeId, addDays(today, i), DEFAULT_ROOMS_AVAILABLE]
          );
        }
      }
    }

    for (const t of TESTIMONIALS) {
      await client.query(
        `INSERT INTO testimonials (property_id, guest_name, guest_location, rating, quote, approved, featured)
         VALUES ($1,$2,$3,$4,$5,true,true)`,
        [slugToPropertyId.get(t.property_slug), t.guest_name, t.guest_location, t.rating, t.quote]
      );
    }

    for (const p of PACKAGES) {
      await client.query(
        `INSERT INTO packages (property_id, name, nights, description, price, meal_plan, rooms_included, max_guests)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [slugToPropertyId.get(p.property_slug), p.name, p.nights, p.description, p.price, p.meal_plan, p.rooms_included, p.max_guests]
      );
    }

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, property_id) VALUES ($1,$2,$3,$4,$5)`,
      ["Midhlaj", "midhlajmidhu004@gmail.com", hashPassword("Regale@123"), UserRole.super_admin, null]
    );

    const managerPassword = crypto.randomBytes(18).toString("base64url");
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, property_id) VALUES ($1,$2,$3,$4,$5)`,
      [
        "Alleppey Manager",
        "manager.alleppey@regale.in",
        hashPassword(managerPassword),
        UserRole.property_manager,
        slugToPropertyId.get("alleppey-ledger"),
      ]
    );

    console.log("Seed complete:", Object.fromEntries(slugToPropertyId));
    console.log(`Generated property-manager login: manager.alleppey@regale.in / ${managerPassword}`);
  });
  await pool.end();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { seed };
