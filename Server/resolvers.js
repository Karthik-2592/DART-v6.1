import db from './db.js';

export const resolveUser = (identifier, type = 'username') => {
    return new Promise((resolve, reject) => {
        const query = type === 'email' ? 
            `SELECT id FROM users WHERE email = ?` : 
            `SELECT id FROM users WHERE username = ?`;
        db.get(query, [identifier], (err, row) => {
            if (err) reject(err);
            resolve(row ? row.id : null);
        });
    });
};

export const resolveSong = (title) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT id FROM songs WHERE title = ?`;
        db.get(query, [title], (err, row) => {
            if (err) reject(err);
            resolve(row ? row.id : null);
        });
    });
};

export const resolvePlaylist = (name, creatorUsername) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT p.id 
            FROM playlists p
            JOIN users u ON p.user_id = u.id
            WHERE p.name = ? AND u.username = ?
        `;
        db.get(query, [name, creatorUsername], (err, row) => {
            if (err) reject(err);
            resolve(row ? row.id : null);
        });
    });
};
