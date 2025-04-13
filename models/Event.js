const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  university: { type: String, required: true },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tickets: [
    {
      type: { type: String, required: true },
      price: { type: Number, required: true },
      available: { type: Number, required: true },
      purchasedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", eventSchema);
