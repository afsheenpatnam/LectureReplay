require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const lectureRoutes = require('../routes/lecture');

const app = express();
app.use(cors());
app.use(express.json());

let connected = false;
app.use(async (req, res, next) => {
  if (connected && mongoose.connection.readyState === 1) return next();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

app.use('/api/lectures', lectureRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
