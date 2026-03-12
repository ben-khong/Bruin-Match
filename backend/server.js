require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const usersRoutes = require('./routes/users');
const filtersRoutes = require('./routes/filters');
const notificationsRoutes = require('./routes/notifications');
const groupRoutes = require('./routes/groups');
const initDb = require('./config/initDb');
const pool = require('./config/db');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/filters/saved', filtersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/groups', groupRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

io.on('connection', (socket) => {
  console.log('A Bruin connected:', socket.id);

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log('User joined group: ${groupId}');
  });

  socket.on('send_message', async (data) => {
    const {groupId, senderId, content } = data;

    try {
      await pool.query(
        'INSERT INTO messages (group_id, sender_id, content) VALUES ($1, $2, $3)',
        [groupId, senderId, content]
      );
      io.to(groupId).emit('receive_message', data);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  })
})

async function startServer() {
  try {
    await initDb();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();
