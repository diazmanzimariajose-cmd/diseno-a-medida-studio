import { Mic, Play, Volume2 } from "lucide-react";
import maleIdle from "@/assets/barista-male.webp";
import maleTalk from "@/assets/barista-male-talk.webp";
import femaleIdle from "@/assets/barista-female.webp";
import femaleTalk from "@/assets/barista-female-talk.webp";
import sceneCafe from "@/assets/scene-cafe.webp";
import sceneBar from "@/assets/scene-bar.webp";
import { cn } from "@/lib/utils";
import {
  CHARACTERS,
  SCENES,
  type DialogueLine,
  type SceneId,
  type Speaker,
} from "@/lib/game/types";
import type { PlayerStatus } from "@/hooks/use-conversation-player";
import { Button } from "@/components/ui/button";

const FRAMES: Record<Speaker, { idle: string; talk: string }> = {
  male: { idle: maleIdle, talk: maleTalk },
  female: { idle: femaleIdle, talk: femaleTalk },
};
const SCENE_IMG: Record<SceneId, string> = { cafe: sceneCafe, bar: sceneBar };

interface StageProps {
  scene: SceneId;
  status: PlayerStatus;
  speaking: Speaker | null;
  line: DialogueLine | null;
  lineNumber: number;
  total: number;
  progress: number;
  translate: boolean;
  source: "clip" | "tts" | null;
  fullscreen: boolean;
  registerMouth: (s: Speaker, el: HTMLElement | null) => void;
  onPlay: () => void;
}

export function Stage(p: StageProps) {
  const active = p.status !== "idle";
  const bubbleSpeaker = p.line?.speaker ?? null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-espresso",
        p.fullscreen ? "flex-1" : "aspect-[4/3] rounded-2xl sm:aspect-[16/9]",
      )}
    >
      {(Object.keys(SCENE_IMG) as SceneId[]).map((id) => (
        <img
          key={id}
          src={SCENE_IMG[id]}
          alt={SCENES[id].name}
          width={1792}
          height={1008}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out",
            p.scene === id ? "scale-100 opacity-100" : "scale-105 opacity-0",
          )}
        />
      ))}
      <div className="stage-floor absolute inset-0" />

      {/* Scene label */}
      <div className="absolute left-3 top-3 z-20 rounded-full border border-border/60 bg-espresso/70 px-3 py-1 backdrop-blur-md sm:left-4 sm:top-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
          {SCENES[p.scene].subtitle}
        </p>
        <p className="font-display text-xs text-foreground sm:text-sm">{SCENES[p.scene].name}</p>
      </div>

      {active && p.source && (
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-espresso/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground backdrop-blur-md sm:right-4 sm:top-4">
          {p.source === "clip" ? (
            <Mic className="size-3 text-record" />
          ) : (
            <Volume2 className="size-3 text-gold" />
          )}
          {p.source === "clip" ? "Recorded voice" : "Auto voice"}
        </div>
      )}

      <Character
        side="left"
        speaker="male"
        speaking={p.speaking}
        active={active}
        register={p.registerMouth}
      />
      <Character
        side="right"
        speaker="female"
        speaking={p.speaking}
        active={active}
        register={p.registerMouth}
      />

      {/* Speech bubble */}
      {active && p.line && bubbleSpeaker && (
        <div
          key={p.line.id}
          className={cn(
            "animate-bubble absolute z-30 top-[16%] w-[52%] sm:top-[12%] sm:w-[40%]",
            bubbleSpeaker === "male" ? "left-[24%] sm:left-[27%]" : "right-[24%] sm:right-[27%]",
          )}
        >
          <div className="relative rounded-2xl bg-bubble px-3 py-2 text-bubble-foreground shadow-bubble sm:px-5 sm:py-3.5">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span
                className={cn(
                  "text-[9px] font-extrabold uppercase tracking-[0.18em] sm:text-[10px]",
                  bubbleSpeaker === "male" ? "text-wood" : "text-destructive",
                )}
              >
                {CHARACTERS[bubbleSpeaker].name}
              </span>
              <span className="text-[9px] font-bold text-bubble-foreground/50 sm:text-[10px]">
                {p.lineNumber}/{p.total}
              </span>
            </div>
            <p className="text-xs font-semibold leading-snug sm:text-base lg:text-lg">
              {p.line.en}
            </p>
            {p.translate && p.line.es && (
              <p className="mt-1 border-t border-bubble-foreground/15 pt-1 text-[11px] italic leading-snug text-bubble-foreground/70 sm:text-sm">
                {p.line.es}
              </p>
            )}
            <span
              className={cn(
                "absolute -bottom-2 size-4 rotate-45 bg-bubble",
                bubbleSpeaker === "male" ? "left-6" : "right-6",
              )}
            />
          </div>
        </div>
      )}

      {!active && (
        <div className="absolute inset-x-0 top-[38%] z-30 flex justify-center">
          <Button variant="gold" size="lg" className="rounded-full px-6" onClick={p.onPlay}>
            <Play className="fill-current" /> Play conversation
          </Button>
        </div>
      )}

      {/* Progress */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-1.5 bg-espresso/60">
        <div
          className="h-full bg-gold transition-[width] duration-150 ease-linear"
          style={{ width: `${Math.round(p.progress * 1000) / 10}%` }}
        />
      </div>
    </div>
  );
}

function Character({
  side,
  speaker,
  speaking,
  active,
  register,
}: {
  side: "left" | "right";
  speaker: Speaker;
  speaking: Speaker | null;
  active: boolean;
  register: (s: Speaker, el: HTMLElement | null) => void;
}) {
  const state = speaking === speaker ? "speaking" : active && speaking ? "listening" : "idle";
  const f = FRAMES[speaker];
  return (
    <div
      ref={(el) => register(speaker, el)}
      className={cn(
        "character absolute bottom-0 z-10 h-[86%] w-[40%] sm:h-[90%] sm:w-[34%]",
        side === "left" ? "left-[-2%] sm:left-[3%]" : "right-[-2%] sm:right-[3%]",
      )}
      data-side={side}
      data-state={state}
      data-mouth="closed"
    >
      <div className="character-body relative h-full w-full">
        <img
          src={f.idle}
          alt={`${CHARACTERS[speaker].name}, barista`}
          className="character-frame"
          draggable={false}
        />
        <img
          src={f.talk}
          alt=""
          aria-hidden
          className="character-frame"
          data-frame="talk"
          draggable={false}
        />
      </div>
      <div
        className={cn(
          "absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 backdrop-blur-md transition-colors sm:bottom-6",
          state === "speaking"
            ? "border-gold bg-gold text-primary-foreground"
            : "border-border/60 bg-espresso/75 text-foreground",
        )}
      >
        <span className={cn("size-2 rounded-full", speaker === "male" ? "bg-male" : "bg-female")} />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] sm:text-xs">
          {CHARACTERS[speaker].name}
        </span>
        {state === "speaking" && <Equalizer />}
        {state === "listening" && (
          <span className="hidden text-[10px] font-semibold opacity-70 sm:inline">listening</span>
        )}
      </div>
    </div>
  );
}

function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] animate-pulse rounded-full bg-primary-foreground"
          style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}
