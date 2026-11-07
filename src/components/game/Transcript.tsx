import { Mic, Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHARACTERS, type DialogueLine } from "@/lib/game/types";

interface Props {
  lines: DialogueLine[];
  currentIndex: number;
  playing: boolean;
  selectedIndex: number;
  translate: boolean;
  clipIds: Set<string>;
  onSelect: (i: number) => void;
  onPlayFrom: (i: number) => void;
}

export function Transcript(p: Props) {
  if (!p.lines.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        This activity has no dialogue yet. Use <b>Edit dialogue</b> to add lines.
      </p>
    );
  }
  return (
    <ol className="space-y-2.5">
      {p.lines.map((l, i) => {
        const isMale = l.speaker === "male";
        const now = p.playing && i === p.currentIndex;
        const selected = i === p.selectedIndex;
        const hasClip = p.clipIds.has(l.id);
        return (
          <li key={l.id} className={cn("flex", isMale ? "justify-start" : "justify-end")}>
            <div
              onClick={() => p.onSelect(i)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "group relative w-[88%] cursor-pointer rounded-2xl border px-3.5 py-2.5 text-left transition-all",
                isMale ? "rounded-tl-sm" : "rounded-tr-sm",
                now
                  ? "border-gold bg-bubble text-bubble-foreground shadow-gold"
                  : selected
                    ? "border-primary/70 bg-accent"
                    : "border-border bg-secondary/60 hover:bg-accent",
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className={cn("size-2 rounded-full", isMale ? "bg-male" : "bg-female")} />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-80">
                  {i + 1}. {CHARACTERS[l.speaker].name}
                </span>
                <span
                  className={cn(
                    "ml-auto flex items-center gap-1 text-[10px] font-semibold opacity-70",
                    hasClip && "text-record opacity-100",
                  )}
                  title={hasClip ? "Recorded audio" : "Automatic English voice"}
                >
                  {hasClip ? <Mic className="size-3" /> : <Volume2 className="size-3" />}
                  {hasClip ? "Recorded" : "Auto"}
                </span>
                <button
                  type="button"
                  aria-label={`Play from line ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    p.onPlayFrom(i);
                  }}
                  className="grid size-6 place-items-center rounded-full bg-gold text-primary-foreground opacity-80 transition hover:opacity-100"
                >
                  <Play className="size-3 fill-current" />
                </button>
              </div>
              <p className="text-sm font-semibold leading-snug">{l.en}</p>
              {p.translate && l.es && (
                <p
                  className={cn(
                    "mt-1 text-[13px] italic leading-snug",
                    now ? "text-bubble-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {l.es}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
