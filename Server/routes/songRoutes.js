import express from 'express';
import multer from 'multer';
import supabase, { BUCKET_NAME, getSignedURL } from '../supabaseClient.js';
import { resolveSong } from '../resolvers.js';
import { deleteSong } from '../utils/deletionRoutines.js';
import { formatSongRows } from '../utils/formatters.js';

// Configure multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
            const allowed = ['.mp3', '.flac', '.wav'];
            if (!file.originalname.match(/\.(mp3|flac|wav)$/i)) {
                return cb(new Error("Only .mp3, .flac, and .wav files are allowed for audio"), false);
            }
        }
        cb(null, true);
    }
});

const router = express.Router();

// Helper: Generate unique filename for songs/covers
const generateFileName = (title, fieldname, originalName) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = originalName.split('.').pop();
    const sanitizedBase = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalPrefix = fieldname === 'audio' ? sanitizedBase : `${sanitizedBase}_cover`;
    return `${finalPrefix}_${uniqueSuffix}.${ext}`;
};

// Helper: Resolve artist names to user IDs
async function resolveArtistNames(namesArray) {
    if (!namesArray || namesArray.length === 0) return { valid: false, ids: [], missing: [] };
    const cleanNames = namesArray.map(n => n.trim()).filter(n => n.length > 0);
    if (cleanNames.length === 0) return { valid: false, ids: [], missing: [] };

    const { data: rows, error } = await supabase
        .from('users')
        .select('id, username')
        .in('username', cleanNames);

    if (error) return { valid: false, ids: [], missing: [], error: error.message };

    const foundNames = rows.map(r => r.username.toLowerCase());
    const missing = cleanNames.filter(n => !foundNames.includes(n.toLowerCase()));

    if (missing.length > 0) {
        return { valid: false, ids: [], missing };
    } else {
        return { valid: true, ids: rows.map(r => r.id), missing: [] };
    }
}

// Helper: Check song uniqueness
async function isSongUnique(title, artistIds, excludeSongId = null) {
    let query = supabase
        .from('songs')
        .select('id, song_contributors(user_id)')
        .eq('title', title);

    if (excludeSongId) query = query.neq('id', excludeSongId);

    const { data: rows, error } = await query;
    if (error) return false;

    const targetSet = new Set(artistIds);
    const isDuplicate = rows.some(row => {
        const rowArtistIds = row.song_contributors.map(sc => sc.user_id);
        if (rowArtistIds.length !== artistIds.length) return false;
        return rowArtistIds.every(id => targetSet.has(id));
    });

    return !isDuplicate;
}



// GET /songs
router.get('/', async (req, res) => {
    const { title } = req.query;
    let query = supabase.from('songs').select('id, title, genre, release_year, cover_path, audio_path, play_count, song_contributors(users(display_name, username))');

    if (title) query = query.eq('title', title);

    console.log(`[SONG] Listing tracks...`);
    const { data: rows, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.json(await formatSongRows(rows));
});

// GET /songs/search
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query 'q' required" });

    console.log(`[SONG] Searching tracks matching: "${q}"`);
    const { data: rows, error } = await supabase
        .from('songs')
        .select('id, title, genre, release_year, cover_path, audio_path, play_count, song_contributors(users(display_name, username))')
        .or(`title.ilike.%${q}%,genre.ilike.%${q}%`);

    if (error) return res.status(500).json({ error: error.message });
    res.json(await formatSongRows(rows));
});

// GET /songs/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (isNaN(parseInt(id))) return res.status(400).json({ error: "Invalid song ID" });

    const { data: row, error } = await supabase
        .from('songs')
        .select('id, title, genre, release_year, cover_path, audio_path, play_count, song_contributors(users(display_name, username))')
        .eq('id', id)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!row) return res.status(404).json({ error: "Song not found" });

    const formatted = await formatSongRows([row]);
    res.json(formatted[0]);
});

// POST /songs (Upload Track)
router.post('/', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    const { title, genre, release_year, artists } = req.body;

    if (!req.files['audio']) return res.status(400).json({ error: "Audio file is required" });
    if (!title || title.length > 128) return res.status(400).json({ error: "Valid title required" });

    const year = parseInt(release_year, 10);
    const artistNames = artists ? artists.split(',') : [];
    const artistResolution = await resolveArtistNames(artistNames);
    if (!artistResolution.valid) {
        return res.status(400).json({ error: `Artists not found: ${artistResolution.missing.join(', ')}` });
    }

    const unique = await isSongUnique(title, artistResolution.ids);
    if (!unique) return res.status(409).json({ error: "Song already exists." });

    console.log(`[SONG] Uploading files for: ${title}`);

    // Upload Cover
    let cover_path = null;
    if (req.files['cover']) {
        const coverFile = req.files['cover'][0];
        const coverName = generateFileName(title, 'cover', coverFile.originalname);
        cover_path = `storage/cover/${coverName}`;
        const { error: coverErr } = await supabase.storage.from(BUCKET_NAME).upload(cover_path, coverFile.buffer, { contentType: coverFile.mimetype });
        if (coverErr) return res.status(500).json({ error: "Cover upload failed" });
    }

    // Upload Audio
    const audioFile = req.files['audio'][0];
    const audioName = generateFileName(title, 'audio', audioFile.originalname);
    const audio_path = `storage/audio/${audioName}`;
    const { error: audioErr } = await supabase.storage.from(BUCKET_NAME).upload(audio_path, audioFile.buffer, { contentType: audioFile.mimetype });
    if (audioErr) {
        if (cover_path) await supabase.storage.from(BUCKET_NAME).remove([cover_path]);
        return res.status(500).json({ error: "Audio upload failed" });
    }

    // Insert Song Record
    const { data: song, error: songError } = await supabase
        .from('songs')
        .insert([{ title, genre, release_year: year, cover_path, audio_path }])
        .select('id')
        .single();

    if (songError) {
        await supabase.storage.from(BUCKET_NAME).remove([cover_path, audio_path].filter(Boolean));
        return res.status(500).json({ error: songError.message });
    }

    const contributors = artistResolution.ids.map(uId => ({ song_id: song.id, user_id: uId }));
    await supabase.from('song_contributors').insert(contributors);

    console.log(`[SONG] Track ID: ${song.id} uploaded successfully.`);
    const finalCover = await getSignedURL(cover_path);
    res.status(201).json({ message: "Song uploaded successfully", id: song.id, cover_path: finalCover });
});

// PUT /songs (Edit Track)
router.put('/', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID required" });

    const { title, genre, release_year, artists } = req.body;
    const updatePayload = {};
    if (title) updatePayload.title = title;
    if (genre) updatePayload.genre = genre;
    if (release_year) updatePayload.release_year = parseInt(release_year, 10);

    console.log(`[SONG] Editing track ID: ${id}`);

    // Handle File Replacement
    if (req.files['cover'] || req.files['audio']) {
        const { data: row } = await supabase.from('songs').select('cover_path, audio_path, title').eq('id', id).single();
        if (!row) return res.status(404).json({ error: "Song not found" });

        if (req.files['cover']) {
            const file = req.files['cover'][0];
            const name = generateFileName(title || row.title, 'cover', file.originalname);
            const path = `cover/${name}`;
            await supabase.storage.from(BUCKET_NAME).upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
            if (row.cover_path) await supabase.storage.from(BUCKET_NAME).remove([row.cover_path]);
            updatePayload.cover_path = path;
        }

        if (req.files['audio']) {
            const file = req.files['audio'][0];
            const name = generateFileName(title || row.title, 'audio', file.originalname);
            const path = `audio/${name}`;
            await supabase.storage.from(BUCKET_NAME).upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
            if (row.audio_path) await supabase.storage.from(BUCKET_NAME).remove([row.audio_path]);
            updatePayload.audio_path = path;
        }
    }

    if (Object.keys(updatePayload).length > 0) {
        await supabase.from('songs').update(updatePayload).eq('id', id);
    }

    if (artists) {
        const artistResolution = await resolveArtistNames(artists.split(','));
        if (artistResolution.valid) {
            await supabase.from('song_contributors').delete().eq('song_id', id);
            await supabase.from('song_contributors').insert(artistResolution.ids.map(uId => ({ song_id: id, user_id: uId })));
        }
    }

    const { data: finalRow } = await supabase.from('songs').select('*').eq('id', id).single();
    const formatted = await formatSongRows([finalRow]);
    res.json({ message: "Song updated successfully", ...formatted[0] });
});

// POST /songs/play
router.post('/play', async (req, res) => {
    const { title } = req.query;
    const songId = await resolveSong(title);
    if (!songId) return res.status(404).json({ error: "Song not found" });

    const { data: current } = await supabase.from('songs').select('play_count').eq('id', songId).single();
    const new_count = (current?.play_count || 0) + 1;
    await supabase.from('songs').update({ play_count: new_count }).eq('id', songId);

    res.json({ message: "Global play count incremented", play_count: new_count });
});

// DELETE /songs
router.delete('/', async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID required" });

    try {
        await deleteSong(id, supabase);
        res.json({ message: "Song deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
