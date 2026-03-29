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

    const { name, description, songIds } = req.body;

    // 1. Mandatory Fields Validation
    if (!name || name.trim().length === 0) return res.status(400).json({ error: "Playlist name is mandatory" });
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ error: "At least one song is mandatory to create a playlist" });
    }

    // 2. Uniqueness check (Name per User)
    db.get(`SELECT 1 FROM playlists WHERE user_id = ? AND name = ?`, [userId, name], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: "Playlist name already exists for this user" });

        // 3. Atomically create playlist and relations
        console.log(`[PLAYLIST] Creating new playlist: "${name}" for creator: ${creator} (ID: ${userId})`);
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            db.run(`INSERT INTO playlists (name, description, user_id) VALUES (?, ?, ?)`, [name, description, userId], function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
                const playlistId = this.lastID;

                // Add Songs
                const placeholders = songIds.map(() => "(?, ?)").join(",");
                const values = [];
                songIds.forEach(sid => values.push(playlistId, sid));
                db.run(`INSERT INTO playlist_songs (playlist_id, song_id) VALUES ${placeholders}`, values, (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: "Error adding songs to new playlist" });
                    }

                    db.run("COMMIT", () => {
                        console.log(`[PLAYLIST] Playlist "${name}" (ID: ${playlistId}) created and populated successfully.`);
                        res.status(201).json({ id: playlistId, message: "Playlist created successfully" });
                    });
                });
            });
        });
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
                    SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists, GROUP_CONCAT(u.username, ', ') AS artist_usernames
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

// PUT /playlists?name=:name&creator=:username - Update playlist metadata, and songs
router.put('/', async (req, res) => {
    const { name, creator } = req.query;
    if (!name || !creator) return res.status(400).json({ error: "Parameters 'name' and 'creator' are required" });

    const [playlistId, userId] = await Promise.all([
        resolvePlaylist(name, creator),
        resolveUser(creator)
    ]);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const { name: newName, description, songIds } = req.body;

    // 1. Uniqueness check if name is changing
    if (newName && newName !== name) {
        const existing = await new Promise(resolve => {
            db.get(`SELECT 1 FROM playlists WHERE user_id = ? AND name = ?`, [userId, newName], (err, row) => resolve(row));
        });
        if (existing) return res.status(400).json({ error: "Playlist name already exists for this user" });
    }

    // 2. Perform updates in a transaction
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Metadata update
        let updates = [];
        let params = [];
        if (newName !== undefined) { updates.push("name = ?"); params.push(newName); }
        if (description !== undefined) { updates.push("description = ?"); params.push(description); }

        const finish = (err) => {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            db.run("COMMIT", () => {
                console.log(`[PLAYLIST] Playlist ID: ${playlistId} updated successfully.`);
                res.json({ message: "Playlist updated successfully" });
            });
        };

        const updatePlaylistMetadata = () => {
            if (updates.length > 0) {
                params.push(playlistId);
                db.run(`UPDATE playlists SET ${updates.join(", ")} WHERE id = ?`, params, (err) => {
                    if (err) return finish(err);
                    updateSongs();
                });
            } else {
                updateSongs();
            }
        };

        const updateSongs = () => {
            if (songIds && Array.isArray(songIds)) {
                if (songIds.length === 0) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: "At least one song is mandatory" });
                }
                db.run(`DELETE FROM playlist_songs WHERE playlist_id = ?`, [playlistId], (err) => {
                    if (err) return finish(err);
                    const placeholders = songIds.map(() => "(?, ?)").join(",");
                    const values = [];
                    songIds.forEach(sid => values.push(playlistId, sid));
                    db.run(`INSERT INTO playlist_songs (playlist_id, song_id) VALUES ${placeholders}`, values, (err) => {
                        finish(err);
                    });
                });
            } else {
                finish();
            }
        };

        updatePlaylistMetadata();
    });
});
/////////////////////////////////////////////////////////////
// DELETE /playlists?name=:name&creator=:username - Delete playlist
router.delete('/', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    console.log(`[PLAYLIST] Deleting playlist: "${name}" by ${creator} (ID: ${playlistId}) and all associated records.`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
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


// GET /playlists?name=:name&creator=:username/songs - List songs in playlist
router.get('/songs', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const query = `
        SELECT s.*, GROUP_CONCAT(u.display_name, ', ') AS artists, GROUP_CONCAT(u.username, ', ') AS artist_usernames
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

export default router;
