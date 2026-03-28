import express from 'express';
import db from '../db.js';
import { resolveUser, resolveSong, resolvePlaylist } from '../resolvers.js';

const router = express.Router();

// POST /playlists?creator=:username - Create playlist by username
router.post('/', async (req, res) => {
    const { creator } = req.query;
    if (!creator) return res.status(400).json({ error: "Query parameter 'creator' is required" });

    const userId = await resolveUser(creator);
    if (!userId) return res.status(404).json({ error: "Creator user not found" });

    const { name, description } = req.body;
    db.run(`INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?)`, [name, description, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastrowid });
    });
});

// GET /playlists?name=:name&creator=:username - Get playlist details
router.get('/', async (req, res) => {
    const { name, creator } = req.query;
    if (!name || !creator) return res.status(400).json({ error: "Parameters 'name' and 'creator' are required" });

    const query = `
        SELECT p.* FROM playlists p
        JOIN users u ON p.user_id = u.id
        WHERE p.name = ? AND u.username = ?
    `;
    db.get(query, [name, creator], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Playlist not found" });
        res.json(row);
    });
});

// GET /playlists/user/:username - Get all playlists created by a specific user
router.get('/user/:username', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const query = `SELECT * FROM playlists WHERE user_id = ?`;
    db.all(query, [userId], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Populate songs for each playlist
        if (!rows || rows.length === 0) return res.json([]);
        
        const playlistsWithSongs = await Promise.all(rows.map(pl => {
            return new Promise((resolve, reject) => {
                const songQuery = `
                    SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists
                    FROM songs s
                    JOIN playlist_songs ps ON s.id = ps.song_id
                    LEFT JOIN song_contributors sc ON s.id = sc.song_id
                    LEFT JOIN users u ON sc.user_id = u.id
                    WHERE ps.playlist_id = ?
                    GROUP BY s.id
                `;
                db.all(songQuery, [pl.id], (err, songs) => {
                    if (err) reject(err);
                    else resolve({ ...pl, songs });
                });
            });
        }));
        
        res.json(playlistsWithSongs);
    });
});

// PUT /playlists?name=:name&creator=:username - Bulk modify metadata
router.put('/', async (req, res) => {
    const { name, creator } = req.query;
    if (!name || !creator) return res.status(400).json({ error: "Parameters 'name' and 'creator' are required" });

    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const { name: newName, description } = req.body;
    let updates = [];
    let params = [];
    if (newName !== undefined) { updates.push("name = ?"); params.push(newName); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }

    if (updates.length > 0) {
        params.push(playlistId);
        db.run(`UPDATE playlists SET ${updates.join(", ")} WHERE id = ?`, params, (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Playlist updated successfully" });
        });
    } else {
        res.json({ message: "No fields to update" });
    }
});

// DELETE /playlists?name=:name&creator=:username - Delete playlist
router.delete('/', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM playlist_shares WHERE playlist_id = ?`, [playlistId]);
        db.run(`DELETE FROM playlist_songs WHERE playlist_id = ?`, [playlistId]);
        db.run(`DELETE FROM playlists WHERE id = ?`, [playlistId], function (err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            db.run("COMMIT");
            res.json({ message: "Playlist and related data deleted successfully" });
        });
    });
});

// POST /playlists?name=:name&creator=:username/songs - Add song(s) to playlist
router.post('/songs', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const { songIds } = req.body;
    const placeholders = songIds.map(() => "(?, ?)").join(",");
    const values = [];
    songIds.forEach(sid => values.push(playlistId, sid));

    db.run(`INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id) VALUES ${placeholders}`, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Songs added to playlist" });
    });
});

// DELETE /playlists?name=:name&creator=:username/songs/:title - Remove song by title
router.delete('/songs/:songTitle', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    const songId = await resolveSong(req.params.songTitle);

    if (!playlistId || !songId) return res.status(404).json({ error: "Playlist or song not found" });

    db.run(`DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`, [playlistId, songId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Song removed from playlist" });
    });
});

// GET /playlists?name=:name&creator=:username/songs - List songs in playlist
router.get('/songs', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const query = `
        SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists
        FROM songs s
        JOIN playlist_songs ps ON s.id = ps.song_id
        LEFT JOIN song_contributors sc ON s.id = sc.song_id
        LEFT JOIN users u ON sc.user_id = u.id
        WHERE ps.playlist_id = ?
        GROUP BY s.id
    `;
    db.all(query, [playlistId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /playlists?name=:name&creator=:username/share/:username (Share playlist)
router.post('/share/:targetUsername', async (req, res) => {
    const { name, creator } = req.query;
    const [playlistId, targetUserId] = await Promise.all([
        resolvePlaylist(name, creator),
        resolveUser(req.params.targetUsername)
    ]);

    if (!playlistId || !targetUserId) return res.status(404).json({ error: "Playlist or user not found" });

    db.run(`INSERT OR IGNORE INTO playlist_shares (playlist_id, user_id) VALUES (?, ?)`, [playlistId, targetUserId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Playlist shared" });
    });
});

export default router;
