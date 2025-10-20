import { MessageSquarePlus, User } from 'lucide-react';

export function RightRail() {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/40 bg-slate-900 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(42,52,83,0.32)] transition-transform hover:-translate-y-0.5"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New Chat
      </button>
      <div className="glass-panel rounded-[28px] p-6 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Active Agent</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white via-slate-100 to-indigo-100 text-slate-600 shadow-inner">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">fynqAI Copilot</p>
            <p className="text-xs text-slate-500">Always on, fully aligned</p>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-xs text-slate-500">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-3">
            <p className="font-semibold text-slate-700">Live Insights</p>
            <p className="mt-1 leading-relaxed">
              Track topic mastery, detect misconceptions, and surface next best study actions in real time.
            </p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/60 p-3">
            <p className="font-semibold text-slate-700">Trust Layer</p>
            <p className="mt-1 leading-relaxed">
              Verified by NCERT, past papers, and faculty-reviewed solutions.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
