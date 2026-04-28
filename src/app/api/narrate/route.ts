import { NextResponse } from "next/server";
import { z } from "zod";
import { getMimoClient, MIMO_MODELS } from "@/lib/mimo";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  voice: z.string().trim().max(64).optional(),
});

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
  const { text, voice } = parsed.data;

  let client: ReturnType<typeof getMimoClient>;
  try {
    client = getMimoClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "MiMo client error" },
      { status: 500 },
    );
  }

  // Best effort: try OpenAI-compatible audio.speech endpoint with the MiMo TTS model.
  // If unsupported, fall back to a text-only summary so the UI can degrade gracefully.
  try {
    const speech = await client.audio.speech.create({
      model: MIMO_MODELS.tts,
      voice: voice ?? "default",
      input: text,
    });
    const arrayBuffer = await speech.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "TTS unavailable",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }
}
