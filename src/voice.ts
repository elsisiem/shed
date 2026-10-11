import { env } from "./env.ts";

const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb";

export async function speak(text: string): Promise<Buffer | null> {
  if (!env.elevenKey) return null;
  const voice = env.elevenVoice || DEFAULT_VOICE;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": env.elevenKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
      }),
    },
  );
  if (!res.ok) return null;
  return Buffer.from(await res.arrayBuffer());
}

export function moltLine(dropped: number, savedPct: number): string {
  if (dropped === 0) return "Nothing to shed. I am already cut.";
  return `I shed ${dropped} organs. Context tax down ${savedPct} percent. Same triage. Cheaper coat.`;
}
