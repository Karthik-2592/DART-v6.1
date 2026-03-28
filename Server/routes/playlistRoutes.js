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
    console.log(`[PLAYLIST] Creating new playlist: "${name}" for creator: ${creator} (ID: ${userId})`);
    db.run(`INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?)`, [name, description, userId], function (err) {
        if (err) {
            console.error(`[PLAYLIST] DB Error creating playlist "${name}": ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[PLAYLIST] Playlist "${name}" created successfully. ID: ${this.lastID}`);
        res.status(201).json({ id: this.lastID });
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
        console.log(`[PLAYLIST] Updating metadata for playlist ID: ${playlistId} (${name} by ${creator}). Fields: ${updates.join(", ")}`);
        db.run(`UPDATE playlists SET ${updates.join(", ")} WHERE id = ?`, params, (err) => {
            if (err) {
                console.error(`[PLAYLIST] DB Error updating playlist metadata: ${err.message}`);
                return res.status(500).json({ error: err.message });
            }
            console.log(`[PLAYLIST] Playlist ID: ${playlistId} metadata updated successfully.`);
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

    console.log(`[PLAYLIST] Deleting playlist: "${name}" by ${creator} (ID: ${playlistId}) and all associated records.`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM playlist_shares WHERE playlist_id = ?`, [playlistId]);
        db.run(`DELETE FROM playlist_songs WHERE playlist_id = ?`, [playlistId]);
        db.run(`DELETE FROM playlists WHERE id = ?`, [playlistId], function (err) {
            if (err) { 
                console.error(`[PLAYLIST] DB Error during playlist deletion transaction: ${err.message}`);
                db.run("ROLLBACK"); 
                return res.status(500).json({ error: err.message }); 
            }
            db.run("COMMIT");
            console.log(`[PLAYLIST] Playlist ID: ${playlistId} and related data removed.`);
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

    console.log(`[PLAYLIST] Adding ${songIds.length} song(s) to playlist ID: ${playlistId} ("${name}")`);
    db.run(`INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id) VALUES ${placeholders}`, values, (err) => {
        if (err) {
            console.error(`[PLAYLIST] DB Error adding songs to playlist ID: ${playlistId}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[PLAYLIST] Successfully added matching song(s) to playlist ID: ${playlistId}.`);
        res.json({ message: "Songs added to playlist" });
    });
});

// DELETE /playlists?name=:name&creator=:username/songs/:title - Remove song by title
router.delete('/songs/:songTitle', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    const songId = await resolveSong(req.params.songTitle);

    if (!playlistId || !songId) return res.status(404).json({ error: "Playlist or song not found" });

    console.log(`[PLAYLIST] Removing song Title: "${req.params.songTitle}" (ID: ${songId}) from playlist ID: ${playlistId} ("${name}")`);
    db.run(`DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?`, [playlistId, songId], (err) => {
        if (err) {
            console.error(`[PLAYLIST] DB Error removing song from playlist: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[PLAYLIST] Song removed from playlist ID: ${playlistId}.`);
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

    console.log(`[PLAYLIST] Sharing playlist ID: ${playlistId} ("${name}") with user: ${req.params.targetUsername} (ID: ${targetUserId})`);
    db.run(`INSERT OR IGNORE INTO playlist_shares (playlist_id, user_id) VALUES (?, ?)`, [playlistId, targetUserId], (err) => {
        if (err) {
            console.error(`[PLAYLIST] DB Error sharing playlist: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[PLAYLIST] Playlist ID: ${playlistId} now shared with user: ${req.params.targetUsername}.`);
        res.json({ message: "Playlist shared" });
    });
});

export default router;
