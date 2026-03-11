const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// GET /api/filters/saved
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, filters, created_at FROM saved_filters WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ presets: result.rows });
  } catch (error) {
    console.error('Fetch saved filters error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/filters/saved
router.post('/', authenticateToken, async (req, res) => {
  const { name, filters } = req.body;
  if (!name || !filters) {
    return res.status(400).json({ error: 'name and filters are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO saved_filters (user_id, name, filters) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, name, JSON.stringify(filters)]
    );
    res.status(201).json({ preset: result.rows[0] });
  } catch (error) {
    console.error('Save filter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/filters/saved/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM saved_filters WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.json({ message: 'Preset deleted' });
  } catch (error) {
    console.error('Delete filter error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
