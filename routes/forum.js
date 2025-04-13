const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Forum = require("../models/Forum");

router.post("/", auth, async (req, res) => {
  const { university, department, title, content } = req.body;
  try {
    const forum = new Forum({
      university,
      department,
      title,
      content,
      postedBy: req.user.id,
    });
    await forum.save();
    res.json(forum);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const forums = await Forum.find().populate("postedBy", "name");
    res.json(forums);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/:id/comment", auth, async (req, res) => {
  const { content } = req.body;
  try {
    const forum = await Forum.findById(req.params.id);
    if (!forum) return res.status(404).json({ msg: "Forum not found" });

    forum.comments.push({ user: req.user.id, content });
    await forum.save();
    res.json(forum);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
