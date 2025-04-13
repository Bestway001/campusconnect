const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");
const User = require("../models/User");

router.post("/", auth, async (req, res) => {
  const { title, description, date, location, university, tickets } = req.body;
  try {
    const event = new Event({
      title,
      description,
      date,
      location,
      university,
      postedBy: req.user.id,
      tickets,
    });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().populate("postedBy", "name");
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/:id/ticket", auth, async (req, res) => {
  const { ticketType } = req.body;
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ msg: "Event not found" });

    const ticket = event.tickets.find((t) => t.type === ticketType);
    if (!ticket || ticket.available <= 0)
      return res.status(400).json({ msg: "Ticket not available" });

    const user = await User.findById(req.user.id);
    if (user.walletBalance < ticket.price)
      return res.status(400).json({ msg: "Insufficient balance" });

    user.walletBalance -= ticket.price;
    ticket.available -= 1;
    ticket.purchasedBy.push(req.user.id);

    await user.save();
    await event.save();

    res.json({ msg: "Ticket purchased", event });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
