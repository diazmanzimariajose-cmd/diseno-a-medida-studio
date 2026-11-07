import type { Speaker } from "./types";

const FEMALE_HINTS = [
  "female", "samantha", "victoria", "karen", "moira", "tessa", "fiona", "zira", "aria", "jenny",
  "susan", "hazel", "libby", "sonia", "michelle", "ava", "allison", "serena", "kate", "emma", "joanna",
];
const MALE_HINTS = [
  "male", "daniel", "alex", "fred", "david", "mark", "guy", "ryan", "george", "tom", "aaron",
  "arthur", "oliver", "james", "matthew", "brian", "eric", "christopher",
];

function score(v: SpeechSynthesisVoice, hints: string[], avoid: string[]) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/^en[-_]us/i.test(v.lang)) s += 3;
  else if (/^en/i.test(v.lang)) s += 2;
  if (hints.some((h) => n.includes(h))) s += 5;
  if (avoid.some((h) => n.includes(h)) && !(hints === MALE_HINTS && n.includes("female") === false && n.includes("male"))) s -= 4;
  if (n.includes("natural") || n.includes("neural") || n.includes("online")) s += 1;
  return s;
}

export function pickVoice(speaker: Speaker): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!voices.length) return null;
  const hints = speaker === "female" ? FEMALE_HINTS : MALE_HINTS;
  const avoid = speaker === "female" ? MALE_HINTS : FEMALE_HINTS;
  return [...voices].sort((a, b) => score(b, hints, avoid) - score(a, hints, avoid))[0] ?? null;
}

/** Pitch nudges keep the two baristas sounding different even when the device has one voice. */
export const VOICE_PITCH: Record<Speaker, number> = { male: 0.82, female: 1.18 };
export const VOICE_RATE = 0.92;
