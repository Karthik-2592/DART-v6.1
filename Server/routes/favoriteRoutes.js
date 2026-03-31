import express from 'express';
import supabase from '../supabaseClient.js';
import { resolveUser, resolveSong } from '../resolvers.js';
import { formatSongRows } from '../utils/formatters.js';

const router = express.Router();

// POST /favorites?username=:username&title=:title - Favorite a song by username + song title
router.post('/', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId) return res.status(404).json({ error: "User not found" });
    if (!songId) return res.status(404).json({ error: "Song not found" });

    console.log(`[FAVORITE] User "${username}" (ID: ${userId}) favoriting song: "${title}" (ID: ${songId})`);
    
    // Check if already exists
    const { data: existing } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle();

    if (!existing) {
        const { error: insError } = await supabase
            .from('favorites')
            .insert([{ user_id: userId, song_id: songId }]);

        if (insError) {
            console.error(`[FAVORITE] Supabase Error favoriting song: ${insError.message}`);
            return res.status(500).json({ error: insError.message });
        }

        console.log(`[FAVORITE] New relationship created. Incrementing global favorite_count for song ID: ${songId}...`);
        
        // Increment global favorite_count
        const { data: song } = await supabase.from('songs').select('favorite_count').eq('id', songId).single();
        await supabase.from('songs').update({ favorite_count: (song.favorite_count || 0) + 1 }).eq('id', songId);
    }
    
    console.log(`[FAVORITE] Transaction complete. Song "${title}" favorited.`);
    res.status(201).json({ message: "Song favorited" });
});

// DELETE /favorites?username=:username&title=:title - Unfavorite a song
router.delete('/', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId) return res.status(404).json({ error: "User not found" });
    if (!songId) return res.status(404).json({ error: "Song not found" });

    console.log(`[FAVORITE] User "${username}" (ID: ${userId}) unfavoriting song: "${title}" (ID: ${songId})`);
    
    const { data: existing } = await supabase
        .from('favorites')
        .select('song_id')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle();

    if (existing) {
        const { error: delError } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('song_id', songId);

        if (delError) {
            console.error(`[FAVORITE] Supabase Error removing favorite: ${delError.message}`);
            return res.status(500).json({ error: delError.message });
        }

        console.log(`[FAVORITE] Relationship removed. Decrementing global favorite_count for song ID: ${songId}...`);
        const { data: song } = await supabase.from('songs').select('favorite_count').eq('id', songId).single();
        await supabase.from('songs').update({ favorite_count: Math.max(0, (song.favorite_count || 0) - 1) }).eq('id', songId);
    }

    console.log(`[FAVORITE] Transaction complete. Song "${title}" unfavorited.`);
    res.json({ message: "Favorite removed" });
});

// GET /favorites?username=:username&title=:title/playcount - User's play count for a song
router.get('/playcount', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId || !songId) return res.status(404).json({ error: "User or song not found" });

    const { data: row, error } = await supabase
        .from('favorites')
        .select('user_play_count')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.json({ play_count: row ? row.user_play_count : 0 });
});

// POST /favorites?username=:username&title=:title/play - Increment user's play count
router.post('/play', async (req, res) => {
    const { username, title } = req.query;
    if (!username || !title) return res.status(400).json({ error: "Query parameters 'username' and 'title' are required" });

    const [userId, songId] = await Promise.all([resolveUser(username), resolveSong(title)]);
    if (!userId || !songId) return res.status(404).json({ error: "User or song not found" });

    const { data: row, error: fetchError } = await supabase
        .from('favorites')
        .select('user_play_count')
        .eq('user_id', userId)
        .eq('song_id', songId)
        .maybeSingle();

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (row) {
        const new_count = (row.user_play_count || 0) + 1;
        const { error: updateError } = await supabase
            .from('favorites')
            .update({ user_play_count: new_count })
            .eq('user_id', userId)
            .eq('song_id', songId);

        if (updateError) {
            console.error(`[FAVORITE] Supabase Error incrementing user play count: ${updateError.message}`);
            return res.status(500).json({ error: updateError.message });
        }
        console.log(`[FAVORITE] User-specific play count incremented for: ${username} on track: ${title}. Current: ${new_count}`);
        res.json({ message: "User play count incremented", user_play_count: new_count });
    } else {
        res.json({ message: "Track not in favorites, user-specific stats ignored." });
    }
});

// GET /users/:username/favorites - Retrieve all songs favorited by a user by username
router.get('/user/:username', async (req, res) => {
    const { username } = req.params;
    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    console.log(`[FAVORITE] Fetching all favorites for user: ${username} (ID: ${userId})`);
    
    const { data: rows, error } = await supabase
        .from('favorites')
        .select(`
            user_play_count,
            songs (
                *,
                song_contributors (
                    users (
                        display_name,
                        username
                    )
                )
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error(`[FAVORITE] Supabase Error fetching favorites for ${username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    const songs = rows.map(r => r.songs).filter(Boolean);
    const formattedSongs = await formatSongRows(songs);
    
    const formatted = rows.map((r, i) => {
        return {
            ...formattedSongs[i],
            user_play_count: r.user_play_count
        };
    });

    console.log(`[FAVORITE] User "${username}" has ${formatted.length} favorite songs.`);
    res.json(formatted);
});

export default router;
