const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  university: { type: String, required: true },
  department: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tasks: [
    {
      title: { type: String, required: true },
      description: { type: String },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deadline: { type: Date },
      status: {
        type: String,
        enum: ["todo", "in-progress", "done"],
        default: "todo",
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
