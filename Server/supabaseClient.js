import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);
export const BUCKET_NAME = 'Storage';

/**
 * Generates a signed URL for a given path in the main bucket.
 */
export const getSignedURL = async (path, expiry = 3600) => {
    if (!path) return null;
    
    // Remove 'storage/' or 'Storage/' prefix if it's there
    let cleanPath = path.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, '');

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cleanPath, expiry);

    if (error) {
        console.error(`[STORAGE] Error generating signed URL for ${cleanPath}:`, error.message);
        return null;
    }

    return data.signedUrl;
};

export default supabase;
