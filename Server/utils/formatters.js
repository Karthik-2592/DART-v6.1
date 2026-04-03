import { getSignedURL } from '../supabaseClient.js';

/**
 * Common formatter for song records to generate signed URLs and flatten artists.
 * Used across songRoutes, playlistRoutes, and favoriteRoutes.
 */
export async function formatSongRows(rows) {
    if (!rows) return [];
    return Promise.all(rows.map(async (row) => {
        if (!row) return null;

        const contributors = row.song_contributors || [];
        const artists = contributors.map(c => c.users?.display_name).filter(Boolean).join(', ');
        const artist_usernames = contributors.map(c => c.users?.username).filter(Boolean).join(', ');
        // Generate Signed URLs for cover and audio
        const [cover_url, audio_url] = await Promise.all([
            getSignedURL(row.cover_path),
            getSignedURL(row.audio_path)
        ]);

        const { song_contributors, ...songData } = row;
        return {
            ...songData,
            artists,
            artist_usernames,
            cover_path: cover_url,
            audio_path: audio_url
        };
    })).then(results => results.filter(Boolean));
}

/**
 * Common formatter for user records to generate signed URLs for profile pictures.
 */
export async function formatUserRows(rows) {
    if (!rows) return [];
    return Promise.all(rows.map(async (row) => {
        if (!row) return null;
        if (row.profile_picture) {
            // Remove storage prefix before signing
            const cleanPath = row.profile_picture.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, '');
            row.profile_picture = await getSignedURL(cleanPath);
        }
        
        return row;
    })).then(results => results.filter(Boolean));
}

/**
 * Common formatter for comment records to generate signed URLs for user profiles.
 */
export async function formatCommentRows(rows) {
    if (!rows) return [];
    return Promise.all(rows.map(async (row) => {
        if (!row || !row.users) return row;

        const [formattedUser] = await formatUserRows([row.users]);
        row.users = formattedUser;

        return row;
    }));
}


