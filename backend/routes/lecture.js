const express = require('express');
const multer = require('multer');
const os = require('os');
const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const Lecture = require('../models/Lecture');
const { transcribeWithChapters } = require('../services/assemblyai');
const { generateQuizAndFlashcards, generateFromNotes } = require('../services/groq');

const router = express.Router();

// Vercel's filesystem is read-only except /tmp, so uploads always land there.
const upload = multer({ dest: os.tmpdir() });

router.post('/upload', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  const title = req.body.title || req.file.originalname;
  const lecture = await Lecture.create({
    title,
    sourceType: 'audio',
    audioFilename: req.file.originalname,
    status: 'transcribing',
  });

  try {
    const { transcript, chapters } = await transcribeWithChapters(req.file.path);
    await Lecture.findByIdAndUpdate(lecture._id, { status: 'generating', transcript, chapters });

    const { quiz, flashcards, revisionNotes } = await generateQuizAndFlashcards(transcript);
    await Lecture.findByIdAndUpdate(lecture._id, { status: 'ready', quiz, flashcards, revisionNotes });
  } catch (err) {
    console.error('Lecture processing failed:', err.message);
    await Lecture.findByIdAndUpdate(lecture._id, { status: 'failed', error: err.message });
  } finally {
    fs.unlink(req.file.path, () => {});
  }

  res.status(201).json({ id: lecture._id });
});

router.post('/upload-notes', upload.single('notesFile'), async (req, res) => {
  let notesText = req.body.notes;

  if (req.file) {
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const buffer = fs.readFileSync(req.file.path);
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      notesText = result.text;
    } else {
      notesText = fs.readFileSync(req.file.path, 'utf-8');
    }
    fs.unlink(req.file.path, () => {});
  }

  if (!notesText || !notesText.trim()) {
    return res.status(400).json({ error: 'No notes text provided' });
  }

  const title = req.body.title || 'Untitled Notes';
  const lecture = await Lecture.create({
    title,
    sourceType: 'notes',
    status: 'generating',
  });

  try {
    const { chapters, quiz, flashcards, revisionNotes } = await generateFromNotes(notesText);
    await Lecture.findByIdAndUpdate(lecture._id, {
      status: 'ready',
      transcript: notesText,
      chapters,
      quiz,
      flashcards,
      revisionNotes,
    });
  } catch (err) {
    console.error('Notes processing failed:', err.message);
    await Lecture.findByIdAndUpdate(lecture._id, { status: 'failed', error: err.message });
  }

  res.status(201).json({ id: lecture._id });
});

router.get('/', async (req, res) => {
  const lectures = await Lecture.find().sort({ createdAt: -1 }).select('title status createdAt');
  res.json(lectures);
});

router.get('/:id', async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
  res.json(lecture);
});

module.exports = router;
