import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadLecture, uploadNotes, listLectures, deleteLecture } from '../api';

const STATUS_DOT = {
  ready: 'bg-emerald-500',
  failed: 'bg-rose-500',
};

function RecentLectures() {
  const [lectures, setLectures] = useState(null);

  useEffect(() => {
    listLectures()
      .then((data) => setLectures(data.slice(0, 5)))
      .catch(() => setLectures([]));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this lecture? This cannot be undone.')) return;
    setLectures((ls) => ls.filter((l) => l._id !== id));
    try {
      await deleteLecture(id);
    } catch {
      // if delete failed server-side, no harm done leaving it out of the local list
    }
  };

  if (!lectures?.length) return null;

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl shadow-black/40 p-6 border border-slate-800 w-full max-w-lg mx-auto mt-6 relative">
      <h2 className="text-sm font-semibold text-slate-400 mb-3">🕘 Recent lectures</h2>
      <div className="space-y-2">
        {lectures.map((l) => (
          <Link
            key={l._id}
            to={`/lecture/${l._id}`}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-slate-800/60 transition group"
          >
            <span className="text-slate-300 truncate group-hover:text-blue-300 transition">
              {l.sourceType === 'notes' ? '📝' : '🎙️'} {l.title}
            </span>
            <span className="flex items-center gap-2 shrink-0 ml-2">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[l.status] || 'bg-amber-500'}`} title={l.status} />
              <button
                type="button"
                onClick={(e) => handleDelete(e, l._id)}
                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition text-xs"
                title="Delete"
              >
                ✕
              </button>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [mode, setMode] = useState('audio');
  const [file, setFile] = useState(null);
  const [notesFile, setNotesFile] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'audio' && !file) {
      setError('Please choose an audio file first.');
      return;
    }
    if (mode === 'notes' && !notesFile && !notesText.trim()) {
      setError('Please paste some notes or upload a .txt file.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const { id } =
        mode === 'audio'
          ? await uploadLecture(file, title)
          : await uploadNotes({ title, notes: notesText, file: notesFile });
      navigate(`/lecture/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Is the backend running?');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="bg-slate-900 rounded-2xl shadow-xl shadow-black/40 p-9 border border-slate-800 w-full max-w-lg mx-auto relative">
        <h1 className="text-3xl font-bold mb-1 text-blue-400">📚 LectureReplay</h1>
        <p className="text-slate-500 text-base mb-6">Topic timeline, quiz, and flashcards in seconds.</p>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'audio', label: '🎙️ Audio' },
            { key: 'notes', label: '📝 Notes' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                mode === m.key
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-slate-400">
              Lecture title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Intro to Thermodynamics - Lecture 3"
              className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mode === 'audio' ? (
            <div>
              <label className="block text-sm mb-1 font-medium text-slate-400">
                Audio file
              </label>
              <input
                type="file"
                accept="audio/*,video/mp4,video/webm"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:text-sm file:font-semibold hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1 font-medium text-slate-400">
                  Paste notes
                </label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  rows={5}
                  placeholder="Paste your lecture notes here…"
                  className="w-full rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 font-medium text-slate-400">
                  …or upload a .txt or .pdf file
                </label>
                <input
                  type="file"
                  accept=".txt,.pdf,text/plain,application/pdf"
                  onChange={(e) => setNotesFile(e.target.files[0])}
                  className="w-full text-sm text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white file:text-sm file:font-semibold hover:file:bg-blue-500 file:cursor-pointer cursor-pointer"
                />
              </div>
            </div>
          )}

          {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/50 hover:shadow-lg hover:from-blue-500 hover:to-cyan-400 transition disabled:opacity-50"
          >
            {submitting ? '✨ Uploading…' : '🚀 Upload & Process'}
          </button>
        </form>
      </div>

      <RecentLectures />
    </div>
  );
}
