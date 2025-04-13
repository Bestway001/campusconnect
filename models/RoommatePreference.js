const mongoose = require("mongoose");

const roommatePreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  location: { type: String, required: true },
  budget: { type: Number, required: true },
  genderPreference: {
    type: String,
    enum: ["male", "female", "any"],
    default: "any",
  },
  smoking: { type: Boolean, default: false },
  pets: { type: Boolean, default: false },
  lifestyle: {
    type: String,
    enum: ["quiet", "social", "flexible"],
    default: "flexible",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RoommatePreference", roommatePreferenceSchema);
