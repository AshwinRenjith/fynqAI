import { Flame, LogIn, Plus, UserPlus } from 'lucide-react';

const chromeTabs = [
  { label: 'Dashboard — fynqAI', active: false },
  { label: 'Study Studio', active: false },
  { label: 'Copilot Session', active: true },
  { label: '…', active: false },
];

export function WindowChrome() {
  return (
    <header className="glass-panel relative mb-8 flex items-center justify-between rounded-3xl px-5 py-3 shadow-subtle">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Create workspace"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-slate-500 shadow-inner transition-transform hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </button>
        <nav className="flex items-center gap-2">
          {chromeTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={`rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${
                tab.active
                  ? 'border-white/80 bg-white/90 text-slate-800 shadow-sm'
                  : 'border-white/30 bg-white/40 text-slate-500 hover:border-white/60 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-2 shadow-subtle">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-amber-300 to-pink-400 text-white shadow-[0_12px_24px_rgba(244,153,64,0.35)]">
            <Flame className="h-4 w-4" />
          </span>
          <div className="leading-tight text-left">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Streak</p>
            <p className="text-sm font-semibold text-slate-700"><span className="text-slate-900">05</span> days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_12px_32px_rgba(71,86,125,0.12)] transition-colors hover:border-white/80 hover:text-slate-800"
          >
            <LogIn className="h-4 w-4" />
            Log in
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(93,114,255,0.45)] transition-transform hover:-translate-y-0.5"
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
        </div>
      </div>
    </header>
  );
}
