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

app.listen(PORT, () => {
    console.log(`Szerver fut a http://localhost:${PORT} címen`);
});