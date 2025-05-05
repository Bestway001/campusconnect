const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
require("dotenv").config(); // Load environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://campusconnect-1f6h.onrender.com",
    ],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://campusconnect-1f6h.onrender.com",
    ],
  })
);
app.use(express.json());

// MongoDB connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusconnect"
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded.user;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("sendMessage", async (message) => {
    try {
      const newMessage = new (require("./models/Message"))({
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        timestamp: message.timestamp,
      });
      await newMessage.save();
      io.to(message.recipient).emit("receiveMessage", message);
      io.to(message.sender).emit("receiveMessage", message);
    } catch (err) {
      console.error("Message save error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
