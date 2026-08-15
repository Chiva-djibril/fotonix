import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

function generateSlug() {
  return crypto.randomBytes(9).toString("base64url");
}

function getAlbumUrl(filename) {
  return `/uploads/${filename}`;
}

async function getAlbumById(albumId, userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM albums WHERE id = ? AND user_id = ?",
    [albumId, userId]
  );
  return rows[0];
}

async function getAlbumPhotos(albumId) {
  const [rows] = await pool.execute(
    "SELECT id, filename, url, mimetype, size, created_at FROM album_photos WHERE album_id = ? ORDER BY created_at DESC",
    [albumId]
  );
  return rows;
}

router.get("/public/:slug", async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const [albums] = await pool.execute("SELECT id, title, cover_url, slug, created_at FROM albums WHERE slug = ?", [slug]);
    const album = albums[0];
    if (!album) return res.status(404).json({ error: "Album not found." });

    const photos = await getAlbumPhotos(album.id);
    res.json({ album: { ...album, photos } });
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth);

// Since the server already has its own requireAuth middleware, these routes will be mounted
// from server.js after that middleware is applied. The route still expects req.user.

router.get("/types", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM album_types WHERE is_active = 1 ORDER BY name ASC"
    );
    res.json({ albumTypes: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(403).json({ error: "Only an administrator can create albums." });
  } catch (err) {
    next(err);
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const [albums] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.cover_url, a.created_at, COUNT(p.id) AS photo_count
        , a.album_type_id, at.name AS album_type_name
       FROM albums a
       LEFT JOIN album_photos p ON p.album_id = a.id
        LEFT JOIN album_types at ON at.id = a.album_type_id
       WHERE a.user_id = ?
       GROUP BY a.id
       ORDER BY a.updated_at DESC, a.created_at DESC`,
      [req.user.id]
    );
    res.json({ albums });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id, req.user.id);
    if (!album) return res.status(404).json({ error: "Album not found." });

    const photos = await getAlbumPhotos(album.id);
    res.json({ album: { ...album, photos } });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/photos', upload.array('photos', 100), async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id, req.user.id);
    if (!album) return res.status(404).json({ error: 'Album not found.' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one photo.' });
    }

    const insertPromises = req.files.map((file) => {
      const url = getAlbumUrl(file.filename);
      return pool.execute(
        "INSERT INTO album_photos (album_id, user_id, filename, url, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)",
        [album.id, req.user.id, file.originalname, url, file.mimetype, file.size]
      );
    });
    await Promise.all(insertPromises);

    if (!album.cover_url && req.files.length > 0) {
      const [first] = req.files;
      const coverUrl = getAlbumUrl(first.filename);
      await pool.execute("UPDATE albums SET cover_url = ? WHERE id = ?", [coverUrl, album.id]);
    }

    const photos = await getAlbumPhotos(album.id);
    const [updatedAlbums] = await pool.execute("SELECT id, title, slug, cover_url, created_at FROM albums WHERE id = ?", [album.id]);
    res.json({ album: { ...updatedAlbums[0], photos } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/cover', async (req, res, next) => {
  try {
    const { photoId } = req.body;
    const album = await getAlbumById(req.params.id, req.user.id);
    if (!album) return res.status(404).json({ error: 'Album not found.' });

    const [photos] = await pool.execute(
      "SELECT url FROM album_photos WHERE id = ? AND album_id = ?",
      [photoId, album.id]
    );
    if (!photos[0]) return res.status(404).json({ error: 'Photo not found.' });

    await pool.execute("UPDATE albums SET cover_url = ? WHERE id = ?", [photos[0].url, album.id]);
    res.json({ ok: true, cover_url: photos[0].url });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/photos/:photoId', async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id, req.user.id);
    if (!album) return res.status(404).json({ error: 'Album not found.' });

    const [photos] = await pool.execute(
      "SELECT * FROM album_photos WHERE id = ? AND album_id = ?",
      [req.params.photoId, album.id]
    );
    const photo = photos[0];
    if (!photo) return res.status(404).json({ error: 'Photo not found.' });

    await pool.execute("DELETE FROM album_photos WHERE id = ?", [photo.id]);

    if (album.cover_url === photo.url) {
      const [remaining] = await pool.execute(
        "SELECT url FROM album_photos WHERE album_id = ? ORDER BY created_at DESC LIMIT 1",
        [album.id]
      );
      await pool.execute("UPDATE albums SET cover_url = ? WHERE id = ?", [remaining[0]?.url || null, album.id]);
    }

    if (photo.filename) {
      const filePath = path.join(uploadDir, path.basename(photo.url));
      fs.unlink(filePath, () => {});
    }

    const photosAfter = await getAlbumPhotos(album.id);
    res.json({ photos: photosAfter });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const album = await getAlbumById(req.params.id, req.user.id);
    if (!album) return res.status(404).json({ error: 'Album not found.' });

    const [photos] = await pool.execute("SELECT * FROM album_photos WHERE album_id = ?", [album.id]);
    await pool.execute("DELETE FROM album_photos WHERE album_id = ?", [album.id]);
    await pool.execute("DELETE FROM albums WHERE id = ?", [album.id]);

    for (const photo of photos) {
      if (photo.filename) {
        const filePath = path.join(uploadDir, path.basename(photo.url));
        fs.unlink(filePath, () => {});
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
