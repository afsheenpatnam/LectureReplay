const axios = require('axios');

const BASE_URL = 'https://api.groq.com/openai/v1';

// Truncate very long text so the prompt stays within a comfortable token budget.
function truncate(text, maxChars = 15000) {
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

async function callGroqJson(prompt) {
  const res = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return JSON.parse(res.data.choices[0].message.content);
}

const REVISION_NOTES_SPEC = `4. Revision notes: 3-6 sections (reuse the same topic headings), each with 3-5 short, exam-ready bullet points. Stick closely to facts actually stated in the source — do not invent details.`;

async function generateQuizAndFlashcards(transcript) {
  const prompt = `You are helping a student review a recorded lecture.
Given the transcript below, produce:
1. 5 multiple-choice quiz questions (4 options each, only one correct) covering the most important concepts.
2. 8 flashcards (front = term or question, back = concise answer/definition) for key concepts.
${REVISION_NOTES_SPEC}

Respond with strict JSON only, in this exact shape:
{
  "quiz": [{ "question": "...", "options": ["...","...","...","..."], "correctIndex": 0 }],
  "flashcards": [{ "front": "...", "back": "..." }],
  "revisionNotes": [{ "heading": "...", "bullets": ["...", "..."] }]
}

Transcript:
"""${truncate(transcript)}"""`;

  const parsed = await callGroqJson(prompt);
  return {
    quiz: parsed.quiz || [],
    flashcards: parsed.flashcards || [],
    revisionNotes: parsed.revisionNotes || [],
  };
}

// For text-based notes (no audio, so no real timestamps): asks the model to
// also build a topic outline with a relative "weight" so the UI can still
// render a topic-breakdown chart without real durations.
async function generateFromNotes(notes) {
  const prompt = `You are helping a student review their lecture notes.
Given the notes below, produce:
1. A topic outline: 3-6 sections in the order they appear in the notes, each with a short headline, a 1-2 sentence summary, and a "weight" from 1-10 estimating how much of the notes that topic covers.
2. 5 multiple-choice quiz questions (4 options each, only one correct) covering the most important concepts.
3. 8 flashcards (front = term or question, back = concise answer/definition) for key concepts.
${REVISION_NOTES_SPEC}

Respond with strict JSON only, in this exact shape:
{
  "chapters": [{ "headline": "...", "summary": "...", "weight": 5 }],
  "quiz": [{ "question": "...", "options": ["...","...","...","..."], "correctIndex": 0 }],
  "flashcards": [{ "front": "...", "back": "..." }],
  "revisionNotes": [{ "heading": "...", "bullets": ["...", "..."] }]
}

Notes:
"""${truncate(notes)}"""`;

  const parsed = await callGroqJson(prompt);
  return {
    chapters: parsed.chapters || [],
    quiz: parsed.quiz || [],
    flashcards: parsed.flashcards || [],
    revisionNotes: parsed.revisionNotes || [],
  };
}

async function askQuestion(transcript, question) {
  const prompt = `You are a helpful tutor answering a student's question about their lecture.
Answer ONLY using facts from the transcript below. If the transcript doesn't cover the
question, say so honestly instead of making something up. Keep the answer concise (2-5 sentences).

Transcript:
"""${truncate(transcript)}"""

Student's question: ${question}`;

  const res = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content;
}

module.exports = { generateQuizAndFlashcards, generateFromNotes, askQuestion };
