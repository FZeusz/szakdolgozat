const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await pool.query(
            'SELECT * FROM users WHERE (username = $1 OR email = $1) AND password_hash = $2',
            [username, password]
        );
        if (user.rows.length === 0)
            return res.status(401).json({ message: 'Hibas adatok!' });
        const loggedInUser = user.rows[0];
        delete loggedInUser.password_hash;
        res.json({ message: 'Sikeres belepes!', user: loggedInUser });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (userCheck.rows.length > 0)
            return res.status(400).json({ message: 'A felhasznalonev vagy az email mar foglalt!' });
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'STUDENT') RETURNING *",
            [username, email, password]
        );
        res.status(201).json({ message: 'Sikeres regisztracio!', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId || !currentPassword || !newPassword)
            return res.status(400).json({ message: 'Hianyzo adatok!' });
        if (newPassword.length < 6)
            return res.status(400).json({ message: 'Az uj jelszonak legalabb 6 karakter hosszunak kell lennie!' });
        const user = await pool.query(
            'SELECT * FROM users WHERE id = $1 AND password_hash = $2',
            [userId, currentPassword]
        );
        if (user.rows.length === 0)
            return res.status(401).json({ message: 'A jelenlegi jelszo helytelen!' });
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPassword, userId]);
        res.json({ message: 'Jelszo sikeresen modositva!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/auth/delete-account/:userId
router.delete('/delete-account/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'A felhasznalo nem talalhato!' });
        res.json({ message: 'Fiok sikeresen torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
