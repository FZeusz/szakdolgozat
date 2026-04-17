const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// PUT /api/questions/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { question_text, question_type, answers, points } = req.body;
        const qType = (question_type === 'true_false') ? 'multiple_choice' : (question_type || 'multiple_choice');
        const pts   = (points && parseInt(points) >= 1) ? parseInt(points) : 1;

        if (!question_text)
            return res.status(400).json({ message: 'A kerdes szovege kotelezo!' });

        if (qType === 'text_input') {
            if (!answers || answers.length < 1 || !answers[0].answer_text)
                return res.status(400).json({ message: 'A szoveges kerdesnel meg kell adni a helyes valaszt!' });
        } else {
            if (!answers || answers.length < 2)
                return res.status(400).json({ message: 'Legalabb 2 valasz kotelezo!' });
            if (answers.length > 6)
                return res.status(400).json({ message: 'Maximum 6 valasz adhato meg!' });
            if (!answers.some(a => a.is_correct))
                return res.status(400).json({ message: 'Legalabb egy helyes valaszt meg kell jelolni!' });
        }

        const oldQ = await pool.query('SELECT quiz_id, question_order FROM questions WHERE id = $1', [id]);
        if (oldQ.rows.length === 0)
            return res.status(404).json({ message: 'Kerdes nem talalhato!' });
        const { quiz_id, question_order } = oldQ.rows[0];

        await pool.query('UPDATE questions SET is_active = false WHERE id = $1', [id]);

        const newQ = await pool.query(
            'INSERT INTO questions (quiz_id, text, question_type, points, question_order, is_active) VALUES ($1, $2, $3, $4, $5, true) RETURNING id',
            [quiz_id, question_text, qType, pts, question_order]
        );
        const newId = newQ.rows[0].id;

        const savedAnswers = await Promise.all(answers.map(a =>
            pool.query(
                'INSERT INTO answer_options (question_id, text, is_correct) VALUES ($1,$2,$3) RETURNING id, question_id, text AS answer_text, is_correct',
                [newId, a.answer_text, a.is_correct ?? true]
            ).then(r => r.rows[0])
        ));

        const qResult = await pool.query(
            `SELECT id, quiz_id, text AS question_text, question_type,
                    COALESCE(points, 1) AS points, question_order
             FROM questions WHERE id=$1`,
            [newId]
        );
        res.json({ ...qResult.rows[0], answers: savedAnswers });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

// DELETE /api/questions/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE questions SET is_active = false WHERE id = $1', [id]);
        res.json({ message: 'Kerdes torolve!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Szerver hiba tortent!' });
    }
});

module.exports = router;
