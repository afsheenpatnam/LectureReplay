import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLecture, askAboutLecture } from '../api';

const STATUS_LABEL = {
  uploaded: 'Queued…',
  transcribing: 'Transcribing audio…',
  generating: 'Generating quiz & flashcards…',
  ready: 'Ready',
  failed: 'Failed',
};

function formatTime(seconds) {
  const s = Math.round(seconds / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

function Timeline({ chapters }) {
  if (!chapters?.length) return null;
  return (
    <div className="space-y-3">
      {chapters.map((c, i) => (
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4 hover:border-blue-800 hover:shadow-md hover:shadow-blue-950/40 transition-all">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-blue-400">{c.headline}</span>
            {c.start != null && c.end != null && (
              <span className="text-xs font-medium text-cyan-400 bg-cyan-950/40 rounded-full px-2 py-0.5">
                {formatTime(c.start)} – {formatTime(c.end)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{c.summary}</p>
        </div>
      ))}
    </div>
  );
}

function TopicBreakdown({ chapters }) {
  if (!chapters?.length) return null;

  const values = chapters.map((c) =>
    c.start != null && c.end != null ? c.end - c.start : c.weight ?? 1
  );
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const pct = values.map((v) => Math.round((v / total) * 100));

  return (
    <div className="mb-8 bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4">
      <h2 className="text-sm font-semibold text-blue-400 mb-3">📊 Topic breakdown</h2>
      <div className="space-y-2">
        {chapters.map((c, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="w-36 sm:w-44 shrink-0 truncate text-xs text-slate-400"
              title={c.headline}
            >
              {c.headline}
            </span>
            <div className="flex-1 h-3 rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                style={{ width: `${pct[i]}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-xs text-slate-400 tabular-nums">
              {pct[i]}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevisionNotes({ notes, chapters, title }) {
  if (!notes?.length) return null;
  return (
    <div>
      <div className="flex justify-end mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>
      <div id="printable-revision-notes">
        <h2 className="hidden print:block text-2xl font-bold mb-4">{title}</h2>
        <TopicBreakdown chapters={chapters} />
        <div className="space-y-6">
          {notes.map((section, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4 hover:border-blue-800 hover:shadow-md hover:shadow-blue-950/40 transition-all print:border-slate-300 print:bg-white print:text-black">
              <h3 className="font-semibold text-blue-400 mb-2 print:text-black">📌 {section.heading}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-300 print:text-black">
                {section.bullets.map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ['#3b82f6', '#22d3ee', '#a855f7', '#34d399', '#f59e0b'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 2 + Math.random() * 1.5;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 6;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-10px',
              left: `${left}%`,
              width: size,
              height: size * 0.4,
              background: color,
              animation: `confetti-fall ${duration}s ease-in ${delay}s forwards`,
              borderRadius: 2,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          to { transform: translateY(105vh) rotate(540deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function Quiz({ quiz }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz?.length) return null;

  const score = quiz.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );
  const celebrate = submitted && score / quiz.length >= 0.7;

  return (
    <div className="space-y-6">
      {celebrate && <Confetti />}
      {quiz.map((q, i) => (
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4 hover:border-blue-900 transition-all">
          <p className="font-semibold mb-3 text-slate-200">
            {i + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[i] === oi;
              const isCorrect = submitted && oi === q.correctIndex;
              const isWrong = submitted && isSelected && oi !== q.correctIndex;
              return (
                <button
                  key={oi}
                  type="button"
                  disabled={submitted}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                  className={`w-full text-left rounded-xl border-2 px-3 py-2 text-sm font-medium transition text-slate-300
                    ${isSelected && !submitted ? 'border-blue-500 bg-blue-950/40' : 'border-slate-700'}
                    ${isCorrect ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : ''}
                    ${isWrong ? 'border-rose-500 bg-rose-950/40 text-rose-300' : ''}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-900/50 hover:shadow-xl transition"
        >
          Submit answers
        </button>
      ) : (
        <p className="font-bold text-lg text-blue-400">
          🎉 Score: {score} / {quiz.length}
        </p>
      )}
    </div>
  );
}

function AskAI({ lectureId }) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion('');
    setError('');
    setAsking(true);
    try {
      const { answer } = await askAboutLecture(lectureId, q);
      setHistory((h) => [...h, { question: q, answer }]);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong asking that.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-4">
      {history.length === 0 && (
        <p className="text-sm text-slate-500 italic">
          Ask anything about this lecture — the AI answers using only what was actually said.
        </p>
      )}
      <div className="space-y-4">
        {history.map((h, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4">
            <p className="text-sm font-semibold text-cyan-400 mb-2">🙋 {h.question}</p>
            <p className="text-sm text-slate-300 leading-relaxed">{h.answer}</p>
          </div>
        ))}
      </div>
      {asking && <p className="text-sm text-slate-500">🤖 Thinking…</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What's the difference between a mutex and a semaphore?"
          className="flex-1 rounded-xl bg-slate-800/60 border border-slate-700 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/50 hover:shadow-lg transition disabled:opacity-40"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Flashcards({ flashcards, lectureId }) {
  const storageKey = `known-flashcards-${lectureId}`;
  const [order, setOrder] = useState(() => flashcards.map((_, i) => i));
  const [flipped, setFlipped] = useState({});
  const [known, setKnown] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  });
  const [hideKnown, setHideKnown] = useState(false);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(known));
  }, [known, storageKey]);

  if (!flashcards?.length) return null;

  const knownCount = Object.values(known).filter(Boolean).length;
  const visibleOrder = hideKnown ? order.filter((i) => !known[i]) : order;

  const markKnown = (i, value) => setKnown((k) => ({ ...k, [i]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-slate-400">
          ✅ <span className="font-semibold text-emerald-400">{knownCount}</span> / {flashcards.length} known
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHideKnown((h) => !h)}
            className="rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
          >
            {hideKnown ? '👁️ Show all' : '🙈 Hide known'}
          </button>
          <button
            type="button"
            onClick={() => setOrder((o) => shuffleArray(o))}
            className="rounded-full bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition"
          >
            🔀 Shuffle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleOrder.map((i) => {
          const c = flashcards[i];
          return (
            <div
              key={i}
              className={`rounded-2xl border-2 shadow-sm p-4 min-h-[130px] flex flex-col justify-between transition ${
                known[i] ? 'border-emerald-800 bg-emerald-950/20' : 'border-slate-700 bg-slate-900 hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <button
                type="button"
                onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                className="text-left flex-1"
              >
                <p className="text-xs uppercase tracking-wide font-bold text-cyan-400 mb-2">
                  {flipped[i] ? '✅ Answer' : '💡 Term'}
                </p>
                <p className="text-sm text-slate-200">{flipped[i] ? c.back : c.front}</p>
              </button>
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => markKnown(i, !known[i])}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition ${
                    known[i]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {known[i] ? '✓ Known' : 'Mark as known'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LecturePage() {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [tab, setTab] = useState('timeline');

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const data = await getLecture(id);
        if (stop) return;
        setLecture(data);
        if (data.status !== 'ready' && data.status !== 'failed') {
          setTimeout(poll, 3000);
        }
      } catch {
        if (!stop) setTimeout(poll, 5000);
      }
    };
    poll();
    return () => {
      stop = true;
    };
  }, [id]);

  if (!lecture) {
    return <p className="text-center mt-16 text-slate-400">Loading…</p>;
  }

  if (lecture.status !== 'ready') {
    return (
      <div className="max-w-xl mx-auto mt-16 px-6 text-center">
        <div className="bg-slate-900 rounded-3xl shadow-xl shadow-black/40 p-8 border border-slate-800">
          <h1 className="text-2xl font-bold mb-4 text-blue-400">{lecture.title}</h1>
          <p className="text-slate-400">{STATUS_LABEL[lecture.status]}</p>
          {lecture.status === 'failed' && (
            <p className="text-rose-400 text-sm mt-2">{lecture.error}</p>
          )}
          <Link to="/upload" className="inline-block mt-6 text-blue-400 font-medium hover:underline">
            ← Upload another lecture
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 px-6 pb-16">
      <Link to="/upload" className="text-blue-400 font-medium hover:underline text-sm print:hidden">
        ← Upload another lecture
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-6 text-blue-400 print:hidden">{lecture.title}</h1>

      <div className="flex gap-2 mb-6 flex-wrap print:hidden">
        {[
          ['timeline', '🕒 Timeline'],
          ['revision', '📖 Revision Notes'],
          ['quiz', '🧠 Quiz'],
          ['flashcards', '🗂️ Flashcards'],
          ['ask', '🤖 Ask AI'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              tab === key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'timeline' && <Timeline chapters={lecture.chapters} />}
      {tab === 'revision' && (
        <RevisionNotes notes={lecture.revisionNotes} chapters={lecture.chapters} title={lecture.title} />
      )}
      {tab === 'quiz' && <Quiz quiz={lecture.quiz} />}
      {tab === 'flashcards' && <Flashcards flashcards={lecture.flashcards} lectureId={lecture._id} />}
      {tab === 'ask' && <AskAI lectureId={lecture._id} />}
    </div>
  );
}
