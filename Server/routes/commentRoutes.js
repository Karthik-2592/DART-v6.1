import express from 'express';
import db from '../db.js';

const router = express.Router();

// POST /comments
// Creates a new comment for a song
router.post('/', (req, res) => {
    const { song_id, user_id, text } = req.body;

    if (!song_id || !user_id || !text) {
        return res.status(400).json({ error: "song_id, user_id, and text are required" });
    }

    if (text.length > 400) {
        return res.status(400).json({ error: "Comment text cannot exceed 400 characters" });
    }

    const query = `
        INSERT INTO comments (song_id, user_id, text)
        VALUES (?, ?, ?)
    `;

    db.run(query, [song_id, user_id, text], function (err) {
        if (err) {
            console.error("[COMMENT] Error creating comment:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Comment created successfully", id: this.lastID });
    });
});

// GET /comments/song/:songId
// Fetches all comments for a given song
router.get('/song/:songId', (req, res) => {
    const { songId } = req.params;

    const query = `
        SELECT c.id, c.text, c.like_count, c.created_at, u.username, u.display_name, u.profile_picture
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.song_id = ?
        ORDER BY c.created_at DESC
    `;

    db.all(query, [songId], (err, rows) => {
        if (err) {
            console.error(`[COMMENT] Error fetching comments for song ${songId}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET /comments/user/:userId
// Fetches all comments authored by a given user
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT c.id, c.text, c.like_count, c.created_at, s.title as song_title, s.cover_path
        FROM comments c
        JOIN songs s ON c.song_id = s.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`[COMMENT] Error fetching comments for user ${userId}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST /comments/:id/like
// Increments the like_count for a comment
router.post('/:id/like', (req, res) => {
    const { id } = req.params;

    const query = `
        UPDATE comments
        SET like_count = like_count + 1
        WHERE id = ?
    `;

    db.run(query, [id], function (err) {
        if (err) {
            console.error(`[COMMENT] Error liking comment ${id}:`, err.message);
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ message: "Comment liked successfully" });
    });
});

// DELETE /comments/:id
// Deletes a specific comment
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        DELETE FROM comments
        WHERE id = ?
    `;

    db.run(query, [id], function (err) {
        if (err) {
            console.error(`[COMMENT] Error deleting comment ${id}:`, err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "Comment not found" });
        }

        res.json({ message: "Comment deleted successfully" });
    });
});

export default router;
