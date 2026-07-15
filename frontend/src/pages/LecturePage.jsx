import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLecture } from '../api';

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
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4">
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

function RevisionNotes({ notes, chapters }) {
  if (!notes?.length) return null;
  return (
    <div>
      <TopicBreakdown chapters={chapters} />
      <div className="space-y-6">
        {notes.map((section, i) => (
          <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4">
            <h3 className="font-semibold text-blue-400 mb-2">📌 {section.heading}</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
              {section.bullets.map((b, bi) => (
                <li key={bi}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
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

  return (
    <div className="space-y-6">
      {quiz.map((q, i) => (
        <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 shadow-sm p-4">
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

function Flashcards({ flashcards }) {
  const [flipped, setFlipped] = useState({});
  if (!flashcards?.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {flashcards.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
          className="rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-sm p-4 text-left min-h-[110px] hover:border-blue-500 hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-wide font-bold text-cyan-400 mb-2">
            {flipped[i] ? '✅ Answer' : '💡 Term'}
          </p>
          <p className="text-sm text-slate-200">{flipped[i] ? c.back : c.front}</p>
        </button>
      ))}
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
      <Link to="/upload" className="text-blue-400 font-medium hover:underline text-sm">
        ← Upload another lecture
      </Link>
      <h1 className="text-3xl font-bold mt-2 mb-6 text-blue-400">{lecture.title}</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          ['timeline', '🕒 Timeline'],
          ['revision', '📖 Revision Notes'],
          ['quiz', '🧠 Quiz'],
          ['flashcards', '🗂️ Flashcards'],
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
        <RevisionNotes notes={lecture.revisionNotes} chapters={lecture.chapters} />
      )}
      {tab === 'quiz' && <Quiz quiz={lecture.quiz} />}
      {tab === 'flashcards' && <Flashcards flashcards={lecture.flashcards} />}
    </div>
  );
}
