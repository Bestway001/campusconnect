const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hostel = require('../models/Hostel');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/', auth, upload.array('photos', 5), async (req, res) => {
  const { title, description, rent, amenities, location, university } = req.body;
  try {
    const hostel = new Hostel({
      title,
      description,
      rent,
      amenities: amenities.split(','),
      location,
      university,
      postedBy: req.user.id,
      photos: req.files.map(file => file.path),
    });
    await hostel.save();
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const hostels = await Hostel.find().populate('postedBy', 'name');
    res.json(hostels);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/:id/review', auth, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ msg: 'Hostel not found' });

    hostel.reviews.push({ user: req.user.id, rating, comment });
    await hostel.save();
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;