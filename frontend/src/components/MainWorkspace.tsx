import { Mic, Sparkles } from 'lucide-react';

const assistantModes = [
  { label: 'Reasoning', active: false },
  { label: 'Create Image', active: false },
  { label: 'Deep Research', active: false },
];

export function MainWorkspace() {
  return (
    <section className="flex-1">
      <div className="flex flex-col items-center text-center">
        <div className="liquid-orb mb-6 h-32 w-32 rounded-full" />
        <p className="text-2xl font-semibold text-slate-700">
          Good Morning, Ashwin
          <br />
          <span className="text-transparent bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text">How Can I Assist You Today?</span>
        </p>
      </div>

  <div className="mt-44 w-full max-w-5xl mx-auto">
        <div className="glass-panel-soft rounded-[32px] p-6 shadow-glow">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <input
              type="text"
              placeholder="Initiate a query or send a command to the AI..."
              className="flex-1 bg-transparent text-base text-slate-600 placeholder:text-slate-400 focus:outline-none"
              aria-label="Initiate a query"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              {assistantModes.map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  className="rounded-2xl border border-white/50 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 backdrop-blur-xl transition-all hover:border-white/70 hover:text-slate-700"
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Record voice command"
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-blue-400 to-violet-500 text-white shadow-glow transition-transform hover:-translate-y-0.5"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
