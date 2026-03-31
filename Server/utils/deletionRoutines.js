import { BUCKET_NAME } from '../supabaseClient.js';

/**
 * Removes all <Playlist, Song> associations for a given playlist.
 */
export const removePlaylistSongPairs = async (playlistId, supabase) => {
    const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId);
    
    if (error) throw error;
};

/**
 * Removes all <User, Song> associations (contributors and favorites) for a given song.
 */
export const removeUserSongPairs = async (songId, supabase) => {
    const { error: error1 } = await supabase
        .from('song_contributors')
        .delete()
        .eq('song_id', songId);
    if (error1) throw error1;

    const { error: error2 } = await supabase
        .from('favorites')
        .delete()
        .eq('song_id', songId);
    if (error2) throw error2;
};

/**
 * Removes all <User, User> associations (follows) for a given user.
 */
export const removeUserFollowPairs = async (userId, supabase) => {
    const { error } = await supabase
        .from('user_follows')
        .delete()
        .or(`follower_id.eq.${userId},followed_id.eq.${userId}`);
    
    if (error) throw error;
};

/**
 * Deletes a playlist and its associated song pairs.
 */
export const deletePlaylist = async (playlistId, supabase) => {
    await removePlaylistSongPairs(playlistId, supabase);
    const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);
    
    if (error) throw error;
    console.log(`[ROUTINE] Playlist ID ${playlistId} and its associations removed.`);
};

/**
 * Deletes a song, its associations, and its physical files.
 */
export const deleteSong = async (songId, supabase) => {
    // 1. Get file paths to delete
    const { data: song, error: fetchError } = await supabase
        .from('songs')
        .select('cover_path, audio_path')
        .eq('id', songId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (song) {
        // Delete objects from bucket
        const filesToRemove = [song.cover_path, song.audio_path]
            .filter(Boolean)
            .map(p => p.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, ''));

        if (filesToRemove.length > 0) {
            const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove(filesToRemove);
            
            if (storageError) {
                console.error(`[ROUTINE] Error removing storage for song ${songId}: ${storageError.message}`);
            } else {
                console.log(`[ROUTINE] Removed bucket storage for song ${songId}: ${filesToRemove.join(', ')}`);
            }
        }
    }

    // 2. Remove DB associations
    await removeUserSongPairs(songId, supabase);
    const { error: plError } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('song_id', songId);
    if (plError) throw plError;

    // 3. Delete song record
    const { error: delError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
        
    if (delError) throw delError;
    console.log(`[ROUTINE] Song ID ${songId} and its database/file records removed.`);
};

/**
 * Orchestrates full user deletion including playlists, songs, follows, and files.
 */
export const deleteUser = async (userId, supabase) => {
    // 1. Get user data for file cleanup
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('profile_picture')
        .eq('id', userId)
        .maybeSingle();

    if (userError) throw userError;

    // 2. Delete user's playlists
    const { data: playlists, error: plError } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', userId);
    
    if (plError) throw plError;
    for (const pl of playlists || []) {
        await deletePlaylist(pl.id, supabase);
    }

    // 3. Delete user's song contributions (removing them as contributor)
    const { data: contributions, error: cError } = await supabase
        .from('song_contributors')
        .select('song_id')
        .eq('user_id', userId);
    
    if (cError) throw cError;
    for (const c of contributions || []) {
        const { count, error: countError } = await supabase
            .from('song_contributors')
            .select('*', { count: 'exact', head: true })
            .eq('song_id', c.song_id)
            .neq('user_id', userId);

        if (countError) throw countError;

        if (count === 0) {
            await deleteSong(c.song_id, supabase);
        } else {
            const { error: remError } = await supabase
                .from('song_contributors')
                .delete()
                .eq('song_id', c.song_id)
                .eq('user_id', userId);
            if (remError) throw remError;
        }
    }

    // 4. Remove follows and favorites
    await removeUserFollowPairs(userId, supabase);
    const { error: favError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);
    if (favError) throw favError;

    // 5. Delete profile picture from bucket
    if (user?.profile_picture) {
        const cleanPP = user.profile_picture.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, '');
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([cleanPP]);
        
        if (storageError) {
            console.error(`[ROUTINE] Error removing PP for user ${userId}: ${storageError.message}`);
        } else {
            console.log(`[ROUTINE] Removed profile picture for user ${userId}: ${cleanPP}`);
        }
    }

    // 6. Delete user record
    const { error: delError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    
    if (delError) throw delError;
    console.log(`[ROUTINE] User ID ${userId} and all associated data/files removed.`);
};

