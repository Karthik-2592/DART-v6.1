import express from 'express';
import supabase from '../supabaseClient.js';
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
    
    // Check if already following
    const { data: existing } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

    if (!existing) {
        const { error: insError } = await supabase
            .from('user_follows')
            .insert([{ follower_id: followerId, following_id: followingId }]);

        if (insError) {
            console.error(`[FOLLOW] Supabase Error during follow: ${insError.message}`);
            return res.status(500).json({ error: insError.message });
        }

        console.log(`[FOLLOW] Relationship established. Updating connection counts...`);
        
        // Update following_count for follower
        const { data: follower } = await supabase.from('users').select('following_count').eq('id', followerId).single();
        await supabase.from('users').update({ following_count: (follower.following_count || 0) + 1 }).eq('id', followerId);

        // Update follower_count for following
        const { data: following } = await supabase.from('users').select('follower_count').eq('id', followingId).single();
        await supabase.from('users').update({ follower_count: (following.follower_count || 0) + 1 }).eq('id', followingId);
    }
    
    console.log(`[FOLLOW] User ${req.params.username} successfully followed ${req.params.targetUsername}.`);
    res.json({ message: "Followed successfully" });
});

// DELETE /users/:username/follow/:targetUsername - Unfollow user by username
router.delete('/:username/follow/:targetUsername', async (req, res) => {
    const [followerId, followingId] = await Promise.all([
        resolveUser(req.params.username),
        resolveUser(req.params.targetUsername)
    ]);

    if (!followerId || !followingId) return res.status(404).json({ error: "Follower or followed user not found" });

    console.log(`[FOLLOW] User ${req.params.username} (ID: ${followerId}) unfollowing ${req.params.targetUsername} (ID: ${followingId})`);
    
    const { data: existing } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

    if (existing) {
        const { error: delError } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (delError) {
            console.error(`[FOLLOW] Supabase Error during unfollow: ${delError.message}`);
            return res.status(500).json({ error: delError.message });
        }

        console.log(`[FOLLOW] Relationship removed. Updating connection counts...`);
        
        // Update following_count for follower
        const { data: follower } = await supabase.from('users').select('following_count').eq('id', followerId).single();
        await supabase.from('users').update({ following_count: Math.max(0, (follower.following_count || 0) - 1) }).eq('id', followerId);

        // Update follower_count for following
        const { data: following } = await supabase.from('users').select('follower_count').eq('id', followingId).single();
        await supabase.from('users').update({ follower_count: Math.max(0, (following.follower_count || 0) - 1) }).eq('id', followingId);
    }

    console.log(`[FOLLOW] User ${req.params.username} no longer following ${req.params.targetUsername}.`);
    res.json({ message: "Unfollowed successfully" });
});

// GET /users/:username/followers - List followers by username
router.get('/:username/followers', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    console.log(`[FOLLOW] Listing followers for user: ${req.params.username} (ID: ${userId})`);
    
    const { data: rows, error } = await supabase
        .from('user_follows')
        .select(`
            users:follower_id (
                id,
                display_name,
                username,
                profile_picture
            )
        `)
        .eq('following_id', userId);

    if (error) {
        console.error(`[FOLLOW] Supabase Error fetching followers for ${req.params.username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    const flatRows = rows.map(r => r.users).filter(Boolean);
    console.log(`[FOLLOW] User ${req.params.username} has ${flatRows.length} followers.`);
    res.json(flatRows);
});

// GET /users/:username/following - List following by username
router.get('/:username/following', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    console.log(`[FOLLOW] Listing following for user: ${req.params.username} (ID: ${userId})`);
    
    const { data: rows, error } = await supabase
        .from('user_follows')
        .select(`
            users:following_id (
                id,
                display_name,
                username,
                profile_picture
            )
        `)
        .eq('follower_id', userId);

    if (error) {
        console.error(`[FOLLOW] Supabase Error fetching following for ${req.params.username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    const flatRows = rows.map(r => r.users).filter(Boolean);
    console.log(`[FOLLOW] User ${req.params.username} is following ${flatRows.length} users.`);
    res.json(flatRows);
});

export default router;
