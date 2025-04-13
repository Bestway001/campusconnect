const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema({
  university: { type: String, required: true },
  department: { type: String },
  title: { type: String, required: true },
  content: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Forum", forumSchema);
