import express from 'express';
import db from '../db.js';
import { resolveUser } from '../resolvers.js';

const router = express.Router();

// GET /users?username=:username or /users?email=:email
router.get('/', async (req, res) => {
    const { username, email } = req.query;
    let query = `SELECT id, username, email, display_name, profile_picture, description, follower_count, following_count FROM users`;
    let params = [];

    if (username) {
        query += ` WHERE username = ?`;
        params.push(username);
    } else if (email) {
        query += ` WHERE email = ?`;
        params.push(email);
    } else {
        return res.status(400).json({ error: "Query parameter 'username' or 'email' is required" });
    }

    db.get(query, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "User not found" });
        res.json(row);
    });
});

// GET /users/search?q=:query
router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const query = `
        SELECT id, username, display_name, description, profile_picture 
        FROM users 
        WHERE username LIKE ? OR display_name LIKE ? OR description LIKE ?
    `;
    const term = `%${q}%`;
    db.all(query, [term, term, term], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// PUT /users?username=:username
router.put('/', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const { display_name, profile_picture, description } = req.body;
    
    // Build dynamic UPDATE query to retain original values for unspecified fields
    let updates = [];
    let params = [];
    if (display_name !== undefined) { updates.push("display_name = ?"); params.push(display_name); }
    if (profile_picture !== undefined) { updates.push("profile_picture = ?"); params.push(profile_picture); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }

    if (updates.length === 0) return res.json({ message: "No fields to update" });

    params.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    
    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User updated successfully" });
    });
});

// DELETE /users?username=:username
router.delete('/', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User deleted successfully" });
    });
});

export default router;
