import sqlite3
import os
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(script_dir, "songs.db")  

def add_song_with_artists(cursor, title, genre, year, cover, audio, artists):
    # Insert song
    cursor.execute("""
        INSERT INTO songs (title, genre, release_year, cover_path, audio_path)
        VALUES (?, ?, ?, ?, ?)
    """, (title, genre, year, cover, audio))
    song_id = cursor.lastrowid

    # Ensure artists exist and link them
    for name in artists:
        cursor.execute("SELECT id FROM artists WHERE name = ?", (name,))
        row = cursor.fetchone()
        if row:
            artist_id = row[0]
        else:
            cursor.execute("INSERT INTO artists (name) VALUES (?)", (name,))
            artist_id = cursor.lastrowid

        cursor.execute("INSERT INTO song_artists (song_id, artist_id) VALUES (?, ?)", (song_id, artist_id))


# Connect to (or create) the database file
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Drop old tables if they exist (reset)
cursor.execute("DROP TABLE IF EXISTS song_artists")
cursor.execute("DROP TABLE IF EXISTS artists")
cursor.execute("DROP TABLE IF EXISTS songs")

# Create tables
cursor.execute("""
CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    genre TEXT,
    release_year INTEGER,
    cover_path TEXT,
    audio_path TEXT
);
""")

cursor.execute("""
CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);
""")

cursor.execute("""
CREATE TABLE song_artists (
    song_id INTEGER,
    artist_id INTEGER,
    FOREIGN KEY(song_id) REFERENCES songs(id),
    FOREIGN KEY(artist_id) REFERENCES artists(id),
    PRIMARY KEY (song_id, artist_id)
);
""")

# Insert sample songs


with open(os.path.join(script_dir, "songs.json" )) as f:
    songs_data = json.load(f)

for song in songs_data:
    add_song_with_artists(cursor, song["title"], song["genre"], song["year"],
                          song["cover"], song["audio"], song["artists"])

conn.commit()

# Query: list songs with their artists
cursor.execute("""
SELECT s.title, a.name
FROM songs s
JOIN song_artists sa ON s.id = sa.song_id
JOIN artists a ON sa.artist_id = a.id
ORDER BY s.title;
""")

rows = cursor.fetchall()
print("Songs with artists:")
for title, artist in rows:
    print(f"{title} -> {artist}")

conn.close()
