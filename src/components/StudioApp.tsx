"use client";
import { useCallback, useState } from "react";
import {
  Loader2,
  Sparkles,
  Volume2,
  StopCircle,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { Examples } from "@/components/Examples";
import { PreviewPane } from "@/components/PreviewPane";
import type { GenerateResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ApiError {
  error: string;
  detail?: string;
}

export function StudioApp() {
  const [prompt, setPrompt] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = useCallback(async () => {
    if (loading) return;
    if (!prompt.trim() && !imageDataUrl) {
      setError("Type a prompt or upload an image to start.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim() || undefined,
          imageDataUrl: imageDataUrl || undefined,
        }),
      });
      const data = (await res.json()) as GenerateResponse | ApiError;
      if (!res.ok) {
        const err = data as ApiError;
        setError(err.detail ? `${err.error}: ${err.detail}` : err.error);
        return;
      }
      setResult(data as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [prompt, imageDataUrl, loading]);

  const narrate = useCallback(async () => {
    if (!result) return;
    if (audioEl) {
      audioEl.pause();
      setAudioEl(null);
      return;
    }
    setAudioBusy(true);
    try {
      const text = `${result.app.name}. ${result.app.description}. ${result.brief.summary}`;
      const res = await fetch("/api/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as ApiError | null;
        setError(err?.detail || err?.error || "TTS failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        setAudioEl(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
      setAudioEl(audio);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAudioBusy(false);
    }
  }, [result, audioEl]);

  const downloadZip = useCallback(async () => {
    if (!result) return;
    // Build a simple zip-less download: serialize to a single JSON for now.
    const text = JSON.stringify(
      { name: result.app.name, files: result.app.files },
      null,
      2,
    );
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.app.name || "mimo-app"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const copyAppJs = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.app.files["/App.js"] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [result]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <section className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-50">
          From sketch to working app
          <span className="block text-zinc-400 text-base font-normal mt-1">
            Drop a screenshot or describe an idea. MiMo-V2-Omni reads, MiMo-V2-Pro
            builds — with auto-generated tests for closed-loop verification.
          </span>
        </h1>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <DropZone
            value={imageDataUrl}
            onChange={setImageDataUrl}
            disabled={loading}
          />
          <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder="Describe the app you want to build…"
              className="w-full h-32 bg-transparent resize-none text-sm text-zinc-100 placeholder-zinc-500 outline-none"
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-zinc-500">
                {prompt.length}/4000
              </div>
              <button
                onClick={submit}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400",
                  "text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {imageDataUrl ? "Reading & building…" : "Building…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
          <Examples onPick={setPrompt} disabled={loading} />

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/40 p-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-zinc-400 text-xs uppercase tracking-wide">
                    Design brief
                  </div>
                  <div className="text-zinc-100 font-medium mt-0.5">
                    {result.app.name}
                  </div>
                  <div className="text-zinc-300 mt-1">
                    {result.brief.summary}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={narrate}
                    disabled={audioBusy}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
                  >
                    {audioBusy ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : audioEl ? (
                      <StopCircle className="size-3.5" />
                    ) : (
                      <Volume2 className="size-3.5" />
                    )}
                    {audioEl ? "Stop" : "Narrate"}
                  </button>
                  <button
                    onClick={copyAppJs}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    Copy App.js
                  </button>
                  <button
                    onClick={downloadZip}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
                  >
                    <Download className="size-3.5" />
                    Export
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {result.brief.components.slice(0, 8).map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-zinc-950/60 px-2.5 py-0.5 text-zinc-300"
                    title={c.description}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
              <div className="text-xs text-zinc-500 pt-1 flex flex-wrap gap-x-4 gap-y-1">
                {result.models.vision && (
                  <span>vision: {result.models.vision}</span>
                )}
                <span>code: {result.models.code}</span>
                <span>total: {result.timing.totalMs} ms</span>
                {result.timing.visionMs && (
                  <span>vision: {result.timing.visionMs} ms</span>
                )}
                <span>codegen: {result.timing.codeMs} ms</span>
              </div>
            </div>
          )}
        </div>

        <div>
          {result ? (
            <PreviewPane files={result.app.files} />
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/20 h-[540px] grid place-items-center text-center px-6">
              <div>
                <div className="size-10 rounded-full bg-zinc-800 mx-auto mb-3 grid place-items-center">
                  <Sparkles className="size-5 text-zinc-300" />
                </div>
                <div className="text-zinc-200 font-medium">
                  Live preview appears here
                </div>
                <div className="text-xs text-zinc-500 mt-1 max-w-xs">
                  Generated React app runs in a sandbox with auto-generated
                  tests you can run in one click.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
