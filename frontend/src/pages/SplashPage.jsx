export default function SplashPage({ duration = 2200 }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="text-center relative">
        <h1 className="text-3xl font-bold text-blue-400 mb-1">📚 LectureReplay</h1>
        <p className="text-slate-500 text-sm mb-6">Quick revision, made easy</p>
        <div className="h-1 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
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
