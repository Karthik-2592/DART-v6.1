import express from 'express';
import db from '../db.js';
import { resolveUser } from '../resolvers.js';

const router = express.Router();

// POST /users/:username/follow/:targetUsername - Follow another user by username
router.post('/:username/follow/:targetUsername', async (req, res) => {
    const [followerId, followingId] = await Promise.all([
        resolveUser(req.params.username),
        resolveUser(req.params.targetUsername)
    ]);

    if (!followerId || !followingId) return res.status(404).json({ error: "Follower or followed user not found" });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)`, [followerId, followingId], function(err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            if (this.changes > 0) {
                db.run(`UPDATE users SET following_count = following_count + 1 WHERE id = ?`, [followerId]);
                db.run(`UPDATE users SET follower_count = follower_count + 1 WHERE id = ?`, [followingId]);
            }
            db.run("COMMIT");
            res.json({ message: "Followed successfully" });
        });
    });
});

// DELETE /users/:username/follow/:targetUsername - Unfollow user by username
router.delete('/:username/follow/:targetUsername', async (req, res) => {
    const [followerId, followingId] = await Promise.all([
        resolveUser(req.params.username),
        resolveUser(req.params.targetUsername)
    ]);

    if (!followerId || !followingId) return res.status(404).json({ error: "Follower or followed user not found" });

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?`, [followerId, followingId], function(err) {
            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
            if (this.changes > 0) {
                db.run(`UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?`, [followerId]);
                db.run(`UPDATE users SET follower_count = MAX(0, follower_count - 1) WHERE id = ?`, [followingId]);
            }
            db.run("COMMIT");
            res.json({ message: "Unfollowed successfully" });
        });
    });
});

// GET /users/:username/followers - List followers by username
router.get('/:username/followers', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const query = `
        SELECT u.id, u.display_name, u.username, u.profile_picture 
        FROM users u
        JOIN user_follows uf ON u.id = uf.follower_id
        WHERE uf.following_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET /users/:username/following - List following by username
router.get('/:username/following', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const query = `
        SELECT u.id, u.display_name, u.username, u.profile_picture 
        FROM users u
        JOIN user_follows uf ON u.id = uf.following_id
        WHERE uf.follower_id = ?
    `;
    db.all(query, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

export default router;
