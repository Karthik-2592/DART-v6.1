import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
    "https://urmdxbdffxmxsndgybdg.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVybWR4YmRmZnhteHNuZGd5YmRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMzg4NiwiZXhwIjoyMDkwMjA5ODg2fQ.evTu1RRyrSdQngSowLm9y1UiGi2HXk3IqOS9hqWrxJY"
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
