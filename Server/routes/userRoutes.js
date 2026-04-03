import express from 'express';
import multer from 'multer';
import supabase, { BUCKET_NAME } from '../supabaseClient.js';
import { resolveUser } from '../resolvers.js';
import { deleteUser } from '../utils/deletionRoutines.js';
import { formatUserRows } from '../utils/formatters.js';

// Configure multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Helper: Generate unique filename for profile pics
const generatePPName = (username, originalName) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = originalName.split('.').pop();
    const sanitizedName = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${sanitizedName}_${uniqueSuffix}.${ext}`;
};

// GET /users?username=:username or /users?email=:email
router.get('/', async (req, res) => {
    const { username, email } = req.query;
    
    if (!username && !email) {
        return res.status(400).json({ error: "Query parameter 'username' or 'email' is required" });
    }

    console.log(`[USER] Requesting profile for identifier: ${username || email} (Type: ${username ? 'username' : 'email'})`);
    
    let query = supabase
        .from('users')
        .select('id, username, email, display_name, profile_picture, description, follower_count, following_count');

    if (username) {
        query = query.eq('username', username);
    } else {
        query = query.eq('email', email);
    }

    const { data: row, error } = await query.maybeSingle();

    if (error) {
        console.error(`[USER] Supabase Error fetching user: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    if (!row) {
        console.warn(`[USER] Profile lookup failed: User not found (${username || email})`);
        return res.status(404).json({ error: "User not found" });
    }

    const [formattedUser] = await formatUserRows([row]);
    
    console.log(`[USER] Profile retrieved successfully for: ${formattedUser.username} (ID: ${formattedUser.id})`);
    if (formattedUser.profile_picture) console.log(` -> Signed URL: ${formattedUser.profile_picture}`);
    res.json(formattedUser);
});

// GET /users/search?q=:query
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { data: rows, error } = await supabase
        .from('users')
        .select('id, username, display_name, description, profile_picture')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%,description.ilike.%${q}%`);

    if (error) {
        console.error(`[USER] Supabase Search Error: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }

    // Generate signed URLs for all results
    const results = await formatUserRows(rows);
    
    console.log(`[USER] Search found ${results.length} users for query: "${q}"`);
    results.forEach(u => {
        if (u.profile_picture) console.log(` -> User: ${u.username} | PP: ${u.profile_picture}`);
    });
    res.json(results);
});

// PUT /users?username=:username
router.put('/', upload.single('profile_picture'), async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });

    const userId = await resolveUser(username);
    if (!userId) return res.status(404).json({ error: "User not found" });

    const { display_name, description } = req.body;
    let profile_picture_path = undefined;

    const { data: current } = await supabase.from('users').select('profile_picture').eq('id', userId).single();

    if (req.file) {
        const filename = generatePPName(username, req.file.originalname);
        const storagePath = `profilePic/${filename}`;
        profile_picture_path = `storage/${storagePath}`;

        console.log(`[USER] Uploading new profile picture to bucket: ${storagePath}`);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) return res.status(500).json({ error: "Profile picture upload failed" });

        // Cleanup old profile picture if exists
        if (current?.profile_picture) {
            const cleanPath = current.profile_picture.replace(/^(storage\/|Storage\/)/i, '').replace(/^\/+/, '');
            await supabase.storage.from(BUCKET_NAME).remove([cleanPath]);
        }
    }
    
    const updatePayload = {};
    if (display_name !== undefined) updatePayload.display_name = display_name;
    if (profile_picture_path !== undefined) updatePayload.profile_picture = profile_picture_path;
    if (description !== undefined) updatePayload.description = description;

    if (Object.keys(updatePayload).length === 0) return res.json({ message: "No fields to update" });

    console.log(`[USER] Updating user: ${username} (ID: ${userId})`);
    const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

    if (error) {
        console.error(`[USER] Supabase Error updating user ${username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    // Return signed URL for the new picture if updated
    const [formattedResult] = await formatUserRows([{ profile_picture: profile_picture_path }]);
    const finalPP = formattedResult?.profile_picture;
    
    console.log(`[USER] Successfully updated profile for user: ${username}`);
    res.json({ message: "User updated successfully", profile_picture: finalPP });
});

// DELETE /users?username=:username
router.delete('/', async (req, res) => {
    const { username } = req.query;
    const { password } = req.body;

    if (!username) return res.status(400).json({ error: "Query parameter 'username' is required" });
    if (!password) return res.status(400).json({ error: "Password is required for account deletion" });

    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, password')
        .eq('username', username)
        .maybeSingle();

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.password !== password) {
        console.warn(`[USER] Unauthorized deletion attempt for user: ${username}`);
        return res.status(401).json({ error: "Invalid password. Deletion aborted." });
    }

    console.log(`[USER] Deleting user: ${username} (ID: ${user.id}) and cascading all data/files.`);
    try {
        await deleteUser(user.id, supabase);
        console.log(`[USER] User "${username}" and all associated data/files successfully removed.`);
        res.json({ message: "Account and all associated data deleted successfully" });
    } catch (delErr) {
        console.error(`[USER] Error during cascading deletion for ${username}: ${delErr.message}`);
        res.status(500).json({ error: delErr.message });
    }
});

// POST /users/register
router.post('/register', upload.single('profile_picture'), async (req, res) => {
    const { username, password, email, display_name, description } = req.body;
    let profile_picture_path = null;
    
    if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password and email are required" });
    }

    if (req.file) {
        const filename = generatePPName(username, req.file.originalname);
        const storagePath = `profilePic/${filename}`;
        profile_picture_path = `storage/${storagePath}`;
        
        console.log(`[USER] Uploading profile picture for registration: ${storagePath}`);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error(`[USER] Supabase Error uploading PP for registration: ${uploadError.message}`);
            // Non-fatal for registration, but let's keep it null
            profile_picture_path = null;
        }
    }

    console.log(`[USER] Registering new user: ${username} (${email})`);
    
    const { data, error } = await supabase
        .from('users')
        .insert([{
            username, 
            password, 
            email, 
            display_name: display_name || 'New User', 
            profile_picture: profile_picture_path, 
            description: description || 'No bio provided.'
        }])
        .select('id')
        .single();

    if (error) {
        // Cleanup file if registration fails
        if (profile_picture_path) {
            await supabase.storage.from(BUCKET_NAME).remove([profile_picture_path]);
        }

        if (error.code === '23505') {
            console.warn(`[USER] Registration collision: ${error.message}`);
            if (error.message.includes("username")) return res.status(409).json({ error: "Username is already taken" });
            if (error.message.includes("email")) return res.status(409).json({ error: "Email is already registered" });
        }
        console.error(`[USER] Supabase Error during registration for ${username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    console.log(`[USER] New account created! Username: ${username}, ID: ${data.id}`);
    
    // Signed URL for response
    const [formattedReg] = await formatUserRows([{ profile_picture: profile_picture_path }]);
    const finalPP = formattedReg?.profile_picture;

    res.status(201).json({ 
        id: data.id, 
        username, 
        email, 
        displayName: display_name || 'New User',
        profile_picture: finalPP
    });
});

// POST /users/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password are required" });

    console.log(`[USER] Login attempt for: ${username}`);
    
    const { data: user, error } = await supabase
        .from('users')
        .select('id, username, password, display_name, profile_picture')
        .eq('username', username)
        .maybeSingle();

    if (error) {
        console.error(`[USER] Supabase Error during login lookup for ${username}: ${error.message}`);
        return res.status(500).json({ error: error.message });
    }
    
    if (!user || user.password !== password) {
        console.warn(`[USER] Failed login attempt for username: ${username}`);
        return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate signed URL for login response
    const [formattedLogin] = await formatUserRows([user]);
    
    console.log(`[USER] Successful login: ${formattedLogin.username} (ID: ${formattedLogin.id})`);
    
    const { password: _, display_name, ...userData } = formattedLogin;
    res.json({ ...userData, displayName: display_name });
});

export default router;
