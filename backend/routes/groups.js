const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// Verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    
    req.user = { id: decoded.id || decoded.userId || decoded.sub };
    
    console.log("Authenticated User ID:", req.user.id); // THIS WILL NOW SHOW IN TERMINAL
    next();
  });
}

router.post('/invite', authenticateToken, async (req, res) => {
  const { groupId, receiverId } = req.body;
  const senderId = req.user.id;

  try {
    const isMember = await pool.query(
      `SELECT * FROM group_members 
       WHERE group_id = $1 AND user_id = $2`,
      [groupId, receiverId]
    );

    if (isMember.rows.length > 0) {
      return res.status(400).json({ error: "This Bruin is already in your group!" });
    }

    const existingInvite = await pool.query(
      `SELECT * FROM group_invites 
       WHERE group_id = $1 AND receiver_id = $2 AND status = 'pending'`,
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/invite/respond', authenticateToken, async (req, res) => {
  const { inviteId, action } = req.body; // action is 'accepted' or 'declined'
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    if (action === 'accepted') {
      const invite = await client.query('SELECT * FROM group_invites WHERE id = $1', [inviteId]);
      const { group_id, receiver_id } = invite.rows[0];

      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [group_id, receiver_id]
      );
    }

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
                i.group_id, -- ADD THIS LINE
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

router.post('/', authenticateToken, async (req, res) => {
    try {
        // Use group_name to match your schema
        const { group_name } = req.body; 
        // Standardize to .id (matching your authenticateToken logic)
        const leaderId = req.user.id; 

        if (!leaderId) {
            return res.status(400).json({ error: "User ID missing from token" });
        }

        // 1. Insert the group
        const newGroup = await pool.query(
            'INSERT INTO roommate_groups (leader_id, group_name) VALUES ($1, $2) RETURNING id, group_name, leader_id',
            [leaderId, group_name || 'New Group']
        );

        const groupId = newGroup.rows[0].id;
  
        // 2. IMPORTANT: Insert the leader into the members table
        // If this step fails, the group won't show up in "my-groups"
        await pool.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [groupId, leaderId]
        );
  
        console.log("Group created successfully:", newGroup.rows[0]);
        res.json(newGroup.rows[0]);
    } catch (err) {
        console.error("Group Creation Error:", err);
        res.status(500).json({ error: "Failed to create group" });
    }
});


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

router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.groupId; // Ensure we get this from the URL
    console.log("Fetching members for group ID:", groupId);

    const result = await pool.query(
      `SELECT u.id, u.username 
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [groupId]
    );

    console.log(`Found ${result.rows.length} members`);
    res.json(result.rows);
  } catch (err) {
    // If this fails, THIS message WILL appear in your terminal
    console.error("CRITICAL ERROR IN /MEMBERS ROUTE:");
    console.error(err); 
    res.status(500).json({ error: "Server crashed while fetching members" });
  }
});


module.exports = router;