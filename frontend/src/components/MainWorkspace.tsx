import {
  Camera,
  ChevronDown,
  Clapperboard,
  FileText,
  ImagePlus,
  Mic,
  Plus,
  Sparkles,
} from 'lucide-react';

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

      <div className="mt-48 w-full max-w-[1180px] mx-auto">
        <div
          className="relative w-full overflow-hidden rounded-[44px] border border-white/20 bg-white/10 p-8 text-white shadow-[0_40px_120px_rgba(10,22,45,0.32)] backdrop-blur-[36px]"
          style={{
            backgroundImage:
              'linear-gradient(140deg, rgba(30,42,79,0.72), rgba(20,30,56,0.58)), radial-gradient(circle at 10% 20%, rgba(122,186,255,0.35), transparent 55%), radial-gradient(circle at 80% 0%, rgba(155,127,255,0.28), transparent 60%)',
            backgroundBlendMode: 'screen, lighten, normal',
          }}
        >
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white shadow-[0_18px_45px_rgba(14,30,54,0.35)] backdrop-blur transition hover:bg-white/30"
                aria-label="New action"
              >
                <Plus className="h-6 w-6" />
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-[999px] border border-white/30 bg-white/20 px-7 py-3 text-sm font-medium text-white/90 shadow-[0_14px_30px_rgba(18,26,46,0.25)] transition hover:bg-white/30"
                >
                  <FileText className="h-5 w-5" />
                  Analyze Docs
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-3 rounded-[999px] border border-white/20 bg-white/10 px-7 py-3 text-sm font-medium text-white/80 shadow-[0_14px_30px_rgba(18,26,46,0.2)] transition hover:bg-white/20"
                >
                  <Clapperboard className="h-5 w-5" />
                  Animate Photo
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[36px] border border-white/30 bg-white/10 px-7 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-3xl">
              <Sparkles className="h-5 w-5 text-white/70" />
              <input
                type="text"
                placeholder="Search or ask anything"
                className="flex-1 bg-transparent text-lg font-medium text-white placeholder:text-white/65 focus:outline-none"
                aria-label="Initiate a query"
              />
              <button
                type="button"
                aria-label="Record voice command"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#5d7dff] via-[#58b3ff] to-[#8c6dff] text-white shadow-[0_20px_35px_rgba(68,116,255,0.45)] transition hover:scale-105"
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white shadow-[0_12px_30px_rgba(10,24,42,0.26)] backdrop-blur transition hover:bg-white/30"
                  aria-label="Add"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white shadow-[0_12px_30px_rgba(10,24,42,0.26)] backdrop-blur transition hover:bg-white/30"
                  aria-label="Capture photo"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/20 text-white shadow-[0_12px_30px_rgba(10,24,42,0.26)] backdrop-blur transition hover:bg-white/30"
                  aria-label="Upload image"
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              </div>
              <div className="ml-auto">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-6 py-2.5 text-sm font-medium text-white shadow-[0_12px_32px_rgba(12,24,46,0.28)] backdrop-blur-2xl transition hover:bg-white/30"
                >
                  Plus
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[44px] border border-white/10" />
        </div>
      </div>
    </section>
  );
}
