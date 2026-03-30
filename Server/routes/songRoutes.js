import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { resolveSong } from '../resolvers.js';
import { deleteSong } from '../utils/deletionRoutines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage for both covers and audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = '';
        if (file.fieldname === 'audio') {
            uploadDir = path.join(__dirname, '../Storage/audio/');
        } else {
            uploadDir = path.join(__dirname, '../Storage/cover/');
        }

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        
        // Use title from body if available, otherwise fallback to fieldname
        const baseName = req.body.title || (file.fieldname === 'audio' ? 'track' : 'cover');
        const sanitizedBase = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const finalPrefix = file.fieldname === 'audio' ? sanitizedBase : `${sanitizedBase}_cover`;
        
        cb(null, finalPrefix + '_' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB general limit (per file)
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
            const allowed = ['.mp3', '.flac', '.wav'];
            const ext = path.extname(file.originalname).toLowerCase();
            if (!allowed.includes(ext)) {
                return cb(new Error("Only .mp3, .flac, and .wav files are allowed for audio"), false);
            }
        }
        cb(null, true);
    }
});

const router = express.Router();

// Helper: Resolve artist names to user IDs. Returns { valid, ids, missing }
async function resolveArtistNames(namesArray) {
    if (!namesArray || namesArray.length === 0) return { valid: false, ids: [], missing: [] };

    // Clean names
    const cleanNames = namesArray.map(n => n.trim()).filter(n => n.length > 0);
    if (cleanNames.length === 0) return { valid: false, ids: [], missing: [] };

    return new Promise((resolve) => {
        const placeholders = cleanNames.map(() => "?").join(",");
        const query = `SELECT id, username FROM users WHERE username IN (${placeholders})`;
        db.all(query, cleanNames, (err, rows) => {
            if (err) return resolve({ valid: false, ids: [], missing: [], error: err.message });

            const foundNames = rows.map(r => r.username.toLowerCase());
            const missing = cleanNames.filter(n => !foundNames.includes(n.toLowerCase()));

            if (missing.length > 0) {
                resolve({ valid: false, ids: [], missing });
            } else {
                resolve({ valid: true, ids: rows.map(r => r.id), missing: [] });
            }
        });
    });
}

// Helper: Check song uniqueness (title + artist set)
async function isSongUnique(title, artistIds, excludeSongId = null) {
    return new Promise((resolve) => {
        // This is a complex check. We find songs with the same title, then check if they have the exact same artist set.
        const query = `
            SELECT s.id, GROUP_CONCAT(sc.user_id) as artists
            FROM songs s
            JOIN song_contributors sc ON s.id = sc.song_id
            WHERE s.title = ? ${excludeSongId ? 'AND s.id != ?' : ''}
            GROUP BY s.id
        `;
        const params = excludeSongId ? [title, excludeSongId] : [title];

        db.all(query, params, (err, rows) => {
            if (err) return resolve(false);

            const targetSet = new Set(artistIds);
            const isDuplicate = rows.some(row => {
                const rowArtistIds = row.artists.split(',').map(id => parseInt(id, 10));
                if (rowArtistIds.length !== artistIds.length) return false;
                return rowArtistIds.every(id => targetSet.has(id));
            });

            resolve(!isDuplicate);
        });
    });
}

// GET /songs?title=:title or list all
router.get('/', (req, res) => {
    const { title } = req.query;
    let query = `
        SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
               GROUP_CONCAT(u.display_name, ', ') AS artists,
               GROUP_CONCAT(u.username, ', ') AS artist_usernames
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
    `;
    let params = [];
    if (title) {
        query += ` WHERE s.title = ?`;
        params.push(title);
    }
    query += ` GROUP BY s.id`;

    console.log(`[SONG] Listing tracks${title ? ` matching: ${title}` : '...'}`);
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /songs/search?q=:query - Search songs by title, genre, or artist
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query 'q' required" });

    const query = `
        SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
               GROUP_CONCAT(u.display_name, ', ') AS artists,
               GROUP_CONCAT(u.username, ', ') AS artist_usernames
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE s.title LIKE ? OR s.genre LIKE ? OR u.username LIKE ? OR u.display_name LIKE ?
        GROUP BY s.id
    `;
    const searchParam = `%${q}%`;
    console.log(`[SONG] Searching tracks matching: "${q}"`);
    db.all(query, [searchParam, searchParam, searchParam, searchParam], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /songs/:id - Fetch a single song by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) return res.status(400).json({ error: "Invalid song ID" });

    const query = `
        SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
               GROUP_CONCAT(u.display_name, ', ') AS artists,
               GROUP_CONCAT(u.username, ', ') AS artist_usernames
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE s.id = ?
        GROUP BY s.id
    `;
    console.log(`[SONG] Fetching metadata for Track ID: ${id}`);
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Song not found" });
        res.json(row);
    });
});

// POST /songs (Upload Track)
router.post('/', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    const { title, genre, release_year, artists } = req.body;
    const cover_path = req.files['cover'] ? `Storage/cover/${req.files['cover'][0].filename}` : null;
    const audio_path = req.files['audio'] ? `Storage/audio/${req.files['audio'][0].filename}` : null;

    // 1. Basic Validation
    if (!audio_path) return res.status(400).json({ error: "Audio file is required for new uploads" });
    if (!title || title.length > 128) return res.status(400).json({ error: "Valid title required (max 128 chars)" });

    const year = parseInt(release_year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > currentYear) {
        return res.status(400).json({ error: `Release year must be between 2000 and ${currentYear}` });
    }

    // 2. Artist Validation
    const artistNames = artists ? artists.split(',') : [];
    const artistResolution = await resolveArtistNames(artistNames);
    if (!artistResolution.valid) {
        return res.status(400).json({ error: `Artists not found in database: ${artistResolution.missing.join(', ')}` });
    }

    // 3. Uniqueness Check
    const unique = await isSongUnique(title, artistResolution.ids);
    if (!unique) {
        return res.status(409).json({ error: "A song with this title and artist set already exists." });
    }

    // 4. DB Operations
    console.log(`[SONG] Finalizing upload for: ${title} by [${artists}]`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT INTO songs (title, genre, release_year, cover_path, audio_path) VALUES (?, ?, ?, ?, ?)`,
            [title, genre, year, cover_path, audio_path],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
                const songId = this.lastID;
                const contributorQuery = `INSERT INTO song_contributors (song_id, user_id) VALUES (?, ?)`;

                let completed = 0;
                artistResolution.ids.forEach(uId => {
                    db.run(contributorQuery, [songId, uId], (err) => {
                        if (err) { /* rollback handled below */ }
                        completed++;
                        if (completed === artistResolution.ids.length) {
                            db.run("COMMIT");
                            console.log(`[SONG] Track [ID: ${songId}] "${title}" uploaded successfully with ${completed} artists.`);
                            res.status(201).json({ message: "Song uploaded successfully", id: songId, cover_path });
                        }
                    });
                });
            });
    });
});

// PUT /songs (Edit Track by ID)
router.put('/', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Query parameter 'id' is required for editing" });

    const { title, genre, release_year, artists } = req.body;
    const new_cover = req.files['cover'] ? `Storage/cover/${req.files['cover'][0].filename}` : undefined;
    const new_audio = req.files['audio'] ? `Storage/audio/${req.files['audio'][0].filename}` : undefined;

    // 1. Validation
    if (title && title.length > 128) return res.status(400).json({ error: "Title too long (max 128)" });
    if (release_year) {
        const year = parseInt(release_year, 10);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > currentYear) {
            return res.status(400).json({ error: "Invalid year" });
        }
    }

    // 2. Complex Update Logic (if artists are provided)
    let artistIds = [];
    if (artists) {
        const artistResolution = await resolveArtistNames(artists.split(','));
        if (!artistResolution.valid) {
            return res.status(400).json({ error: `Artists not found: ${artistResolution.missing.join(', ')}` });
        }
        artistIds = artistResolution.ids;
    }
    // 3. Check uniqueness if title or artists changed (simplified for edit)
    let updates = [];
    let params = [];
    if (title) { updates.push("title = ?"); params.push(title); }
    if (genre) { updates.push("genre = ?"); params.push(genre); }
    if (release_year) { updates.push("release_year = ?"); params.push(parseInt(release_year, 10)); }
    if (new_cover) { updates.push("cover_path = ?"); params.push(new_cover); }
    if (new_audio) { updates.push("audio_path = ?"); params.push(new_audio); }

    if (updates.length === 0 && !artists) return res.json({ message: "No changes requested" });

    params.push(id);
    const query = `UPDATE songs SET ${updates.join(", ")} WHERE id = ?`;

    console.log(`[SONG] Editing track ID: ${id}. Updates: ${updates.join(', ')}`);

    // Handle File Replacement
    if (new_cover || new_audio) {
        db.get(`SELECT cover_path, audio_path FROM songs WHERE id = ?`, [id], (err, row) => {
            if (!err && row) {
                if (new_cover && row.cover_path) {
                    const oldFilename = row.cover_path.includes('/') ? row.cover_path.split('/').pop() : row.cover_path;
                    const oldPath = path.join(__dirname, '../Storage/cover/', oldFilename);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
                if (new_audio && row.audio_path) {
                    const oldFilename = row.audio_path.includes('/') ? row.audio_path.split('/').pop() : row.audio_path;
                    const oldPath = path.join(__dirname, '../Storage/audio/', oldFilename);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            }
        });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        if (updates.length > 0) {
            db.run(query, params, (err) => {
                if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            });
        }

        if (artists) {
            // Re-sync contributors (Delete all, Insert new)
            db.run(`DELETE FROM song_contributors WHERE song_id = ?`, [id]);
            artistIds.forEach(uId => {
                db.run(`INSERT INTO song_contributors (song_id, user_id) VALUES (?, ?)`, [id, uId]);
            });
        }

        db.run("COMMIT", () => {
            console.log(`[SONG] Track ID: ${id} updated metadata and artists.`);
            res.json({ message: "Song updated successfully", cover_path: new_cover, audio_path: new_audio });
        });
    });
});

// POST /songs/play
router.post('/play', async (req, res) => {
    const { title } = req.query;
    console.log(`[SONG] Playing track: ${title}`);
    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    db.run(`UPDATE songs SET play_count = play_count + 1 WHERE id = ?`, [songId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT play_count FROM songs WHERE id = ?`, [songId], (err, row) => {
            if (!err && row) console.log(`[SONG] Global play count incremented for Track ID: ${songId}. Current: ${row.play_count}`);
            res.json({ message: "Global play count incremented", play_count: row ? row.play_count : undefined });
        });
    });
});

// DELETE /songs?id=:id
router.delete('/', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Query parameter 'id' is required for deletion" });

    console.log(`[SONG] Deleting track ID: ${id}`);
    deleteSong(id, db)
        .then(() => res.json({ message: "Song deleted successfully" }))
        .catch(err => {
            console.error(`[SONG] DB Error deleting song ${id}: ${err.message}`);
            res.status(500).json({ error: err.message });
        });
});

export default router;
