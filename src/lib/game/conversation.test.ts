import { describe, expect, it } from "vitest";
import {
  addLine,
  conversationProgress,
  nextScene,
  playableLines,
  setStarter,
} from "./conversation";
import type { Conversation } from "./types";

const base: Conversation = {
  id: "c",
  title: "T",
  topic: "t",
  scene: "cafe",
  starter: "male",
  updatedAt: 0,
  lines: [
    { id: "1", speaker: "male", en: "Hello", es: "Hola" },
    { id: "2", speaker: "female", en: "Hi", es: "Hola" },
    { id: "3", speaker: "male", en: "", es: "" },
  ],
};

describe("conversation rules", () => {
  it("new lines alternate speaker after the last one", () => {
    expect(addLine(base).lines.at(-1)?.speaker).toBe("female");
  });

  it("changing who starts makes the first line belong to the new starter", () => {
    const c = setStarter(base, "female");
    expect(c.lines.map((l) => l.speaker)).toEqual(["female", "male", "female"]);
  });

  it("playback keeps the saved order and skips empty lines", () => {
    expect(playableLines(base).map((l) => l.id)).toEqual(["1", "2"]);
  });

  it("next scene cycles between the café and the bar", () => {
    expect(nextScene("cafe")).toBe("bar");
    expect(nextScene("bar")).toBe("cafe");
  });

  it("progress counts finished lines plus the current fraction", () => {
    expect(conversationProgress(4, 1, 0.5)).toBe(0.375);
    expect(conversationProgress(4, 3, 1)).toBe(1);
  });
});
