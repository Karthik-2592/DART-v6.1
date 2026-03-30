import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { resolveUser } from '../resolvers.js';
import { deleteUser } from '../utils/deletionRoutines.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../Storage/profilePic/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);

        // Try to get username from body or query
        const username = req.body.username || req.query.username || 'avatar';
        const sanitizedName = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        cb(null, sanitizedName + '_' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

// GET /users?username=:username or /users?email=:email
router.get('/', async (req, res) => {
    const { username, email } = req.query;
    let query = `SELECT id, username, email, display_name, profile_picture, description, follower_count, following_count FROM users`;
    let params = [];

    if (username) {
        query += ` WHERE username = ? COLLATE NOCASE`;
        params.push(username);
    } else if (email) {
        query += ` WHERE email = ?`;
        params.push(email);
    } else {
        return res.status(400).json({ error: "Query parameter 'username' or 'email' is required" });
    }

    console.log(`[USER] Requesting profile for identifier: ${username || email} (Type: ${username ? 'username' : 'email'})`);
    db.get(query, params, (err, row) => {
        if (err) {
            console.error(`[USER] DB Error fetching user: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            console.warn(`[USER] Profile lookup failed: User not found (${username || email})`);
            return res.status(404).json({ error: "User not found" });
        }
        console.log(`[USER] Profile retrieved successfully for: ${row.username} (ID: ${row.id})`);
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
router.put('/', upload.single('profile_picture'), async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const { display_name, description } = req.body;
    const profile_picture = req.file ? req.file.filename : undefined;
    
    // Build dynamic UPDATE query to retain original values for unspecified fields
    let updates = [];
    let params = [];
    if (display_name !== undefined) { updates.push("display_name = ?"); params.push(display_name); }
    if (profile_picture !== undefined) { updates.push("profile_picture = ?"); params.push(profile_picture); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }

    if (updates.length === 0) return res.json({ message: "No fields to update" });

    params.push(userId);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    
    console.log(`[USER] Updating user: ${username} (ID: ${userId}) with fields: ${updates.join(", ")}`);
    db.run(query, params, function (err) {
        if (err) {
            console.error(`[USER] DB Error updating user ${username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[USER] Successfully updated profile for user: ${username}`);
        res.json({ message: "User updated successfully", profile_picture });
    });
});

// DELETE /users?username=:username
router.delete('/', async (req, res) => {
    const { username } = req.query;
    const { password } = req.body;

    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });
    if (!password) return res.status(400).json({ error: "Password is required for account deletion" });

    const query = `SELECT id, password FROM users WHERE username = ? COLLATE NOCASE`;
    db.get(query, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify password
        if (user.password !== password) {
            console.warn(`[USER] Unauthorized deletion attempt for user: ${username}`);
            return res.status(401).json({ error: "Invalid password. Deletion aborted." });
        }

        console.log(`[USER] Deleting user: ${username} (ID: ${user.id}) and cascading all data/files.`);
        try {
            await deleteUser(user.id, db);
            console.log(`[USER] User "${username}" and all associated data/files successfully removed.`);
            res.json({ message: "Account and all associated data deleted successfully" });
        } catch (delErr) {
            console.error(`[USER] Error during cascading deletion for ${username}: ${delErr.message}`);
            res.status(500).json({ error: delErr.message });
        }
    });
});

// POST /users/register
router.post('/register', upload.single('profile_picture'), (req, res) => {
    const { username, password, email, display_name, description } = req.body;
    const profile_picture = req.file ? req.file.filename : null;
    
    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password and email are required" });
    }

    const query = `
        INSERT INTO users (username, password, email, display_name, profile_picture, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
        username, 
        password, 
        email, 
        display_name || 'New User', 
        profile_picture || null, 
        description || 'No bio provided.'
    ];

    console.log(`[USER] Registering new user: ${username} (${email})`);
    db.run(query, params, function (err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed")) {
                console.warn(`[USER] Registration collision: ${err.message}`);
                if (err.message.includes("username")) return res.status(409).json({ error: "Username is already taken" });
                if (err.message.includes("email")) return res.status(409).json({ error: "Email is already registered" });
            }
            console.error(`[USER] DB Error during registration for ${username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[USER] New account created! Username: ${username}, ID: ${this.lastID}`);
        res.status(201).json({ 
            id: this.lastID, 
            username, 
            email, 
            displayName: display_name || 'New User',
            profile_picture
        });
    });
});

// POST /users/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

    const query = `SELECT id, username, password, display_name as displayName FROM users WHERE username = ?`;
    console.log(`[USER] Login attempt for: ${username}`);
    db.get(query, [username], (err, user) => {
        if (err) {
            console.error(`[USER] DB Error during login lookup for ${username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        if (!user || user.password !== password) {
            console.warn(`[USER] Failed login attempt for username: ${username}`);
            return res.status(401).json({ error: "Invalid username or password" });
        }
        
        console.log(`[USER] Successful login: ${username} (ID: ${user.id})`);
        // Remove password before sending user data back
        delete user.password;
        res.json(user);
    });
});

export default router;
