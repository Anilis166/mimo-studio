"use client";
import { Lightbulb } from "lucide-react";

const EXAMPLES = [
  "A pricing page with three tiers (Free, Pro, Team), a toggle for monthly/yearly, and a featured 'Pro' plan with a glow border.",
  "A pomodoro timer app with start/pause/reset, three preset durations (25/15/5 min), and a circular progress ring that fills as time elapses.",
  "A minimalist habit tracker — list of habits, daily checkboxes for the last 7 days, and a streak counter per habit.",
  "A photo-card gallery with hover zoom, lightbox-style modal on click, and a search bar that filters by caption.",
];

interface ExamplesProps {
  onPick: (text: string) => void;
  disabled?: boolean;
}

export function Examples({ onPick, disabled }: ExamplesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mr-1">
        <Lightbulb className="size-3.5" />
        Try:
      </div>
      {EXAMPLES.map((ex, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onPick(ex)}
          className="text-xs rounded-full border border-white/10 bg-zinc-900 hover:bg-zinc-800 hover:border-white/20 text-zinc-300 px-3 py-1.5 transition disabled:opacity-40"
        >
          {ex.split(" ").slice(0, 5).join(" ")}…
        </button>
      ))}
    </div>
  );
}
