const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// DELETE /api/attempts/:attemptId
router.delete('/:attemptId', async (req, res) => {
    try {
        const { attemptId } = req.params;
        const result = await pool.query('DELETE FROM quiz_attempts WHERE id = $1 RETURNING id', [attemptId]);
        if (result.rowCount === 0)
            return res.status(404).json({ message: 'Kiserlet nem talalhato!' });
        res.json({ message: 'Kiserlet torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
