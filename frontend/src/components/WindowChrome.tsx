const navItems = [
  { label: 'Process', active: true },
  { label: 'Features', active: false },
  { label: 'Benefits', active: false },
];

export function WindowChrome() {
  return (
    <header className="relative mb-12 flex items-center justify-center px-4">

      <nav className="flex items-center justify-center">
        <div className="flex items-center gap-8 rounded-full bg-black/95 px-10 py-4 text-base font-medium text-white/60 shadow-[0_28px_80px_rgba(10,10,25,0.4)]">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`relative transition-colors ${
                item.active ? 'text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              {item.label}
              {item.active && (
                <span className="absolute left-1/2 top-[110%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <button
        type="button"
        aria-label="Open profile"
        className="absolute right-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full shadow-[0_24px_60px_rgba(24,32,57,0.28)]"
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),rgba(22,22,22,0.95))]" />
        <span className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
          <span
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=facearea&w=120&h=120&q=80')" }}
          />
        </span>
      </button>
    </header>
  );
}
