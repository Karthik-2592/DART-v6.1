import express from 'express';
import supabase from '../supabaseClient.js';
import { formatCommentRows } from '../utils/formatters.js';

const router = express.Router();

// POST /comments
// Creates a new comment for a song
router.post('/', async (req, res) => {
    const { song_id, user_id, text } = req.body;

    if (!song_id || !user_id || !text) {
        return res.status(400).json({ error: "song_id, user_id, and text are required" });
    }

    if (text.length > 400) {
        return res.status(400).json({ error: "Comment text cannot exceed 400 characters" });
    }

    console.log(`[COMMENT] creating comment for song ID: ${song_id} by user ID: ${user_id}`);
    
    const { data, error } = await supabase
        .from('comments')
        .insert([{ song_id, user_id, text }])
        .select('id')
        .single();

    if (error) {
        console.error("[COMMENT] Supabase Error creating comment:", error.message);
        return res.status(500).json({ error: error.message });
    }
    
    console.log(`[COMMENT] comment created successfully with ID: ${data.id}`);
    res.status(201).json({ message: "Comment created successfully", id: data.id });
});

// GET /comments/song/:songId
// Fetches all comments for a given song
router.get('/song/:songId', async (req, res) => {
    const { songId } = req.params;

    const { data: rows, error } = await supabase
        .from('comments')
        .select(`
            id, text, like_count, created_at,
            users (
                username,
                display_name,
                profile_picture
            )
        `)
        .eq('song_id', songId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`[COMMENT] Supabase Error fetching comments for song ${songId}:`, error.message);
        return res.status(500).json({ error: error.message });
    }
    
    // Generate signed URLs for user profile pictures
    const rowsWithSignedURLs = await formatCommentRows(rows);
    
    const formatted = rowsWithSignedURLs.map((r) => {
        const { users, ...commentData } = r;
    
        return {
            ...commentData,
            username: users?.username,
            display_name: users?.display_name,
            profile_picture: users?.profile_picture
        };
    });
    
    console.log(`[COMMENT] fetched ${formatted.length} comments for song ${songId}`);
    res.json(formatted);
});

// GET /comments/user/:userId
// Fetches all comments authored by a given user
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params;

    const { data: rows, error } = await supabase
        .from('comments')
        .select(`
            id, text, like_count, created_at,
            songs (
                title,
                cover_path
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`[COMMENT] Supabase Error fetching comments for user ${userId}:`, error.message);
        return res.status(500).json({ error: error.message });
    }
    
    const formatted = rows.map(r => {
        const { songs, ...commentData } = r;
        return {
            ...commentData,
            song_title: songs?.title,
            cover_path: songs?.cover_path
        };
    });
    
    console.log(`[COMMENT] fetched ${formatted.length} comments authored by user ${userId}`);
    res.json(formatted);
});

// POST /comments/:id/like
// Increments the like_count for a comment
router.post('/:id/like', async (req, res) => {
    const { id } = req.params;

    const { data: current, error: fetchError } = await supabase
        .from('comments')
        .select('like_count')
        .eq('id', id)
        .maybeSingle();
    
    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!current) return res.status(404).json({ error: "Comment not found" });

    const new_count = (current.like_count || 0) + 1;
    const { error: updateError } = await supabase
        .from('comments')
        .update({ like_count: new_count })
        .eq('id', id);

    if (updateError) {
        console.error(`[COMMENT] Supabase Error liking comment ${id}:`, updateError.message);
        return res.status(500).json({ error: updateError.message });
    }
        
    console.log(`[COMMENT] comment ${id} liked successfully. New count: ${new_count}`);
    res.json({ message: "Comment liked successfully" });
});

// DELETE /comments/:id
// Deletes a specific comment
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const { error, count } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`[COMMENT] Supabase Error deleting comment ${id}:`, error.message);
        return res.status(500).json({ error: error.message });
    }

    console.log(`[COMMENT] comment ${id} deleted successfully`);
    res.json({ message: "Comment deleted successfully" });
});

export default router;
