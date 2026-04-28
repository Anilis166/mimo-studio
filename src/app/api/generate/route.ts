import { NextResponse } from "next/server";
import { z } from "zod";
import { getMimoClient, MIMO_MODELS } from "@/lib/mimo";
import {
  CODEGEN_SYSTEM,
  REPAIR_SYSTEM,
  VISION_SYSTEM,
} from "@/lib/prompts";
import { tryParseJson } from "@/lib/utils";
import type {
  DesignBrief,
  GeneratedApp,
  GenerateResponse,
} from "@/lib/types";
import { transform } from "esbuild";

export const runtime = "nodejs";
export const maxDuration = 300;

const RequestSchema = z.object({
  prompt: z.string().trim().max(4000).optional(),
  imageDataUrl: z
    .string()
    .startsWith("data:image/")
    .max(8 * 1024 * 1024)
    .optional(),
});

const FALLBACK_BRIEF: DesignBrief = {
  summary: "A clean, modern landing page",
  appType: "landing",
  primaryColor: "indigo",
  layout: "hero+sections",
  components: [
    { name: "Header", description: "Logo + nav" },
    { name: "Hero", description: "Headline, subhead, CTA" },
    { name: "Features", description: "Three-column features grid" },
    { name: "Footer", description: "Copyright + links" },
  ],
};

async function runVision(
  client: ReturnType<typeof getMimoClient>,
  imageDataUrl: string,
  userPrompt: string | undefined,
): Promise<DesignBrief> {
  const userText = userPrompt
    ? `Analyze this UI screenshot. Additional context from user: ${userPrompt}`
    : "Analyze this UI screenshot and produce the design brief.";
  const completion = await client.chat.completions.create({
    model: MIMO_MODELS.omni,
    messages: [
      { role: "system", content: VISION_SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    max_completion_tokens: 4096,
    temperature: 0.4,
    top_p: 0.9,
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = tryParseJson<DesignBrief>(raw);
  if (!parsed || !parsed.components) {
    return { ...FALLBACK_BRIEF, summary: raw.slice(0, 200) || FALLBACK_BRIEF.summary };
  }
  return parsed;
}

function briefFromPrompt(prompt: string): DesignBrief {
  return {
    summary: prompt,
    appType: "tool",
    primaryColor: "indigo",
    layout: "single-column",
    components: [
      { name: "Header", description: "App title + subtitle" },
      { name: "Main", description: prompt },
      { name: "Footer", description: "Built with MimoStudio" },
    ],
  };
}

async function runCodegen(
  client: ReturnType<typeof getMimoClient>,
  brief: DesignBrief,
  attempt: number,
  previous?: { app: GeneratedApp; error: string },
): Promise<GeneratedApp> {
  const messages: { role: "system" | "user"; content: string }[] = previous
    ? [
        { role: "system", content: REPAIR_SYSTEM },
        {
          role: "user",
          content: `Design brief:\n${JSON.stringify(brief)}\n\nPrevious files:\n${JSON.stringify(previous.app.files)}\n\nError:\n${previous.error}\n\nReturn the full corrected JSON.`,
        },
      ]
    : [
        { role: "system", content: CODEGEN_SYSTEM },
        {
          role: "user",
          content: `Design brief:\n${JSON.stringify(brief, null, 2)}\n\nGenerate the React app and tests as specified.`,
        },
      ];

  const completion = await client.chat.completions.create({
    model: MIMO_MODELS.pro,
    messages,
    max_completion_tokens: 16384,
    temperature: attempt === 0 ? 0.5 : 0.25,
    top_p: 0.9,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  const finish = completion.choices[0]?.finish_reason;
  const parsed = tryParseJson<GeneratedApp>(raw);
  if (!parsed || !parsed.files || !parsed.files["/App.js"]) {
    const reason =
      finish === "length"
        ? "hit token cap (output truncated mid-JSON)"
        : finish || "unparseable JSON";
    throw new Error(
      `Code generation returned invalid JSON or missing /App.js (${reason}). Raw start: ${raw.slice(0, 200)}`,
    );
  }
  return parsed;
}

async function compileCheck(
  files: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  for (const [path, source] of Object.entries(files)) {
    if (!/\.(jsx?|tsx?)$/.test(path)) continue;
    try {
      await transform(source, {
        loader: path.endsWith(".tsx")
          ? "tsx"
          : path.endsWith(".ts")
            ? "ts"
            : "jsx",
        sourcefile: path,
        target: "es2020",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: `${path}: ${msg.split("\n").slice(0, 3).join(" | ")}` };
    }
  }
  return { ok: true };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { prompt, imageDataUrl } = parsed.data;
  if (!prompt && !imageDataUrl) {
    return NextResponse.json(
      { error: "Provide either a prompt or an imageDataUrl." },
      { status: 400 },
    );
  }

  let client: ReturnType<typeof getMimoClient>;
  try {
    client = getMimoClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "MiMo client error" },
      { status: 500 },
    );
  }

  const t0 = Date.now();
  let brief: DesignBrief;
  let visionMs: number | undefined;
  let visionModel: string | undefined;

  try {
    if (imageDataUrl) {
      const ts = Date.now();
      brief = await runVision(client, imageDataUrl, prompt);
      visionMs = Date.now() - ts;
      visionModel = MIMO_MODELS.omni;
    } else {
      brief = briefFromPrompt(prompt!);
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: "Vision step failed",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 },
    );
  }

  // Code generation with up-to-3 attempts (closed-loop verification).
  // Retries cover both compile errors (with repair prompt) and JSON/parse
  // failures (re-roll with stricter settings).
  let app: GeneratedApp | null = null;
  let lastError: string | undefined;
  let repairAttempts = 0;
  const codeStart = Date.now();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const candidate = await runCodegen(
        client,
        brief,
        attempt,
        attempt > 0 && app && lastError
          ? { app, error: lastError }
          : undefined,
      );
      const check = await compileCheck(candidate.files);
      if (check.ok) {
        app = candidate;
        lastError = undefined;
        break;
      }
      app = candidate;
      lastError = check.error;
      repairAttempts++;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      repairAttempts++;
    }
  }
  const codeMs = Date.now() - codeStart;

  if (!app) {
    return NextResponse.json(
      { error: "Code generation failed", detail: lastError },
      { status: 502 },
    );
  }

  const response: GenerateResponse & { warning?: string } = {
    brief,
    app,
    models: { vision: visionModel, code: MIMO_MODELS.pro },
    timing: { visionMs, codeMs, totalMs: Date.now() - t0 },
    repairAttempts,
  };
  if (lastError) {
    response.warning = `Compile check still reported issues after retry: ${lastError}`;
  }
  return NextResponse.json(response);
}
