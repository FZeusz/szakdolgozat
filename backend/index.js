const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Behozzuk az adatbázis kapcsolatot
require('dotenv').config();

const app = express();
app.use(cors()); // <--- Ez legyen legfelül!
app.use(express.json()); // <--- Ez is legyen ott!

// ...csak ezután jöhetnek az app.post és app.get részek...
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Teszteljük az adatbázist egy végponton
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()'); // Lekérjük az aktuális időt a DB-től
    res.json({ message: "Sikeres kapcsolat!", time: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Szerver hiba az adatbázis kapcsolódásakor");
  }
});

// Új útvonal: Összes felhasználó lekérése
app.get('/users', async (req, res) => {
  try {
    // Lefuttatjuk a lekérdezést a "users" táblán
    const result = await pool.query('SELECT * FROM users');
    
    // Visszaküldjük a sorokat (rows) JSON formátumban
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Hiba történt a felhasználók lekérésekor.");
  }
});

app.listen(PORT, () => {
  console.log(`Szerver fut: http://localhost:${PORT}`);
});