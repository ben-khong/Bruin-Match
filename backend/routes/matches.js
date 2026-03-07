const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// GET /api/matches - get sent requests, incoming requests, and group members
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const sentResult = await pool.query(
      `SELECT mr.id, mr.recipient_id, mr.created_at, up.full_name, up.major, up.academic_year, up.gender
       FROM match_requests mr
       JOIN user_profiles up ON mr.recipient_id = up.user_id
       WHERE mr.requester_id = $1 AND mr.status = 'pending'
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    const incomingResult = await pool.query(
      `SELECT mr.id, mr.requester_id, mr.created_at, up.full_name, up.major, up.academic_year, up.gender
       FROM match_requests mr
       JOIN user_profiles up ON mr.requester_id = up.user_id
       WHERE mr.recipient_id = $1 AND mr.status = 'pending'
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    const groupResult = await pool.query(
      `SELECT mr.id,
        CASE WHEN mr.requester_id = $1 THEN mr.recipient_id ELSE mr.requester_id END AS member_id,
        up.full_name, up.major, up.academic_year, up.gender,
        up.housing_type, up.room_type, up.move_in_term, up.contact_info
       FROM match_requests mr
       JOIN user_profiles up ON (
         CASE WHEN mr.requester_id = $1 THEN mr.recipient_id ELSE mr.requester_id END = up.user_id
       )
       WHERE (mr.requester_id = $1 OR mr.recipient_id = $1) AND mr.status = 'accepted'
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    res.json({
      sent: sentResult.rows,
      incoming: incomingResult.rows,
      group: groupResult.rows,
    });
  } catch (error) {
    console.error('Matches fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches/status - get all match request statuses involving current user
router.get('/status', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT id, requester_id, recipient_id, status
       FROM match_requests
       WHERE requester_id = $1 OR recipient_id = $1`,
      [userId]
    );
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Match status fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches/request/:userId - send a match request
router.post('/request/:userId', authenticateToken, async (req, res) => {
  const requesterId = req.user.userId;
  const recipientId = parseInt(req.params.userId);

  if (requesterId === recipientId) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }

  try {
    const existing = await pool.query(
      `SELECT id, status FROM match_requests
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)`,
      [requesterId, recipientId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Request already exists', existing: existing.rows[0] });
    }

    const result = await pool.query(
      `INSERT INTO match_requests (requester_id, recipient_id, status)
       VALUES ($1, $2, 'pending') RETURNING *`,
      [requesterId, recipientId]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Send match request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches/accept/:requestId - accept an incoming match request
router.post('/accept/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const requestId = parseInt(req.params.requestId);

  try {
    const result = await pool.query(
      `UPDATE match_requests SET status = 'accepted'
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Accept match request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches/decline/:requestId - decline an incoming match request
router.post('/decline/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const requestId = parseInt(req.params.requestId);

  try {
    const result = await pool.query(
      `UPDATE match_requests SET status = 'declined'
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Decline match request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/matches/cancel/:requestId - cancel a sent pending request
router.delete('/cancel/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const requestId = parseInt(req.params.requestId);

  try {
    const result = await pool.query(
      `DELETE FROM match_requests
       WHERE id = $1 AND requester_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    res.json({ message: 'Request cancelled' });
  } catch (error) {
    console.error('Cancel match request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
