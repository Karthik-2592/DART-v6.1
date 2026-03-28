import express from 'express';
import db from '../db.js';
import { resolveUser, resolveSong } from '../resolvers.js';

const router = express.Router();

// POST /songs?title=:title/contributors - Add contributor(s) by song title
router.post('/contributors', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const { userIds } = req.body;
    if (!Array.isArray(userIds)) return res.status(400).json({ error: "userIds must be an array" });

    const placeholders = userIds.map(() => "(?, ?)").join(",");
    const values = [];
    userIds.forEach(uid => values.push(songId, uid));

    const query = `INSERT OR IGNORE INTO song_contributors (song_id, user_id) VALUES ${placeholders}`;
    db.run(query, values, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Contributors added successfully", count: this.changes });
    });
});

// GET /songs?title=:title/contributors - List contributors for a song by title
router.get('/contributors', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const query = `
        SELECT u.id, u.display_name, u.username, u.profile_picture 
        FROM users u
        JOIN song_contributors sc ON u.id = sc.user_id
        WHERE sc.song_id = ?
    `;
    db.all(query, [songId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /users?username=:username/contributions - List songs contributed by a user by username
router.get('/contributions', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const query = `
        SELECT s.*, GROUP_CONCAT(u2.display_name, ', ') AS artists
        FROM songs s
        JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN song_contributors sc2 ON s.id = sc2.song_id
        LEFT JOIN users u2 ON sc2.user_id = u2.id
        WHERE sc.user_id = ?
        GROUP BY s.id
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

export default router;
