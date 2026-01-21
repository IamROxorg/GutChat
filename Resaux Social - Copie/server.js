const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('website'));

// Database Setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Table Users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            bio TEXT,
            profile_pic TEXT
        )`);

        // Table Posts
        db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            content TEXT,
            image_url TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Table Messages (Sends)
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            receiver_id INTEGER,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id)
        )`);
    });
}

// Routes de base
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

// --- API ROUTES ---

// Inscription
app.post('/api/register', (req, res) => {
    const { username, password, bio } = req.body;
    // Note: En production, il faut hasher le mot de passe (ex: bcrypt)
    // Pour cet exercice scolaire, on stocke en clair ou hash simple si demandé
    const sql = `INSERT INTO users (username, password, bio, profile_pic) VALUES (?, ?, ?, ?)`;
    // Image par défaut si vide
    const defaultPic = 'https://via.placeholder.com/150';

    db.run(sql, [username, password, bio, defaultPic], function (err) {
        if (err) {
            return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris ou erreur serveur." });
        }
        res.json({ id: this.lastID, username, bio, profile_pic: defaultPic });
    });
});

// Connexion
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;

    db.get(sql, [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({ message: "Succès", user: row });
        } else {
            res.status(401).json({ error: "Nom d'utilisateur ou mot de passe incorrect." });
        }
    });
});

// Récupérer les posts
app.get('/api/posts', (req, res) => {
    // Jointure pour récupérer le nom de l'auteur
    const sql = `
        SELECT posts.*, users.username, users.profile_pic 
        FROM posts 
        JOIN users ON posts.user_id = users.id 
        ORDER BY timestamp DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ posts: rows });
    });
});

// Créer un post
app.post('/api/posts', (req, res) => {
    const { user_id, content, image_url } = req.body;
    const sql = `INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`;

    db.run(sql, [user_id, content, image_url], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, user_id, content, image_url });
    });
});

// Récupérer les messages entre deux utilisateurs
app.get('/api/messages/:userId/:friendId', (req, res) => {
    const { userId, friendId } = req.params;
    const sql = `
        SELECT * FROM messages 
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
    `;
    db.all(sql, [userId, friendId, friendId, userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ messages: rows });
    });
});

// Envoyer un message
app.post('/api/messages', (req, res) => {
    const { sender_id, receiver_id, content } = req.body;
    const sql = `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`;

    db.run(sql, [sender_id, receiver_id, content], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, sender_id, receiver_id, content });
    });
});

// Récupérer tous les utilisateurs (pour chercher des amis)
app.get('/api/users', (req, res) => {
    const sql = "SELECT id, username, profile_pic FROM users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ users: rows });
    });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur GutChat démarré sur http://localhost:${port}`);
});
