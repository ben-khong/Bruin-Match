const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

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

    // Get all other members in the current user's group via the groups/group_members tables
    const groupResult = await pool.query(
      `SELECT gm2.user_id AS member_id,
        up.full_name, up.major, up.academic_year, up.gender,
        up.housing_type, up.room_type, up.move_in_term, up.contact_info
       FROM group_members gm1
       JOIN group_members gm2 ON gm1.group_id = gm2.group_id AND gm2.user_id != gm1.user_id
       JOIN user_profiles up ON gm2.user_id = up.user_id
       WHERE gm1.user_id = $1
       ORDER BY gm2.joined_at DESC`,
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

    // Notify the recipient (non-fatal)
    try {
      const nameResult = await pool.query(
        'SELECT full_name FROM user_profiles WHERE user_id = $1',
        [requesterId]
      );
      const requesterName = nameResult.rows[0]?.full_name || 'Someone';
      await pool.query(
        `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'request_received', $2)`,
        [recipientId, `${requesterName} sent you a match request!`]
      );
    } catch (notifErr) {
      console.error('Notification insert error:', notifErr);
    }

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Send match request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches/accept/:requestId - accept an incoming match request (atomic)
router.post('/accept/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const requestId = parseInt(req.params.requestId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lock = await client.query(
      `SELECT id, requester_id FROM match_requests
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       FOR UPDATE`,
      [requestId, userId]
    );

    if (lock.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    const requesterId = lock.rows[0].requester_id;

    await client.query(
      `UPDATE match_requests SET status = 'accepted' WHERE id = $1`,
      [requestId]
    );

    const requesterMembership = await client.query(
      `SELECT group_id FROM group_members WHERE user_id = $1 FOR UPDATE`,
      [requesterId]
    );
    const recipientMembership = await client.query(
      `SELECT group_id FROM group_members WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    const requesterGroupId = requesterMembership.rows[0]?.group_id ?? null;
    const recipientGroupId = recipientMembership.rows[0]?.group_id ?? null;

    if (!requesterGroupId && !recipientGroupId) {
      // Neither is in a group — create a new group with both members
      const newGroup = await client.query(`INSERT INTO groups DEFAULT VALUES RETURNING id`);
      const groupId = newGroup.rows[0].id;
      await client.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [groupId, requesterId, userId]
      );
    } else if (requesterGroupId && !recipientGroupId) {
      // Requester already has a group — add recipient to it
      await client.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
        [requesterGroupId, userId]
      );
    } else if (!requesterGroupId && recipientGroupId) {
      // Recipient already has a group — add requester to it
      await client.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
        [recipientGroupId, requesterId]
      );
    } else if (requesterGroupId !== recipientGroupId) {
      // Both in different groups — merge recipient's group into requester's group
      await client.query(
        `UPDATE group_members SET group_id = $1 WHERE group_id = $2`,
        [requesterGroupId, recipientGroupId]
      );
      await client.query(`DELETE FROM groups WHERE id = $1`, [recipientGroupId]);
    }
    // else: both already in the same group — no action needed

    // Notify the original requester that their request was accepted
    const acceptorName = await client.query(
      'SELECT full_name FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    const name = acceptorName.rows[0]?.full_name || 'Someone';
    await client.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'request_accepted', $2)`,
      [requesterId, `${name} accepted your match request!`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Match accepted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Accept match request error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/matches/decline/:requestId - decline an incoming match request 
router.post('/decline/:requestId', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const requestId = parseInt(req.params.requestId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const lock = await client.query(
      `SELECT id, requester_id FROM match_requests
       WHERE id = $1 AND recipient_id = $2 AND status = 'pending'
       FOR UPDATE`,
      [requestId, userId]
    );

    if (lock.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found or not authorized' });
    }

    const declinedRequesterId = lock.rows[0].requester_id;

    const result = await client.query(
      `UPDATE match_requests SET status = 'declined'
       WHERE id = $1
       RETURNING *`,
      [requestId]
    );

    // Notify the original requester that their request was declined
    const declinerName = await client.query(
      'SELECT full_name FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    const dname = declinerName.rows[0]?.full_name || 'Someone';
    await client.query(
      `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'request_declined', $2)`,
      [declinedRequesterId, `${dname} declined your match request.`]
    );

    await client.query('COMMIT');
    res.json({ request: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Decline match request error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/matches/leave - leave the current group
router.delete('/leave', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const membership = await client.query(
      `SELECT group_id FROM group_members WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (membership.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'You are not in a group' });
    }

    const groupId = membership.rows[0].group_id;

    await client.query(
      `DELETE FROM group_members WHERE user_id = $1 AND group_id = $2`,
      [userId, groupId]
    );

    await client.query(
      `DELETE FROM match_requests
       WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'`,
      [userId]
    );

    const remaining = await client.query(
      `SELECT COUNT(*) FROM group_members WHERE group_id = $1`,
      [groupId]
    );
    if (parseInt(remaining.rows[0].count) === 0) {
      await client.query(`DELETE FROM groups WHERE id = $1`, [groupId]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
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