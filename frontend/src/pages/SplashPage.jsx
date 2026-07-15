export default function SplashPage({ duration = 2200 }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-blue-600/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] bg-cyan-500/15 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-blue-500/5 rounded-full blur-3xl" />

      <div className="text-center relative">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-6xl drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">📚</span>
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent tracking-tight">
            LectureReplay
          </h1>
        </div>
        <p className="text-slate-400 text-lg mb-10 tracking-wide">Quick revision, made easy</p>
        <div className="h-1.5 w-72 mx-auto bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ animation: `loadbar ${duration}ms linear forwards` }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loadbar {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
