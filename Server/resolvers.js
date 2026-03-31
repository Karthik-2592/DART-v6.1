import supabase from './supabaseClient.js';

export const resolveUser = async (identifier, type = 'username') => {
    const column = type === 'email' ? 'email' : 'username';
    const { data: row, error } = await supabase
        .from('users')
        .select('id')
        .eq(column, identifier)
        .maybeSingle();

    if (error) throw error;
    return row ? row.id : null;
};

export const resolveSong = async (title) => {
    const { data: row, error } = await supabase
        .from('songs')
        .select('id')
        .eq('title', title)
        .maybeSingle();

    if (error) throw error;
    return row ? row.id : null;
};

export const resolvePlaylist = async (name, creatorUsername) => {
    const { data: row, error } = await supabase
        .from('playlists')
        .select('id, users!inner(username)')
        .eq('name', name)
        .eq('users.username', creatorUsername)
        .maybeSingle();

    if (error) throw error;
    return row ? row.id : null;
};
