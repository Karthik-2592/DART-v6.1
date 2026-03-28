import express from 'express';
import db from '../db.js';
import { resolveSong } from '../resolvers.js';

const router = express.Router();

// GET /songs?title=:title
router.get('/', (req, res) => {
    const { title } = req.query;
    if (!title) {
        // Fallback to listing all songs if no title query
        const query = `
            SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
                   GROUP_CONCAT(u.display_name, ', ') AS artists
            FROM songs s
            LEFT JOIN song_contributors sc ON s.id = sc.song_id
            LEFT JOIN users u ON sc.user_id = u.id
            GROUP BY s.id
        `;
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
        return;
    }

    const query = `
        SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
               GROUP_CONCAT(u.display_name, ', ') AS artists
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE s.title = ?
        GROUP BY s.id
    `;
    db.all(query, [title], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /songs/search?q=:query
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const term = `%${q}%`;
    const query = `
        SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path, s.play_count,
               GROUP_CONCAT(u.display_name, ', ') AS artists
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE s.title LIKE ? OR s.genre LIKE ? OR CAST(s.release_year AS TEXT) LIKE ?
        GROUP BY s.id
    `;
    db.all(query, [term, term, term], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /songs/top?genre=:genre
router.get('/top', (req, res) => {
    const { genre } = req.query;
    let query = `
        SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists
        FROM songs s
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
    `;
    let params = [];
    if (genre) {
        query += ` WHERE s.genre = ?`;
        params.push(genre);
    }
    query += ` GROUP BY s.id ORDER BY s.play_count DESC`;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /songs?title=:title/play (Increment global play count)
router.post('/play', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    db.run(`UPDATE songs SET play_count = play_count + 1 WHERE id = ?`, [songId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Global play count incremented" });
    });
});

// PUT /songs?title=:title
router.put('/', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const { genre, release_year, release_month, cover_path, audio_path } = req.body;
    
    let updates = [];
    let params = [];
    if (genre !== undefined) { updates.push("genre = ?"); params.push(genre); }
    if (release_year !== undefined) { updates.push("release_year = ?"); params.push(release_year); }
    if (release_month !== undefined) { updates.push("release_month = ?"); params.push(release_month); }
    if (cover_path !== undefined) { updates.push("cover_path = ?"); params.push(cover_path); }
    if (audio_path !== undefined) { updates.push("audio_path = ?"); params.push(audio_path); }

    if (updates.length === 0) return res.json({ message: "No fields to update" });

    params.push(songId);
    const query = `UPDATE songs SET ${updates.join(", ")} WHERE id = ?`;
    
    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Song metadata updated successfully" });
    });
});

// POST /songs (Upload Track)
router.post('/', (req, res) => {
    const { title, genre, release_year, release_month, cover_path, audio_path } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

    db.run(`INSERT INTO songs (title, genre, release_year, release_month, cover_path, audio_path) VALUES (?, ?, ?, ?, ?, ?)`, 
    [title, genre, release_year, release_month, cover_path, audio_path], 
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Song uploaded successfully", id: this.lastID });
    });
});

export default router;
