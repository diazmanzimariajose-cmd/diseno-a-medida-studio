import type { Conversation, DialogueLine, SceneId, Speaker } from "./types";
import { SCENE_ORDER } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const other = (s: Speaker): Speaker => (s === "male" ? "female" : "male");

/** New lines alternate speakers: the next speaker is the opposite of the last one. */
export function nextSpeaker(conv: Pick<Conversation, "lines" | "starter">): Speaker {
  const last = conv.lines.at(-1);
  return last ? other(last.speaker) : conv.starter;
}

export function addLine(conv: Conversation): Conversation {
  const line: DialogueLine = { id: uid(), speaker: nextSpeaker(conv), en: "", es: "" };
  return { ...conv, lines: [...conv.lines, line] };
}

/** Changing who starts flips every line's speaker so the first line belongs to the new starter. */
export function setStarter(conv: Conversation, starter: Speaker): Conversation {
  if (conv.starter === starter) return conv;
  const first = conv.lines[0];
  const needsFlip = first ? first.speaker !== starter : false;
  return {
    ...conv,
    starter,
    lines: needsFlip ? conv.lines.map((l) => ({ ...l, speaker: other(l.speaker) })) : conv.lines,
  };
}

export function moveLine(conv: Conversation, index: number, dir: -1 | 1): Conversation {
  const target = index + dir;
  if (target < 0 || target >= conv.lines.length) return conv;
  const lines = [...conv.lines];
  const [moved] = lines.splice(index, 1);
  if (moved) lines.splice(target, 0, moved);
  return { ...conv, lines };
}

export function removeLine(conv: Conversation, lineId: string): Conversation {
  return { ...conv, lines: conv.lines.filter((l) => l.id !== lineId) };
}

export function updateLine(
  conv: Conversation,
  lineId: string,
  patch: Partial<Omit<DialogueLine, "id">>,
): Conversation {
  return { ...conv, lines: conv.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l)) };
}

export function blankConversation(): Conversation {
  const starter: Speaker = "male";
  return {
    id: uid(),
    title: "New activity",
    topic: "Custom situation",
    scene: "cafe",
    starter,
    lines: [
      { id: uid(), speaker: "male", en: "", es: "" },
      { id: uid(), speaker: "female", en: "", es: "" },
    ],
    updatedAt: Date.now(),
  };
}

export function nextScene(scene: SceneId): SceneId {
  const i = SCENE_ORDER.indexOf(scene);
  return SCENE_ORDER[(i + 1) % SCENE_ORDER.length] ?? "cafe";
}

/** Lines that actually get played, in their saved order (empty lines are skipped). */
export function playableLines(conv: Conversation): DialogueLine[] {
  return conv.lines.filter((l) => l.en.trim().length > 0);
}

/** Overall progress 0..1 given the current line index and how far into that line we are. */
export function conversationProgress(total: number, index: number, lineFraction: number): number {
  if (total <= 0) return 0;
  const f = Math.min(Math.max(lineFraction, 0), 1);
  return Math.min((index + f) / total, 1);
}
