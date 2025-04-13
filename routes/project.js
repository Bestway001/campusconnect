const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");

router.post("/", auth, async (req, res) => {
  const { title, description, university, department, members } = req.body;
  try {
    const project = new Project({
      title,
      description,
      university,
      department,
      members: [req.user.id, ...members],
    });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.user.id }).populate(
      "members",
      "name"
    );
    res.json(projects);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/:id/task", auth, async (req, res) => {
  const { title, description, assignedTo, deadline } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: "Project not found" });
    if (!project.members.includes(req.user.id))
      return res.status(403).json({ msg: "Unauthorized" });

    project.tasks.push({ title, description, assignedTo, deadline });
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.put("/:id/task/:taskId", auth, async (req, res) => {
  const { status } = req.body;
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: "Project not found" });
    if (!project.members.includes(req.user.id))
      return res.status(403).json({ msg: "Unauthorized" });

    const task = project.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    task.status = status;
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
