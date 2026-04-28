# MimoStudio

> **Sketch → working React app, in one prompt.**
> Powered by Xiaomi MiMo-V2 (Omni + Pro + TTS).

MimoStudio lets you drop a UI screenshot, a hand-drawn wireframe, or a plain text idea, and watch a polished React app appear in seconds — with auto-generated unit tests for closed-loop verification, a live in-browser sandbox preview, and an optional voice narration of what was built.

## Why

The MiMo platform exposes three complementary models:

| Model | Job in MimoStudio |
|---|---|
| `mimo-v2-omni` | Vision — reads the uploaded screenshot/sketch and produces a structured design brief (components, copy, layout, interactions). |
| `mimo-v2-pro` | Codegen — turns the brief into a self-contained React app, plus a Vitest test file. Closed-loop: if the output fails an esbuild parse check, MimoStudio retries with a repair prompt. |
| `mimo-v2-tts` | Narrate — reads back what was just built, useful for accessibility and demo videos. |

A single prompt pipeline that exercises three model classes — exactly the kind of multi-model agent workflow MiMo is designed for.

## How it works

```
       ┌──────────┐    ┌──────────────┐    ┌────────────┐
image  │  /api/   │    │ MiMo-V2-Omni │    │  design    │
─────▶ │ generate │───▶│   (vision)   │───▶│   brief    │─┐
prompt │          │    └──────────────┘    └────────────┘ │
       │          │                                       ▼
       │          │    ┌──────────────┐    ┌────────────┐
       │          │───▶│  MiMo-V2-Pro │───▶│  /App.js   │
       │          │    │   (codegen)  │    │  /styles…  │
       │          │    └──────────────┘    │  /App.test │
       │          │            ▲           └────────────┘
       │          │            │ esbuild parse fails?
       │          │            └────────── repair retry
       └──────────┘                    (closed-loop verify)
              │
              ▼
     Sandpack live preview + test runner
              │
              ▼
       ┌──────────────┐
       │ MiMo-V2-TTS  │  "Narrate" button
       └──────────────┘
```

## Run locally

```bash
pnpm install
cp .env.example .env.local        # paste your MIMO_API_KEY
pnpm dev                          # http://localhost:3000
```

Get a key at <https://platform.xiaomimimo.com>.

## Project layout

```
src/
  app/
    page.tsx              # main UI (server component)
    layout.tsx            # global shell, dark theme
    globals.css           # tailwind + radial glow background
    api/
      generate/route.ts   # POST  image|prompt → brief → code (with repair retry)
      narrate/route.ts    # POST  text → audio/mpeg via MiMo TTS
  components/
    Header.tsx            # top bar
    DropZone.tsx          # image upload (data-URL, max 6MB)
    Examples.tsx          # one-click prompt examples
    PreviewPane.tsx       # Sandpack sandbox preview
    StudioApp.tsx         # main client component, wires it all together
  lib/
    mimo.ts               # OpenAI SDK pointed at MiMo base URL
    prompts.ts            # vision / codegen / repair system prompts
    types.ts              # shared types
    utils.ts              # cn() + tolerant JSON parser
```

## Closed-loop verification

The codegen route requires the model to return a JSON object with `/App.js`, `/styles.css`, and `/App.test.js`. Each generated source file is parsed server-side with `esbuild`. If parsing fails, MimoStudio re-prompts MiMo-V2-Pro with the previous output and the error, and asks for a minimal fix. This mirrors the pattern in the MiMo Orbit submission example: *"auto-runs unit tests for closed-loop verification."*

The generated `/App.test.js` uses `@testing-library/react` and runs inside the Sandpack sandbox in your browser — open the **Tests** tab in the preview to execute them.

## Design notes

- **No client-side API key**. The MiMo key only ever lives in the server's environment.
- **Self-contained generated apps**. Code is constrained to plain React + a single `/styles.css`; no Tailwind or external deps that would break the sandbox.
- **Tolerant JSON parsing**. The model occasionally wraps its output in ```` ``` ```` fences; we strip them gracefully.
- **Graceful TTS degradation**. If the TTS endpoint returns 5xx, the UI surfaces an error toast but the rest of the app keeps working.

## Deploy

Any Node host that supports Next.js 16 works. The app uses the App Router and one server-only dependency (`esbuild`), declared in `next.config.ts` via `serverExternalPackages`.

## License

MIT — © 2026 Ani Listiani
