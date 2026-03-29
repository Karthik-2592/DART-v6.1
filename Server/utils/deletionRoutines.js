import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Removes all <Playlist, Song> associations for a given playlist.
 */
export const removePlaylistSongPairs = (playlistId, db) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM playlist_songs WHERE playlist_id = ?`, [playlistId], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

/**
 * Removes all <User, Song> associations (contributors and favorites) for a given song.
 */
export const removeUserSongPairs = (songId, db) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`DELETE FROM song_contributors WHERE song_id = ?`, [songId]);
            db.run(`DELETE FROM favorites WHERE song_id = ?`, [songId], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
};

/**
 * Removes all <User, User> associations (follows) for a given user.
 */
export const removeUserFollowPairs = (userId, db) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM user_follows WHERE follower_id = ? OR followed_id = ?`, [userId, userId], (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

/**
 * Deletes a playlist and its associated song pairs.
 */
export const deletePlaylist = async (playlistId, db) => {
    await removePlaylistSongPairs(playlistId, db);
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM playlists WHERE id = ?`, [playlistId], (err) => {
            if (err) return reject(err);
            console.log(`[ROUTINE] Playlist ID ${playlistId} and its associations removed.`);
            resolve();
        });
    });
};

/**
 * Deletes a song, its associations, and its physical files.
 */
export const deleteSong = async (songId, db) => {
    // 1. Get file paths to delete
    const song = await new Promise((resolve) => {
        db.get(`SELECT cover_path, audio_path FROM songs WHERE id = ?`, [songId], (err, row) => resolve(row));
    });

    if (song) {
        // Delete physical files
        [song.cover_path, song.audio_path].forEach(filePath => {
            if (filePath) {
                const fullPath = path.join(__dirname, '../', filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                    console.log(`[ROUTINE] Deleted file: ${fullPath}`);
                }
            }
        });
    }

    // 2. Remove DB associations
    await removeUserSongPairs(songId, db);
    // Also remove from any playlists
    await new Promise((resolve) => db.run(`DELETE FROM playlist_songs WHERE song_id = ?`, [songId], resolve));

    // 3. Delete song record
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM songs WHERE id = ?`, [songId], (err) => {
            if (err) return reject(err);
            console.log(`[ROUTINE] Song ID ${songId} and its database/file records removed.`);
            resolve();
        });
    });
};

/**
 * Orchestrates full user deletion including playlists, songs, follows, and files.
 */
export const deleteUser = async (userId, db) => {
    // 1. Get user data for file cleanup
    const user = await new Promise((resolve) => {
        db.get(`SELECT profile_picture FROM users WHERE id = ?`, [userId], (err, row) => resolve(row));
    });

    // 2. Delete user's playlists
    const playlists = await new Promise((resolve) => {
        db.all(`SELECT id FROM playlists WHERE user_id = ?`, [userId], (err, rows) => resolve(rows || []));
    });
    for (const pl of playlists) {
        await deletePlaylist(pl.id, db);
    }

    // 3. Delete user's song contributions (removing them as contributor)
    // If the song has NO other contributors, delete the song entirely?
    // As per user request "corresponding files uploads", we'll delete the songs where they contributed.
    // To be safe, we'll only delete the song entirely if they were the only contributor.
    const contributions = await new Promise((resolve) => {
        db.all(`SELECT song_id FROM song_contributors WHERE user_id = ?`, [userId], (err, rows) => resolve(rows || []));
    });
    for (const c of contributions) {
        const otherContributors = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as count FROM song_contributors WHERE song_id = ? AND user_id != ?`, [c.song_id, userId], (err, row) => resolve(row.count));
        });
        if (otherContributors === 0) {
            await deleteSong(c.song_id, db);
        } else {
            // Just remove them as contributor
            await new Promise((resolve) => db.run(`DELETE FROM song_contributors WHERE song_id = ? AND user_id = ?`, [c.song_id, userId], resolve));
        }
    }

    // 4. Remove follows and favorites
    await removeUserFollowPairs(userId, db);
    await new Promise((resolve) => db.run(`DELETE FROM favorites WHERE user_id = ?`, [userId], resolve));

    // 5. Delete profile picture
    if (user?.profile_picture) {
        const ppPath = path.join(__dirname, '../Storage/profilePic/', user.profile_picture);
        if (fs.existsSync(ppPath)) {
            fs.unlinkSync(ppPath);
            console.log(`[ROUTINE] Deleted profile picture: ${ppPath}`);
        }
    }

    // 6. Delete user record
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
            if (err) return reject(err);
            console.log(`[ROUTINE] User ID ${userId} and all associated data/files removed.`);
            resolve();
        });
    });
};
