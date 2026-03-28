import sqlite3Pkg from 'sqlite3';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3 = sqlite3Pkg.verbose();
const dbPath = path.join(__dirname, 'songs.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database connection error:", err);
    } else {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                display_name TEXT DEFAULT 'New User',
                profile_picture TEXT DEFAULT NULL,
                description TEXT DEFAULT 'No bio provided.',
                follower_count INTEGER DEFAULT 0,
                following_count INTEGER DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS songs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                genre TEXT,
                release_year INTEGER,
                release_month INTEGER,
                cover_path TEXT,
                audio_path TEXT,
                play_count INTEGER DEFAULT 0,
                favorite_count INTEGER DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS song_contributors (
                song_id INTEGER,
                user_id INTEGER,
                PRIMARY KEY (song_id, user_id),
                FOREIGN KEY(song_id) REFERENCES songs(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS favorites (
                user_id INTEGER,
                song_id INTEGER,
                user_play_count INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, song_id),
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(song_id) REFERENCES songs(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS playlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS playlist_songs (
                playlist_id INTEGER,
                song_id INTEGER,
                PRIMARY KEY (playlist_id, song_id),
                FOREIGN KEY(playlist_id) REFERENCES playlists(id),
                FOREIGN KEY(song_id) REFERENCES songs(id)
            )`);


            db.run(`CREATE TABLE IF NOT EXISTS playlist_shares (
                playlist_id INTEGER,
                user_id INTEGER,
                PRIMARY KEY (playlist_id, user_id),
                FOREIGN KEY(playlist_id) REFERENCES playlists(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS user_follows (
                follower_id INTEGER,
                following_id INTEGER,
                PRIMARY KEY (follower_id, following_id),
                FOREIGN KEY(follower_id) REFERENCES users(id),
                FOREIGN KEY(following_id) REFERENCES users(id)
            )`);
        });
    }
});

export default db;
