const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Ez hivatkozik a db.js-re, amit korábban írtunk
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json()); // Ez engedi meg, hogy a szerver értse a JSON adatokat

// 1. Teszt útvonal a szerver működésének ellenőrzésére
app.get('/', (req, res) => {
    res.send('A szerver él és mozog!');
});

// 2. A Bejelentkezési útvonal
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Megkeressük a felhasználót az adatbázisban
        // Megjegyzés: a password_hash mezőt most sima szövegként kezeljük a teszt kedvéért
        const user = await pool.query(
            // Itt a trükk: $1-et hasonlítjuk a username-hez VAGY az email-hez
            "SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2",
            [username, password]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: "Hibás adatok!" });
        }

        // Ha sikerült, visszaküldjük a felhasználót (jelszó nélkül)
        const loggedInUser = user.rows[0];
        delete loggedInUser.password_hash; // Biztonság: a jelszót ne küldjük vissza a frontendnek

        res.json({
            message: "Sikeres belépés!",
            user: loggedInUser
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Szerver hiba történt!" });
    }
});

// Új felhasználó regisztrálása
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. Ellenőrizzük, hogy létezik-e már ilyen felhasználó vagy email
        const userCheck = await pool.query(
            "SELECT * FROM users WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "A felhasználónév vagy az email már foglalt!" });
        }

        // 2. Új felhasználó mentése az adatbázisba
        // A 'password_hash' mezőbe most még sima szövegként mentünk (később titkosítjuk)
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING *",
            [username, email, password]
        );

        res.status(201).json({
            message: "Sikeres regisztráció!",
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Szerver hiba történt a regisztráció során!" });
    }
});

// Jelszó módosítása
app.post('/api/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Hiányzó adatok!' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie!' });
        }

        // Megkeressük a felhasználót és ellenőrizzük a jelenlegi jelszót
        const user = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND password_hash = $2',
            [userId, currentPassword]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'A jelenlegi jelszó helytelen!' });
        }

        // Frissítjük a jelszót
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPassword, userId]
        );

        res.json({ message: 'Jelszó sikeresen módosítva!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

// Felhasználó törlése
app.delete('/api/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params; // Az URL-ből vesszük ki az ID-t

        if (!userId) {
            return res.status(400).json({ message: 'Hiányzó felhasználói azonosító!' });
        }

        // Törlés az adatbázisból
        const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'A felhasználó nem található!' });
        }

        res.json({ message: 'Fiók sikeresen törölve!' });

    } catch (err) {
        console.error("Hiba a törlésnél:", err.message);
        res.status(500).json({ message: 'Szerver hiba történt a törlés során!' });
    }
});

// ── KVÍZEK ──────────────────────────────────────────────────────

// Saját kvízek lekérése
app.get('/api/quizzes/my/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM quizzes WHERE owner_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

// Egyedi megosztási kód generálása (8 véletlenszerű alfanumerikus karakter)
function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Új kvíz létrehozása
app.post('/api/quizzes', async (req, res) => {
    try {
        const { owner_id, title, description, category, time_limit, is_public, access_password } = req.body;

        if (!owner_id || !title) {
            return res.status(400).json({ message: 'A kvíz neve és a tulajdonos megadása kötelező!' });
        }

        // Egyedi share_code generálása (ütközés esetén újrapróbálás)
        let share_code;
        let attempts = 0;
        while (attempts < 10) {
            const candidate = generateShareCode();
            const existing = await pool.query('SELECT id FROM quizzes WHERE share_code = $1', [candidate]);
            if (existing.rows.length === 0) { share_code = candidate; break; }
            attempts++;
        }
        if (!share_code) return res.status(500).json({ message: 'Nem sikerült egyedi kódot generálni, próbáld újra!' });

        const result = await pool.query(
            `INSERT INTO quizzes
               (owner_id, title, description, category, time_limit, is_public, access_password, share_code)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                owner_id,
                title,
                description  || null,
                category     || null,
                time_limit   || null,
                is_public    ?? true,
                (!is_public && access_password) ? access_password : null,
                share_code
            ]
        );

        res.status(201).json({ message: 'Kvíz sikeresen létrehozva!', quiz: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

// Nyilvános kvízek lekérése (más felhasználóktól)
app.get('/api/quizzes/public/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            `SELECT q.*, u.username AS owner_name
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             WHERE q.is_public = true AND q.owner_id != $1
             ORDER BY q.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

// Privát kvíz keresése megosztási kód alapján
app.get('/api/quizzes/find/:shareCode', async (req, res) => {
    try {
        const { shareCode } = req.params;
        const result = await pool.query(
            `SELECT q.id, q.title, q.description, q.category, q.time_limit,
                    q.is_public, q.share_code, q.created_at, u.username AS owner_name
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             WHERE q.share_code = $1`,
            [shareCode]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nem található kvíz ezzel a kóddal.' });
        }
        // access_password-t NEM küldjük vissza
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

// Kvíz törlése
app.delete('/api/quizzes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Kvíz nem található!' });
        res.json({ message: 'Kvíz törölve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba történt!' });
    }
});

app.listen(PORT, () => {
    console.log(`Szerver fut a http://localhost:${PORT} címen`);
});