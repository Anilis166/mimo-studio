import { Sparkles } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.55C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5Z" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="border-b border-white/10 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-violet-500/20">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-zinc-50">MimoStudio</div>
            <div className="text-[11px] text-zinc-400">
              Sketch → Working app · Powered by Xiaomi MiMo
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://platform.xiaomimimo.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-200 hidden sm:inline"
          >
            Get a MiMo API key →
          </a>
          <a
            href="https://github.com/Anilis166/mimo-studio"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 hover:text-zinc-50 transition"
            aria-label="GitHub"
          >
            <GithubIcon className="size-5" />
          </a>
        </div>
      </div>
    </header>
  );
}
