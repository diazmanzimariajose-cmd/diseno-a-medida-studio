import type { Speaker } from "./types";

const FEMALE_HINTS = [
  "female",
  "samantha",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "fiona",
  "zira",
  "aria",
  "jenny",
  "susan",
  "hazel",
  "libby",
  "sonia",
  "michelle",
  "ava",
  "allison",
  "serena",
  "kate",
  "emma",
  "joanna",
];
const MALE_HINTS = [
  "male",
  "daniel",
  "alex",
  "fred",
  "david",
  "mark",
  "guy",
  "ryan",
  "george",
  "tom",
  "aaron",
  "arthur",
  "oliver",
  "james",
  "matthew",
  "brian",
  "eric",
  "christopher",
];

function genderOf(name: string): Speaker | null {
  const n = name.toLowerCase();
  if (FEMALE_HINTS.some((h) => n.includes(h))) return "female";
  if (MALE_HINTS.some((h) => n.includes(h))) return "male";
  return null;
}

function score(v: SpeechSynthesisVoice, speaker: Speaker) {
  const n = v.name.toLowerCase();
  let s = 0;
  if (/^en[-_]us/i.test(v.lang)) s += 3;
  else if (/^en/i.test(v.lang)) s += 2;
  const g = genderOf(v.name);
  if (g === speaker) s += 6;
  else if (g) s -= 6;
  if (n.includes("natural") || n.includes("neural") || n.includes("online")) s += 1;
  return s;
}

export function pickVoice(speaker: Speaker): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  if (!voices.length) return null;
  return [...voices].sort((a, b) => score(b, speaker) - score(a, speaker))[0] ?? null;
}

/** Pitch nudges keep the two baristas sounding different even when the device has one voice. */
export const VOICE_PITCH: Record<Speaker, number> = { male: 0.82, female: 1.18 };
export const VOICE_RATE = 0.92;
