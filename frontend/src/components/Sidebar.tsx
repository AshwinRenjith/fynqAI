import { Bookmark, Clock, Compass, History, Home, Search } from 'lucide-react';

const quickPrompts = {
  tomorrow: [
    "What's something you've learned recently?",
    'If you could teleport anywhere...?',
    "What's one goal you want to achieve tomorrow?",
  ],
  lastWeek: [
    'Ask me anything weird or random.',
    'How are you feeling today, really?',
    "What's one habit you wish you kept?",
  ],
};

export function Sidebar() {
  return (
    <aside className="glass-panel-soft flex w-72 shrink-0 flex-col rounded-[32px] bg-white/70 p-6 shadow-subtle max-h-[80vh] overflow-y-auto overscroll-contain">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 via-sky-400 to-violet-500 shadow-glow" />
        <div>
          <p className="text-sm font-medium tracking-wide text-slate-500">Workspace</p>
          <p className="text-base font-semibold text-slate-900">fynqAI Copilot</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-600 placeholder:text-slate-400 focus:outline-none"
          placeholder="Search"
          type="search"
          aria-label="Search prompts"
        />
      </div>

      <nav className="mt-8 space-y-1">
        {[
          { icon: Home, label: 'Home' },
          { icon: Compass, label: 'Explore' },
          { icon: Bookmark, label: 'Library' },
          { icon: History, label: 'History' },
        ].map((item) => (
          <a
            key={item.label}
            href="#"
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tomorrow</h3>
          <ul className="mt-3 space-y-2">
            {quickPrompts.tomorrow.map((prompt) => (
              <li key={prompt} className="rounded-2xl border border-white/60 bg-white/60 p-3 text-xs text-slate-500 backdrop-blur-lg">
                {prompt}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">7 Days Ago</h3>
          <ul className="mt-3 space-y-2">
            {quickPrompts.lastWeek.map((prompt) => (
              <li key={prompt} className="rounded-2xl border border-white/60 bg-white/60 p-3 text-xs text-slate-500 backdrop-blur-lg">
                {prompt}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-auto flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 p-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Ashwin Renjith</p>
          <p className="text-xs text-slate-400">ashwin@fynq.ai</p>
        </div>
        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-500">
          <Clock className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
