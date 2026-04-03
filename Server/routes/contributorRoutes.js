import express from 'express';
import supabase from '../supabaseClient.js';
import { resolveUser, resolveSong } from '../resolvers.js';

import { formatSongRows, formatUserRows } from '../utils/formatters.js';

const router = express.Router();

// POST /contributors - Add contributor(s) by song title
router.post('/contributors', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const { userIds } = req.body;
    if (!Array.isArray(userIds)) return res.status(400).json({ error: "userIds must be an array" });

    const contributors = userIds.map(uid => ({ song_id: songId, user_id: uid }));

    console.log(`[CONTRIBUTOR] Adding ${userIds.length} contributor(s) to track: ${title} (ID: ${songId})`);

    // Supabase insert with upsert behavior or just direct insert if duplicates aren't an issue.
    // PostgreSQL equivalent of 'INSERT OR IGNORE' is 'ON CONFLICT DO NOTHING'.
    // In Supabase client, we use upsert with specific options or just handle it gracefully.
    const { data, error, count } = await supabase
        .from('song_contributors')
        .upsert(contributors, { onConflict: 'song_id, user_id' })
        .select();

    if (error) {
        console.error(`[CONTRIBUTOR] Supabase Error adding contributors to ${title}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    const changes = data ? data.length : 0;
    console.log(`[CONTRIBUTOR] Successfully added ${changes} contributor(s) (including existing) to "${title}".`);
    res.json({ message: "Contributors added/synced successfully", count: changes });
});

// GET /contributors - List contributors for a song by title
router.get('/contributors', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Query parameter 'title' is required" });

    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    console.log(`[CONTRIBUTOR] Fetching contributor list for track: ${title} (ID: ${songId})`);

    const { data: rows, error } = await supabase
        .from('song_contributors')
        .select(`
            users (
                id,
                display_name,
                username,
                profile_picture
            )
        `)
        .eq('song_id', songId);

    if (error) {
        console.error(`[CONTRIBUTOR] Supabase Error fetching contributors for ${title}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    const flatRows = rows.map(r => r.users).filter(Boolean);
    const formatted = await formatUserRows(flatRows);
    
    console.log(`[CONTRIBUTOR] Found ${formatted.length} contributor(s) for "${title}".`);
    res.json(formatted);
});

// GET /contributions - List songs contributed by a user by username
router.get('/contributions', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    console.log(`[CONTRIBUTOR] Fetching track contributions for user: ${username} (ID: ${userId})`);

    // We need songs where user_id = userId in song_contributors, 
    // AND we want to fetch all other artists for those songs.
    const { data: contributionRows, error: cError } = await supabase
        .from('song_contributors')
        .select('song_id')
        .eq('user_id', userId);

    if (cError) return res.status(500).json({ error: cError.message });

    const songIds = contributionRows.map(r => r.song_id);
    if (songIds.length === 0) return res.json([]);

    const { data: rows, error } = await supabase
        .from('songs')
        .select(`
            *,
            song_contributors (
                users (
                    display_name,
                    username
                )
            )
        `)
        .in('id', songIds);

    if (error) {
        console.error(`[CONTRIBUTOR] Supabase Error fetching contributions for ${username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    const formatted = await formatSongRows(rows);
    console.log(`[CONTRIBUTOR] Found ${formatted.length} contributed track(s) for user "${username}".`);
    res.json(formatted);
});

export default router;
