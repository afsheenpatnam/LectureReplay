const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'https://api.assemblyai.com/v2';

function client() {
  return axios.create({
    baseURL: BASE_URL,
    headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
  });
}

async function uploadAudio(filePath) {
  const api = client();
  const stream = fs.createReadStream(filePath);
  const res = await api.post('/upload', stream, {
    headers: { 'transfer-encoding': 'chunked' },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data.upload_url;
}

async function requestTranscript(audioUrl) {
  const api = client();
  const res = await api.post('/transcript', {
    audio_url: audioUrl,
    auto_chapters: true,
  });
  return res.data.id;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTranscript(transcriptId) {
  const api = client();
  while (true) {
    const res = await api.get(`/transcript/${transcriptId}`);
    const { status } = res.data;
    if (status === 'completed') return res.data;
    if (status === 'error') throw new Error(res.data.error || 'AssemblyAI transcription failed');
    await sleep(3000);
  }
}

// Uploads audio, requests a transcript with auto-generated topic chapters,
// and polls until AssemblyAI finishes processing.
async function transcribeWithChapters(filePath) {
  const audioUrl = await uploadAudio(filePath);
  const transcriptId = await requestTranscript(audioUrl);
  const result = await pollTranscript(transcriptId);

  const chapters = (result.chapters || []).map((c) => ({
    start: c.start,
    end: c.end,
    headline: c.headline,
    summary: c.summary,
  }));

  return { transcript: result.text, chapters };
}

module.exports = { transcribeWithChapters };
