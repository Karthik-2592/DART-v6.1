import express from 'express';
import supabase from '../supabaseClient.js';
import { resolveUser, resolveSong, resolvePlaylist } from '../resolvers.js';
import { deletePlaylist } from '../utils/deletionRoutines.js';
import { formatSongRows } from '../utils/formatters.js';

const router = express.Router();

// POST /playlists?creator=:username - Create playlist by username
router.post('/', async (req, res) => {
    const { creator } = req.query;
    if (!creator) return res.status(400).json({ error: "Query parameter 'creator' is required" });

    const userId = await resolveUser(creator);
    if (!userId) return res.status(404).json({ error: "Creator user not found" });

    const { name, description, songIds } = req.body;

    if (!name || name.trim().length === 0) return res.status(400).json({ error: "Playlist name is mandatory" });
    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
        return res.status(400).json({ error: "At least one song is mandatory to create a playlist" });
    }

    // 2. Uniqueness check (Name per User)
    const { data: existing } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', userId)
        .eq('name', name)
        .maybeSingle();

    if (existing) return res.status(400).json({ error: "Playlist name already exists for this user" });

    // 3. Create playlist
    console.log(`[PLAYLIST] Creating new playlist: "${name}" for creator: ${creator} (ID: ${userId})`);
    
    const { data: playlist, error: plError } = await supabase
        .from('playlists')
        .insert([{ name, description, user_id: userId }])
        .select('id')
        .single();

    if (plError) return res.status(500).json({ error: plError.message });

    const playlistId = playlist.id;
    const playlistSongs = songIds.map(sid => ({ playlist_id: playlistId, song_id: sid }));

    const { error: songsError } = await supabase
        .from('playlist_songs')
        .insert(playlistSongs);

    if (songsError) {
        // Rollback attempt
        await supabase.from('playlists').delete().eq('id', playlistId);
        return res.status(500).json({ error: "Error adding songs to new playlist" });
    }

    console.log(`[PLAYLIST] Playlist "${name}" (ID: ${playlistId}) created and populated successfully.`);
    res.status(201).json({ id: playlistId, message: "Playlist created successfully" });
});

// GET /playlists?name=:name&creator=:username - Get playlist details
router.get('/', async (req, res) => {
    const { name, creator } = req.query;
    if (!name || !creator) return res.status(400).json({ error: "Parameters 'name' and 'creator' are required" });

    const { data: row, error } = await supabase
        .from('playlists')
        .select('*, users!inner(username)')
        .eq('name', name)
        .eq('users.username', creator)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!row) return res.status(404).json({ error: "Playlist not found" });
    
    // Cleanup nested user record for frontend compatibility
    const { users, ...playlistData } = row;
    res.json(playlistData);
});

// GET /playlists/user/:username - Get all playlists created by a specific user
router.get('/user/:username', async (req, res) => {
    const userId = await resolveUser(req.params.username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const { data: playlists, error } = await supabase
        .from('playlists')
        .select(`
            *,
            playlist_songs (
                songs (
                    *,
                    song_contributors (
                        users (
                            display_name,
                            username
                        )
                    )
                )
            )
        `)
        .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    if (!playlists || playlists.length === 0) return res.json([]);

    const formattedPlaylists = await Promise.all(playlists.map(async (pl) => {
        const songs = (pl.playlist_songs || []).map(ps => ps.songs).filter(Boolean);
        const { playlist_songs, ...plData } = pl;
        return {
            ...plData,
            songs: await formatSongRows(songs)
        };
    }));

    res.json(formattedPlaylists);
});

// PUT /playlists?name=:name&creator=:username - Update playlist metadata, and songs
router.put('/', async (req, res) => {
    const { name, creator } = req.query;
    if (!name || !creator) return res.status(400).json({ error: "Parameters 'name' and 'creator' are required" });

    const [playlistId, userId] = await Promise.all([
        resolvePlaylist(name, creator),
        resolveUser(creator)
    ]);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    const { name: newName, description, songIds } = req.body;

    if (newName && newName !== name) {
        const { data: existing } = await supabase
            .from('playlists')
            .select('id')
            .eq('user_id', userId)
            .eq('name', newName)
            .maybeSingle();
        if (existing) return res.status(400).json({ error: "Playlist name already exists for this user" });
    }

    const updatePayload = {};
    if (newName !== undefined) updatePayload.name = newName;
    if (description !== undefined) updatePayload.description = description;

    if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase
            .from('playlists')
            .update(updatePayload)
            .eq('id', playlistId);
        if (error) return res.status(500).json({ error: error.message });
    }

    if (songIds && Array.isArray(songIds)) {
        if (songIds.length === 0) return res.status(400).json({ error: "At least one song is mandatory" });
        
        await supabase.from('playlist_songs').delete().eq('playlist_id', playlistId);
        const playlistSongs = songIds.map(sid => ({ playlist_id: playlistId, song_id: sid }));
        const { error } = await supabase.from('playlist_songs').insert(playlistSongs);
        if (error) return res.status(500).json({ error: "Error updating songs in playlist" });
    }

    console.log(`[PLAYLIST] Playlist ID: ${playlistId} updated successfully.`);
    res.json({ message: "Playlist updated successfully" });
});

// DELETE /playlists?name=:name&creator=:username - Delete playlist
router.delete('/', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    console.log(`[PLAYLIST] Deleting playlist: "${name}" by ${creator} (ID: ${playlistId}) and all associated records.`);
    try {
        await deletePlaylist(playlistId, supabase);
        console.log(`[PLAYLIST] Playlist ID: ${playlistId} and related data removed.`);
        res.json({ message: "Playlist and related data deleted successfully" });
    } catch (err) {
        console.error(`[PLAYLIST] Supabase Error during playlist deletion: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// GET /playlists?name=:name&creator=:username/songs - List songs in playlist
router.get('/songs', async (req, res) => {
    const { name, creator } = req.query;
    const playlistId = await resolvePlaylist(name, creator);
    if (!playlistId) return res.status(404).json({ error: "Playlist not found" });

    console.log(`[PLAYLIST] Fetching songs for playlist: ${name} (ID: ${playlistId})`);

    const { data: psRows, error } = await supabase
        .from('playlist_songs')
        .select(`
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
        .eq('playlist_id', playlistId);

    if (error) return res.status(500).json({ error: error.message });
    
    const songs = psRows.map(r => r.songs).filter(Boolean);
    res.json(await formatSongRows(songs));
});

export default router;
