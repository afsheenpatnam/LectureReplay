export default function SplashPage({ duration = 5000 }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-amber-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] bg-orange-200/40 rounded-full blur-3xl" />

      <div className="text-center relative">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-6xl">📚</span>
          <h1 className="text-6xl font-extrabold text-stone-800 tracking-tight">
            Lecture<span className="text-amber-600">Replay</span>
          </h1>
        </div>
        <p className="text-stone-500 text-lg mb-10 tracking-wide">Quick revision, made easy</p>
        <div className="h-1.5 w-72 mx-auto bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
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
