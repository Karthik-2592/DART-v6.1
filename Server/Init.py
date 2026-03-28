import sqlite3
import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "songs.db")  

def add_song_with_contributors(cursor, title, genre, year, cover, audio, artists):
    # Insert song
    cursor.execute("""
        INSERT INTO songs (title, genre, release_year, cover_path, audio_path)
        VALUES (?, ?, ?, ?, ?)
    """, (title, genre, year, cover, audio))
    song_id = cursor.lastrowid

    # Ensure contributors (users) exist and link them
    for name in artists:
        # Create a dummy username from the artist's name
        username = name.replace(" ", "").lower()
        email = f"{username}@example.com"
        
        cursor.execute("SELECT id FROM users WHERE display_name = ?", (name,))
        row = cursor.fetchone()
        if row:
            user_id = row[0]
        else:
            # We'll handle email uniqueness by catching exceptions or just hoping there's no collision with exact names
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            email_row = cursor.fetchone()
            if email_row:
                user_id = email_row[0]
                # If we really want to handle duplicate emails from same dummy username, could append randomly, but should be fine
            else:
                try:
                    cursor.execute("INSERT INTO users (username, password, email, display_name) VALUES (?, ?, ?, ?)", 
                                   (username, "dummy_password", email, name))
                    user_id = cursor.lastrowid
                except sqlite3.IntegrityError:
                    # Fallback if username or email conflicts
                    username = f"{username}_{int(os.urandom(2).hex(), 16)}"
                    email = f"{username}@example.com"
                    cursor.execute("INSERT INTO users (username, password, email, display_name) VALUES (?, ?, ?, ?)", 
                                   (username, "dummy_password", email, name))
                    user_id = cursor.lastrowid

        cursor.execute("INSERT INTO song_contributors (song_id, user_id) VALUES (?, ?)", (song_id, user_id))


# Connect to (or create) the database file
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Drop old tables if they exist (reset)
cursor.execute("DROP TABLE IF EXISTS user_follows")
cursor.execute("DROP TABLE IF EXISTS song_artists")
cursor.execute("DROP TABLE IF EXISTS artists")
cursor.execute("DROP TABLE IF EXISTS playlist_shares")
cursor.execute("DROP TABLE IF EXISTS song_play_counts")
cursor.execute("DROP TABLE IF EXISTS playlist_songs")
cursor.execute("DROP TABLE IF EXISTS playlists")
cursor.execute("DROP TABLE IF EXISTS favorites")
cursor.execute("DROP TABLE IF EXISTS song_contributors")
cursor.execute("DROP TABLE IF EXISTS songs")
cursor.execute("DROP TABLE IF EXISTS users")

# Create tables
cursor.execute("""
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT DEFAULT 'New User',
    profile_picture TEXT DEFAULT NULL,
    description TEXT DEFAULT 'No bio provided.',
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0
);
""")

cursor.execute("""
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT,
    release_year INTEGER,
    release_month INTEGER,
    cover_path TEXT,
    audio_path TEXT,
    play_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0
);
""")

cursor.execute("""
CREATE TABLE song_contributors (
    song_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (song_id, user_id),
    FOREIGN KEY(song_id) REFERENCES songs(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
""")

cursor.execute("""
CREATE TABLE favorites (
    user_id INTEGER,
    song_id INTEGER,
    user_play_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, song_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(song_id) REFERENCES songs(id)
);
""")

cursor.execute("""
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
""")

cursor.execute("""
CREATE TABLE playlist_songs (
    playlist_id INTEGER,
    song_id INTEGER,
    PRIMARY KEY (playlist_id, song_id),
    FOREIGN KEY(playlist_id) REFERENCES playlists(id),
    FOREIGN KEY(song_id) REFERENCES songs(id)
);
""")


cursor.execute("""
CREATE TABLE playlist_shares (
    playlist_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (playlist_id, user_id),
    FOREIGN KEY(playlist_id) REFERENCES playlists(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);
""")

cursor.execute("""
CREATE TABLE user_follows (
    follower_id INTEGER,
    following_id INTEGER,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
);
""")

#Insert sample songs


with open(os.path.join(script_dir, "songs.json" )) as f:
    songs_data = json.load(f)

for song in songs_data:
    add_song_with_contributors(cursor, song["title"], song["genre"], song["year"],
                          song["cover"], song["audio"], song["artists"])

conn.commit()

# Query: list songs with their contributors
# cursor.execute("""
# SELECT s.title, u.display_name
# FROM songs s
# JOIN song_contributors sc ON s.id = sc.song_id
# JOIN users u ON sc.user_id = u.id
# ORDER BY s.title;
# """)

# rows = cursor.fetchall()
# print("Songs with contributors:")
# for title, display_name in rows:
#     print(f"{title} -> {display_name}")

# conn.close()
