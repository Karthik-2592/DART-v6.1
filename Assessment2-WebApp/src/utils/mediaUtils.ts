/**
 * Centralized utility to handle media URLs.
 * It intelligently handles both full URLs (Supabase Signed URLs) 
 * and legacy relative paths from the local server.
 */

export const getMediaUrl = (path: string | null | undefined, type?: 'audio' | 'cover' | 'profilePic'): string => {
  if (!path) return '';
  
  // If it's already a full URL (Supabase Signed URL or external), return it as-is
  if (path.startsWith('http')) return path;
  
  const baseUrl = 'http://localhost:5000';
  
  // Remove redundant 'Storage/' or 'storage/' prefix if present in the legacy path string
  // This helps when the frontend hasn't been updated to match the new DB record format yet.
  const cleanPath = path.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, '');
  
  // If a type is specified, use the specific legacy static route
  if (type) {
    return `${baseUrl}/${type}/${encodeURIComponent(cleanPath)}`;
  }
  
  // Fallback: try to split and encode if it looks like a path
  return `${baseUrl}/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;
};
