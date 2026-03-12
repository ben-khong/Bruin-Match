const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

//Verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    
    // Support various payload structures
    req.user = { id: decoded.id || decoded.userId || decoded.sub };
    next();
  });
}

// --- GROUP CREATION ---

router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { group_name } = req.body; 
        const leaderId = req.user.id; 

        if (!leaderId) {
            return res.status(400).json({ error: "User ID missing from token" });
        }

        await client.query('BEGIN');

        // 1. Create the group with the provided name
        const newGroupRes = await client.query(
            'INSERT INTO roommate_groups (leader_id, group_name) VALUES ($1, $2) RETURNING id, group_name, leader_id',
            [leaderId, group_name || 'New Group']
        );

        const newGroup = newGroupRes.rows[0];

        // 2. Automatically add the creator as the first member
        await client.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [newGroup.id, leaderId]
        );

        await client.query('COMMIT');
        res.json(newGroup);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Group Creation Error:", err);
        res.status(500).json({ error: "Failed to create group" });
    } finally {
        client.release();
    }
});

// --- INVITE SYSTEM ---

router.post('/invite', authenticateToken, async (req, res) => {
  const { groupId, receiverId } = req.body;
  const senderId = req.user.id;

  try {
    const isMember = await pool.query(
      `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [groupId, receiverId]
    );

    if (isMember.rows.length > 0) {
      return res.status(400).json({ error: "This Bruin is already in your group!" });
    }

    const existingInvite = await pool.query(
      `SELECT * FROM group_invites WHERE group_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [groupId, receiverId]
    );

    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ error: "An invite is already pending for this user." });
    }

    await pool.query(
      'INSERT INTO group_invites (group_id, sender_id, receiver_id) VALUES ($1, $2, $3)',
      [groupId, senderId, receiverId]
    );

    res.json({ message: "Invite sent!" });
  } catch (err) {
    res.status(500).json({ error: "Server error sending invite" });
  }
});

router.post('/invite/respond', authenticateToken, async (req, res) => {
  const { inviteId, action } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    if (action === 'accepted') {
      const invite = await client.query('SELECT * FROM group_invites WHERE id = $1', [inviteId]);
      if (invite.rows.length === 0) throw new Error("Invite not found");

      const { group_id, receiver_id } = invite.rows[0];

      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [group_id, receiver_id]
      );
    }

    // Remove invite regardless of accept/decline
    await client.query('DELETE FROM group_invites WHERE id = $1', [inviteId]);

    await client.query('COMMIT');
    res.json({ message: `Invite ${action}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Response failed" });
  } finally {
    client.release();
  }
});

router.get('/invites/pending', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                i.id as invite_id, 
                i.group_id, 
                g.group_name, 
                u.username as sender_name
            FROM group_invites i
            JOIN roommate_groups g ON i.group_id = g.id
            JOIN users u ON i.sender_id = u.id
            WHERE i.receiver_id = $1 AND i.status = 'pending'`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch invites" });
    }
});

// --- GROUP MANAGEMENT ---

router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; 
    const result = await pool.query(
      `SELECT g.id, g.group_name, g.leader_id 
       FROM roommate_groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username 
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [req.params.groupId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Leader-only remove member
router.delete('/:groupId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user.id;

    // Check if requester is the leader
    const groupCheck = await pool.query('SELECT leader_id FROM roommate_groups WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) return res.status(404).json({ error: "Group not found" });
    
    if (groupCheck.rows[0].leader_id !== requesterId) {
      return res.status(403).json({ error: "Only the leader can remove members" });
    }

    await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// --- MESSAGING ---

router.get('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await pool.query(
      `SELECT m.*, u.username 
       FROM messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.group_id = $1 
       ORDER BY m.created_at ASC`,
      [req.params.groupId]
    );
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch history" });
  }
});

// LEAVE GROUP (For Members)
router.delete('/:groupId/leave', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Check if user is the leader
        const groupRes = await pool.query('SELECT leader_id FROM roommate_groups WHERE id = $1', [groupId]);
        if (groupRes.rows.length > 0 && groupRes.rows[0].leader_id === userId) {
            return res.status(400).json({ error: "Leaders cannot leave. You must delete the group or transfer leadership." });
        }

        await pool.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
        res.json({ message: "You have left the group." });
    } catch (err) {
        res.status(500).json({ error: "Failed to leave group" });
    }
});

// DELETE GROUP (For Leaders Only)
router.delete('/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        // Verify requester is the leader
        const groupRes = await pool.query('SELECT leader_id FROM roommate_groups WHERE id = $1', [groupId]);
        if (groupRes.rows.length === 0) return res.status(404).json({ error: "Group not found" });
        if (groupRes.rows[0].leader_id !== userId) return res.status(403).json({ error: "Only the leader can delete the group" });

        // Delete group (Foreign keys should handle members/invites if set to CASCADE, 
        // otherwise delete them manually first)
        await pool.query('DELETE FROM group_invites WHERE group_id = $1', [groupId]);
        await pool.query('DELETE FROM group_members WHERE group_id = $1', [groupId]);
        await pool.query('DELETE FROM roommate_groups WHERE id = $1', [groupId]);

        res.json({ message: "Group deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete group" });
    }
});

module.exports = router;