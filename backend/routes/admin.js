const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/admin/users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'A felhasznalo nem talalhato!' });
        res.json({ message: 'Felhasznalo torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// GET /api/admin/quizzes
router.get('/quizzes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT q.*, u.username AS owner_name, COUNT(DISTINCT qu.id)::int AS question_count
             FROM quizzes q
             JOIN users u ON u.id = q.owner_id
             LEFT JOIN questions qu ON qu.quiz_id = q.id AND qu.is_active = true
             GROUP BY q.id, u.username
             ORDER BY q.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// GET /api/admin/reports
router.get('/reports', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.id,
                    r.message,
                    r.created_at,
                    q.id   AS quiz_id,
                    q.title AS quiz_title,
                    u.username AS reporter_username
             FROM quiz_reports r
             LEFT JOIN quizzes q ON q.id = r.quiz_id
             LEFT JOIN users   u ON u.id = r.user_id
             ORDER BY r.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/admin/reports/:id
router.delete('/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM quiz_reports WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'Jelentes nem talalhato!' });
        res.json({ message: 'Jelentes torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
