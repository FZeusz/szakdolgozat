const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// POST /api/reports
router.post('/', async (req, res) => {
    try {
        const { quiz_id, user_id, message } = req.body;
        if (!quiz_id)
            return res.status(400).json({ message: 'A quiz_id megadasa kotelezo!' });
        const result = await pool.query(
            `INSERT INTO quiz_reports (quiz_id, user_id, message)
             VALUES ($1, $2, $3) RETURNING *`,
            [quiz_id, user_id || null, message || null]
        );
        res.status(201).json({ message: 'Jelentes sikeresen bekuldve!', report: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
