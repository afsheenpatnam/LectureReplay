const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema({
  start: Number,
  end: Number,
  headline: String,
  summary: String,
  weight: Number,
}, { _id: false });

const revisionSectionSchema = new mongoose.Schema({
  heading: String,
  bullets: [String],
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctIndex: Number,
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  front: String,
  back: String,
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sourceType: { type: String, enum: ['audio', 'notes'], default: 'audio' },
  audioFilename: String,
  status: {
    type: String,
    enum: ['uploaded', 'transcribing', 'generating', 'ready', 'failed'],
    default: 'uploaded',
  },
  error: String,
  transcript: String,
  chapters: [chapterSchema],
  quiz: [quizQuestionSchema],
  flashcards: [flashcardSchema],
  revisionNotes: [revisionSectionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Lecture', lectureSchema);
