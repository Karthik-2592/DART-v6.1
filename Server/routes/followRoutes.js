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

    console.log(`[FOLLOW] User ${req.params.username} (ID: ${followerId}) following ${req.params.targetUsername} (ID: ${followingId})`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`INSERT OR IGNORE INTO user_follows (follower_id, following_id) VALUES (?, ?)`, [followerId, followingId], function(err) {
            if (err) { 
                console.error(`[FOLLOW] DB Error during follow transaction: ${err.message}`);
                db.run("ROLLBACK"); 
                return res.status(500).json({ error: err.message }); 
            }
            if (this.changes > 0) {
                console.log(`[FOLLOW] Relationship established. Updating connection counts...`);
            db.run(`UPDATE users SET following_count = following_count + 1 WHERE id = ?`, [followerId], (err) => {
                if (err) console.error(`[FOLLOW] Error incrementing following_count for ${req.params.username}: ${err.message}`);
            });
            db.run(`UPDATE users SET follower_count = follower_count + 1 WHERE id = ?`, [followingId], (err) => {
                if (err) console.error(`[FOLLOW] Error incrementing follower_count for ${req.params.targetUsername}: ${err.message}`);
            });
            db.run("COMMIT", () => {
                console.log(`[FOLLOW] Transaction committed. User ${req.params.username} successfully followed ${req.params.targetUsername}.`);
                res.json({ message: "Followed successfully" });
            });
        }
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

    console.log(`[FOLLOW] User ${req.params.username} (ID: ${followerId}) unfollowing ${req.params.targetUsername} (ID: ${followingId})`);
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        db.run(`DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?`, [followerId, followingId], function(err) {
            if (err) { 
                console.error(`[FOLLOW] DB Error during unfollow transaction: ${err.message}`);
                db.run("ROLLBACK"); 
                return res.status(500).json({ error: err.message }); 
            }
            if (this.changes > 0) {
                console.log(`[FOLLOW] Relationship removed. Updating connection counts...`);
            db.run(`UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?`, [followerId], (err) => {
                if (err) console.error(`[FOLLOW] Error decrementing following_count for ${req.params.username}: ${err.message}`);
            });
            db.run(`UPDATE users SET follower_count = MAX(0, follower_count - 1) WHERE id = ?`, [followingId], (err) => {
                if (err) console.error(`[FOLLOW] Error decrementing follower_count for ${req.params.targetUsername}: ${err.message}`);
            });
            db.run("COMMIT", () => {
                console.log(`[FOLLOW] Unfollow transaction committed. User ${req.params.username} no longer following ${req.params.targetUsername}.`);
                res.json({ message: "Unfollowed successfully" });
            });
        }
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
    console.log(`[FOLLOW] Listing followers for user: ${req.params.username} (ID: ${userId})`);
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`[FOLLOW] DB Error fetching followers for ${req.params.username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[FOLLOW] User ${req.params.username} has ${rows.length} followers.`);
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
    console.log(`[FOLLOW] Listing following for user: ${req.params.username} (ID: ${userId})`);
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error(`[FOLLOW] DB Error fetching following for ${req.params.username}: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        console.log(`[FOLLOW] User ${req.params.username} is following ${rows.length} users.`);
        res.json(rows);
    });
});

export default router;
