const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/hostels", require("./routes/hostel"));
app.use("/api/forums", require("./routes/forum"));
app.use("/api/marketplace", require("./routes/marketplace"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/roommate", require("./routes/roommate"));
app.use("/api/events", require("./routes/event"));
app.use("/api/projects", require("./routes/project"));
app.use("/api/admin", require("./routes/admin"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinProject", (projectId) => {
    socket.join(projectId);
  });

  socket.on("updateTask", async ({ projectId, taskId, status }) => {
    try {
      const project = await require("./models/Project").findById(projectId);
      const task = project.tasks.id(taskId);
      if (task) {
        task.status = status;
        await project.save();
        io.to(projectId).emit("taskUpdated", { taskId, status });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
