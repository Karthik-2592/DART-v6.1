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
    console.log(`[CONTRIBUTOR] Adding ${userIds.length} contributor(s) to track: ${title} (ID: ${songId})`);
    db.run(query, values, function (err) {
        if (err) {
            console.error(`[CONTRIBUTOR] DB Error adding contributors to ${title}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[CONTRIBUTOR] Successfully added ${this.changes} new contributor(s) to "${title}".`);
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
    console.log(`[CONTRIBUTOR] Fetching contributor list for track: ${title} (ID: ${songId})`);
    db.all(query, [songId], (err, rows) => {
        if (err) {
            console.error(`[CONTRIBUTOR] DB Error fetching contributors for ${title}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[CONTRIBUTOR] Found ${rows.length} contributor(s) for "${title}".`);
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
        SELECT s.*, GROUP_CONCAT(u2.display_name, ', ') AS artists, GROUP_CONCAT(u2.username, ', ') AS artist_usernames
        FROM songs s
        JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN song_contributors sc2 ON s.id = sc2.song_id
        LEFT JOIN users u2 ON sc2.user_id = u2.id
        WHERE sc.user_id = ?
        GROUP BY s.id
    `;
    console.log(`[CONTRIBUTOR] Fetching track contributions for user: ${username} (ID: ${userId})`);
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`[CONTRIBUTOR] DB Error fetching contributions for ${username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[CONTRIBUTOR] Found ${rows.length} contributed track(s) for user "${username}".`);
        res.json(rows);
    });
});

export default router;
