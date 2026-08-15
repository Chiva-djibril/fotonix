import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fotonix",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  // Return DATE/DATETIME as plain strings ("2026-12-11", "2026-12-11 15:00:00")
  // instead of JS Date objects — the API and frontend both expect plain
  // YYYY-MM-DD strings, not full ISO timestamps with timezone conversion.
  dateStrings: true,
});

/**
 * Creates the schema if it doesn't exist yet. Safe to call on every boot —
 * `CREATE TABLE IF NOT EXISTS` is a no-op once the tables are already there.
 */
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      suspended_reason VARCHAR(255) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(50) DEFAULT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price_rwf INT NOT NULL,
      price_min_rwf INT DEFAULT NULL,
      price_max_rwf INT DEFAULT NULL,
      duration_label VARCHAR(100),
      price_note VARCHAR(255) DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      service_id INT NOT NULL,
      event_date DATE NOT NULL,
      event_time VARCHAR(10) NOT NULL,
      location VARCHAR(255),
      notes TEXT,
      amount_rwf INT NOT NULL,
      selected_subcategory VARCHAR(50) DEFAULT NULL,
      selected_option VARCHAR(100) DEFAULT NULL,
      selected_quantity INT DEFAULT NULL,
      booking_details TEXT DEFAULT NULL,
      reminder_sent TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
      momo_reference_id VARCHAR(100),
      momo_status VARCHAR(30) DEFAULT 'not_started',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id),
      INDEX idx_bookings_user (user_id),
      INDEX idx_bookings_date (event_date)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      sender_id INT DEFAULT NULL,
      booking_id INT DEFAULT NULL,
      type VARCHAR(30) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS albums (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      album_type_id INT DEFAULT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      cover_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_albums_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_albums_user (user_id)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS album_photos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      album_id INT NOT NULL,
      user_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      mimetype VARCHAR(100) DEFAULT NULL,
      size INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_album_photos_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
      INDEX idx_album_photos_album (album_id),
      INDEX idx_album_photos_user (user_id)
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS album_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      price_rwf INT DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      type VARCHAR(30) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      admin_response TEXT DEFAULT NULL,
      responder_id INT DEFAULT NULL,
      responded_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  try {
    await pool.query("ALTER TABLE albums ADD COLUMN IF NOT EXISTS album_type_id INT DEFAULT NULL");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason VARCHAR(255) DEFAULT NULL");
  } catch {
    // Ignore schema drift from older installations.
  }

  try {
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50) DEFAULT NULL");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS price_min_rwf INT DEFAULT NULL");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS price_max_rwf INT DEFAULT NULL");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS price_note VARCHAR(255) DEFAULT NULL");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1");
  } catch {
    // Ignore schema drift from older installations.
  }

  try {
    await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_subcategory VARCHAR(50) DEFAULT NULL");
    await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_option VARCHAR(100) DEFAULT NULL");
    await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_quantity INT DEFAULT NULL");
    await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_details TEXT DEFAULT NULL");
    await pool.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent TINYINT(1) NOT NULL DEFAULT 0");
    await pool.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'confirmed'");
  } catch {
    // Ignore schema drift from older installations.
  }

  try {
    await pool.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_response TEXT DEFAULT NULL");
    await pool.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS responder_id INT DEFAULT NULL");
    await pool.query("ALTER TABLE feedback ADD COLUMN IF NOT EXISTS responded_at DATETIME DEFAULT NULL");
  } catch {
    // Ignore schema drift from older installations.
  }

  try {
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender_id INT DEFAULT NULL");
  } catch {
    // Ignore schema drift from older installations.
  }

  await pool.query(`
    UPDATE services
    SET subcategory = CASE
      WHEN TRIM(COALESCE(subcategory, '')) = '' THEN
        CASE
          WHEN LOWER(CONCAT(COALESCE(name, ''), ' ', COALESCE(description, ''), ' ', COALESCE(price_note, ''))) LIKE '%video%' OR LOWER(CONCAT(COALESCE(name, ''), ' ', COALESCE(description, ''), ' ', COALESCE(price_note, ''))) LIKE '%videography%' THEN 'Videography'
          ELSE 'Photography'
        END
      ELSE subcategory
    END
    WHERE TRIM(COALESCE(subcategory, '')) = ''
  `);

  const defaultServices = [
    ["Weddings", "Photography", "Photos + albums + cards & boards", "Photography coverage that includes photos, albums, cards and boards for your wedding day.", 10000, 1000, 10000, "1:30 min highlight", "Prices range from 1,000-10,000 RWF", 1],
    ["Weddings", "Videography", "Full video on flash disk", "A full wedding video delivered on flash disk for easy sharing and playback.", 30000, 30000, 50000, "Full video edit", "Prices range from 30,000-50,000 RWF", 1],
    ["Birthdays", "Photography", "Birthday photo package", "Creative birthday photography with albums, cards and boards.", 8000, 5000, 8000, "Short highlight", "Flexible pricing for birthday events", 1],
    ["Birthdays", "Videography", "Birthday video package", "A polished birthday video to relive the celebration on a flash disk.", 25000, 25000, 35000, "Full video edit", "Flexible pricing for birthday events", 1],
    ["Baby Show", "Photography", "Baby show photo package", "Beautiful baby show moments captured with portraits and keepsakes.", 6000, 4000, 6000, "Short highlight", "Flexible pricing for baby shows", 1],
    ["Baby Show", "Videography", "Baby show video package", "A memorable baby show video delivered on flash disk.", 22000, 22000, 32000, "Full video edit", "Flexible pricing for baby shows", 1],
    ["Welcome Backs", "Photography", "Welcome back photo package", "A warm welcome-back photography package for your event.", 7000, 5000, 7000, "Short highlight", "Flexible pricing for welcome backs", 1],
    ["Welcome Backs", "Videography", "Welcome back video package", "Video coverage for your welcome back celebration.", 24000, 24000, 34000, "Full video edit", "Flexible pricing for welcome backs", 1],
    ["Bride show", "Photography", "Bride show photo package", "Photography coverage for a bride show event with keepsake boards.", 6500, 4000, 6500, "Short highlight", "Flexible pricing for bride shows", 1],
    ["Bride show", "Videography", "Bride show video package", "Video coverage for a bride show event delivered on flash disk.", 23000, 23000, 33000, "Full video edit", "Flexible pricing for bride shows", 1],
    ["Studio Session", "Photography", "Portrait photo", "One portrait photo print or digital delivery.", 20000, null, null, "Per photo", "20,000 RWF per photo", 1],
    ["Studio Session", "Videography", "Videography hour", "Hourly videography coverage for portraits and short productions.", 30000, null, null, "Per hour", "From 30,000 RWF/hour", 1],
  ];

  const [existingServices] = await pool.query("SELECT id, name, category, subcategory FROM services");
  const existingByKey = new Map(existingServices.map((service) => [`${service.category}::${service.subcategory}::${service.name}`, service]));

  for (const service of defaultServices) {
    const key = `${service[0]}::${service[1]}::${service[2]}`;
    const existingService = existingByKey.get(key);

    if (existingService) {
      await pool.execute(
        `UPDATE services
         SET description = ?, price_rwf = ?, price_min_rwf = ?, price_max_rwf = ?, duration_label = ?, price_note = ?, is_active = ?
         WHERE id = ?`,
        [service[3], service[4], service[5], service[6], service[7], service[8], service[9], existingService.id]
      );
    } else {
      await pool.execute(
        `INSERT INTO services (category, subcategory, name, description, price_rwf, price_min_rwf, price_max_rwf, duration_label, price_note, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        service
      );
    }
  }

  const defaultAlbumTypes = [
    ["Regular", "Standard album finish for keepsakes and family albums.", 150000, 1],
    ["VIP", "Premium album finish with elevated materials and presentation.", 250000, 1],
  ];

  const [existingAlbumTypes] = await pool.query("SELECT id, name FROM album_types");
  const existingAlbumTypeByName = new Map(existingAlbumTypes.map((type) => [type.name.toLowerCase(), type]));

  for (const albumType of defaultAlbumTypes) {
    const key = albumType[0].toLowerCase();
    const existingAlbumType = existingAlbumTypeByName.get(key);

    if (existingAlbumType) {
      await pool.execute(
        `UPDATE album_types
         SET description = ?, price_rwf = ?, is_active = ?
         WHERE id = ?`,
        [albumType[1], albumType[2], albumType[3], existingAlbumType.id]
      );
    } else {
      await pool.execute(
        `INSERT INTO album_types (name, description, price_rwf, is_active) VALUES (?, ?, ?, ?)`,
        albumType
      );
    }
  }

  const [userCountRows] = await pool.query("SELECT COUNT(*) AS count FROM users");
  if (userCountRows[0].count === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || "mukizasocrates@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123!";
    const password_hash = bcrypt.hashSync(adminPassword, 10);
    await pool.execute(
      "INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
      [process.env.ADMIN_NAME || "Fotonix Admin", adminEmail, process.env.ADMIN_PHONE || "+250788000000", password_hash]
    );
  }
}

export default pool;
