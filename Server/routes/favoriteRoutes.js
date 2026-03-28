import express from 'express';
import db from '../db.js';
import { resolveUser, resolveSong } from '../resolvers.js';

const router = express.Router();

// POST /favorites?username=:username&title=:title - Favorite a song by username + song title
router.post('/', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId) return res.status(404).json({ error: "User not found" });
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const query = `INSERT OR IGNORE INTO favorites (user_id, song_id) VALUES (?, ?)`;
    db.run(query, [userId, songId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Song favorited" });
    });
});

// DELETE /favorites?username=:username&title=:title - Unfavorite a song
router.delete('/', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId) return res.status(404).json({ error: "User not found" });
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const query = `DELETE FROM favorites WHERE user_id = ? AND song_id = ?`;
    db.run(query, [userId, songId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Favorite removed" });
    });
});

// GET /favorites?username=:username&title=:title/playcount - User's play count for a song
router.get('/playcount', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId || !songId) return res.status(404).json({ error: "User or song not found" });

    const query = `SELECT user_play_count FROM favorites WHERE user_id = ? AND song_id = ?`;
    db.get(query, [userId, songId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ play_count: row ? row.user_play_count : 0 });
    });
});

// POST /favorites?username=:username&title=:title/play - Increment user's play count
router.post('/play', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId || !songId) return res.status(404).json({ error: "User or song not found" });

    const query = `UPDATE favorites SET user_play_count = user_play_count + 1 WHERE user_id = ? AND song_id = ?`;
    db.run(query, [userId, songId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User play count incremented" });
    });
});

// GET /users/:username/favorites - Retrieve all songs favorited by a user by username
router.get('/user/:username', async (req, res) => {
    const { username } = req.params;
    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const query = `
        SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists, f.user_play_count
        FROM songs s
        JOIN favorites f ON s.id = f.song_id
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE f.user_id = ?
        GROUP BY s.id
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

export default router;
