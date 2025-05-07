require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"]["https://campusconnect-1f6h.onrender.com"],
    methods: ['GET', 'POST']  }
});

// Middleware
app.use(cors({ origin: ["http://localhost:3000"]["https://campusconnect-1f6h.onrender.com"] }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost/campusconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('sendMessage', async (message) => {
    try {
      const newMessage = new (require('./models/Message'))({
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        timestamp: message.timestamp
      });
      await newMessage.save();
      io.to(message.recipient).emit('receiveMessage', message);
      io.to(message.sender).emit('receiveMessage', message);
    } catch (err) {
      console.error('Message save error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Missing EMAIL_USER or EMAIL_PASS in environment variables');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in environment variables');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));