import "dotenv/config";
import { pool, initDb } from "../config/db.js";

// Starting prices in RWF — edit freely from the DB or a future admin panel.
const services = [
  // Photography
  { category: "Photography", name: "Wedding Photography", description: "Full-day coverage of your wedding, edited gallery included.", price_rwf: 350000, duration_label: "Full day" },
  { category: "Photography", name: "Pre-Wedding / Candid Session", description: "Couple's session at a location of your choice.", price_rwf: 120000, duration_label: "2–3 hrs" },
  { category: "Photography", name: "Studio Session", description: "Studio or outdoor portraits, individual or family.", price_rwf: 60000, duration_label: "1 hr" },
  { category: "Photography", name: "Maternity & Baby Shoot", description: "Gentle, guided maternity or newborn session.", price_rwf: 80000, duration_label: "1–2 hrs" },
  { category: "Photography", name: "Passport Photos", description: "Same-day passport / ID photos.", price_rwf: 3000, duration_label: "15 mins" },
  { category: "Photography", name: "Conference / Event Coverage", description: "Photo coverage for conferences, anniversaries and corporate events.", price_rwf: 150000, duration_label: "Half / full day" },

  // Videography
  { category: "Videography", name: "Cinematic Wedding Video", description: "Full-day filming with a cinematic edited highlight film.", price_rwf: 450000, duration_label: "Full day" },
  { category: "Videography", name: "Event Coverage & Livestreaming", description: "Video coverage with optional live streaming.", price_rwf: 200000, duration_label: "Half / full day" },
  { category: "Videography", name: "Advertising / Commercial Video", description: "Product or brand video production and editing.", price_rwf: 300000, duration_label: "Project-based" },
  { category: "Videography", name: "Documentary Film", description: "Longer-form documentary filming and edit.", price_rwf: 500000, duration_label: "Project-based" },

  // Graphic Design
  { category: "Graphic Design", name: "Invitation Design", description: "Custom wedding or event invitation design.", price_rwf: 15000, duration_label: "1–2 days" },
  { category: "Graphic Design", name: "Logo Design", description: "Brand logo design with revisions.", price_rwf: 40000, duration_label: "3–5 days" },
  { category: "Graphic Design", name: "Banner Design", description: "Print or digital banner design.", price_rwf: 12000, duration_label: "1–2 days" },
  { category: "Graphic Design", name: "Photo Editing / Retouching", description: "Professional retouching, per set of photos.", price_rwf: 10000, duration_label: "1 day" },

  // Online Services
  { category: "Online Services", name: "Irembo Application Assistance", description: "Help submitting an application via Irembo.", price_rwf: 2000, duration_label: "Same day" },
  { category: "Online Services", name: "RRA Declaration", description: "Assistance filing an RRA tax declaration.", price_rwf: 3000, duration_label: "Same day" },
];

async function run() {
  await initDb();

  const [[{ c }]] = await pool.query("SELECT COUNT(*) AS c FROM services");
  if (c > 0) {
    console.log("Services already seeded, skipping.");
    await pool.end();
    return;
  }

  for (const s of services) {
    await pool.execute(
      `INSERT INTO services (category, name, description, price_rwf, duration_label)
       VALUES (:category, :name, :description, :price_rwf, :duration_label)`,
      s
    );
  }

  console.log(`Seeded ${services.length} services.`);
  await pool.end();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
