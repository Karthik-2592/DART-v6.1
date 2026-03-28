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

    console.log(`[FAVORITE] User "${username}" (ID: ${userId}) favoriting song: "${title}" (ID: ${songId})`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT OR IGNORE INTO favorites (user_id, song_id) VALUES (?, ?)`, [userId, songId], function (err) {
            if (err) {
                console.error(`[FAVORITE] DB Error favoriting song: ${err.message}`);
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            if (this.changes > 0) {
                console.log(`[FAVORITE] New relationship created. Incrementing global favorite_count for song ID: ${songId}...`);
                db.run(`UPDATE songs SET favorite_count = favorite_count + 1 WHERE id = ?`, [songId]);
            }
            db.run("COMMIT");
            console.log(`[FAVORITE] Transaction complete. Song "${title}" favorited.`);
            res.status(201).json({ message: "Song favorited" });
        });
    });
});

// DELETE /favorites?username=:username&title=:title - Unfavorite a song
router.delete('/', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId) return res.status(404).json({ error: "User not found" });
    if (!songId) return res.status(404).json({ error: "Song not found" });

    console.log(`[FAVORITE] User "${username}" (ID: ${userId}) unfavoriting song: "${title}" (ID: ${songId})`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM favorites WHERE user_id = ? AND song_id = ?`, [userId, songId], function (err) {
            if (err) {
                console.error(`[FAVORITE] DB Error removing favorite: ${err.message}`);
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }
            if (this.changes > 0) {
                console.log(`[FAVORITE] Relationship removed. Decrementing global favorite_count for song ID: ${songId}...`);
                db.run(`UPDATE songs SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?`, [songId]);
            }
            db.run("COMMIT");
            console.log(`[FAVORITE] Transaction complete. Song "${title}" unfavorited.`);
            res.json({ message: "Favorite removed" });
        });
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
        if (err) {
            console.error(`[FAVORITE] DB Error incrementing user play count: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes > 0) {
            console.log(`[FAVORITE] User-specific play count incremented for: ${username} on track: ${title}`);
            res.json({ message: "User play count incremented" });
        } else {
            // Track not in favorites - skip logging and return no-op message
            res.json({ message: "Track not in favorites, user-specific stats ignored." });
        }
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
    console.log(`[FAVORITE] Fetching all favorites for user: ${username} (ID: ${userId})`);
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`[FAVORITE] DB Error fetching favorites for ${username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[FAVORITE] User "${username}" has ${rows.length} favorite songs.`);
        res.json(rows);
    });
});

export default router;
