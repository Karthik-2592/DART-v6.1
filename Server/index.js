import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sqlite3Pkg from 'sqlite3';

const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./songs.db');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Enable CORS so React (on port 5173) can talk to server
app.use(cors());

// Serve static files from storage directory
app.use("/storage", express.static(path.join(__dirname, "storage"), {
    setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
}));
app.use('/audio', express.static(path.join(__dirname, 'storage/audio')));
app.use('/covers', express.static(path.join(__dirname, 'storage/covers')));

// Endpoint: list all songs with artists
app.get('/songs', (req, res) => {
    const query = `
    SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path,
           GROUP_CONCAT(a.name, ', ') AS artists
    FROM songs s
    JOIN song_artists sa ON s.id = sa.song_id
    JOIN artists a ON sa.artist_id = a.id
    GROUP BY s.id
  `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Endpoint: single song details
app.get('/songs/:id', (req, res) => {
    const query = `
    SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path,
           GROUP_CONCAT(a.name, ', ') AS artists
    FROM songs s
    JOIN song_artists sa ON s.id = sa.song_id
    JOIN artists a ON sa.artist_id = a.id
    WHERE s.id = ?
    GROUP BY s.id
  `;
    db.get(query, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// Helper for Levenshtein Distance
function levDistance(s, t) {
    if (!s) return t.length;
    if (!t) return s.length;
    const d = [];
    for (let i = 0; i <= s.length; i++) { d.push([i]); }
    for (let j = 1; j <= t.length; j++) { d[0].push(j); }
    for (let i = 1; i <= s.length; i++) {
        for (let j = 1; j <= t.length; j++) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[s.length][t.length];
}

// Search songs by title or artist name with fuzzy matching
app.get('/search', (req, res) => {
    const { q } = req.query; 

    if (!q) return res.json([]);

    const query = `
    SELECT s.id, s.title, s.genre, s.release_year, s.cover_path, s.audio_path,
           GROUP_CONCAT(a.name, ', ') AS artists
    FROM songs s
    JOIN song_artists sa ON s.id = sa.song_id
    JOIN artists a ON sa.artist_id = a.id
    GROUP BY s.id
  `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("DB error:", err);
            return res.json([]);
        }
        
        const term = q.toLowerCase();
        // Dynamic threshold based on length
        const maxTypo = Math.max(1, Math.floor(term.length / 4));

        const results = rows.filter(row => {
            const title = row.title.toLowerCase();
            const artists = (row.artists || "").toLowerCase();
            
            // Direct substring match
            if (title.includes(term) || artists.includes(term)) return true;
            
            // Fuzzy match entire title or artist
            if (levDistance(term, title) <= maxTypo) return true;
            if (levDistance(term, artists) <= maxTypo) return true;
            
            // Fuzzy match by individual words in title
            const titleWords = title.split(/\s+/);
            if (titleWords.some(w => levDistance(term, w) <= maxTypo && term.length > 2)) return true;
            
            return false;
        });
        
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

