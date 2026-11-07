import {
  Expand,
  Languages,
  Mic,
  Minimize,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Square,
  SkipForward,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlayerStatus } from "@/hooks/use-conversation-player";

interface Props {
  status: PlayerStatus;
  translate: boolean;
  recording: boolean;
  recordElapsed: number;
  fullscreen: boolean;
  targetLabel: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReplay: () => void;
  onTranslate: () => void;
  onRecord: () => void;
  onUpload: () => void;
  onEdit: () => void;
  onNextScene: () => void;
  onFullscreen: () => void;
}

export function ControlBar(p: Props) {
  const playing = p.status === "playing";
  return (
    <div className="rounded-2xl border border-border bg-card/90 p-3 shadow-panel backdrop-blur">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Audio target: <span className="text-foreground">{p.targetLabel}</span>
        </p>
        <Button
          variant={p.translate ? "crema" : "gold"}
          size="sm"
          className="rounded-full text-[11px] font-extrabold uppercase tracking-wider"
          onClick={p.onTranslate}
        >
          <Languages /> {p.translate ? "Hide translation" : "Translate to Spanish"}
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 [&>button]:w-full [&>button]:min-h-14 [&>button]:whitespace-normal [&>button]:text-center [&>button]:leading-tight [&>button]:px-1.5">
        {playing ? (
          <Button variant="control-primary" onClick={p.onPause} >
            <Pause className="fill-current" /> Pause
          </Button>
        ) : (
          <Button variant="control-primary" onClick={p.onPlay} >
            <Play className="fill-current" /> {p.status === "paused" ? "Resume" : "Play"}
          </Button>
        )}
        <Button variant="control" onClick={p.onStop} disabled={p.status === "idle"}>
          <Square /> Stop
        </Button>
        <Button variant="control" onClick={p.onReplay}>
          <RotateCcw /> Replay
        </Button>
        <Button variant="control" data-active={p.translate} onClick={p.onTranslate}>
          <Languages /> Translate
        </Button>
        <Button
          variant={p.recording ? "record" : "control"}
          className={p.recording ? "h-auto flex-col gap-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider [&_svg]:size-5" : ""}
          onClick={p.onRecord}
        >
          <Mic /> {p.recording ? `Stop · ${p.recordElapsed}s` : "Record audio"}
        </Button>
        <Button variant="control" onClick={p.onUpload}>
          <Upload /> Upload audio
        </Button>
        <Button variant="control" onClick={p.onEdit}>
          <Pencil /> Edit dialogue
        </Button>
        <Button variant="control" onClick={p.onNextScene}>
          <SkipForward /> Next scene
        </Button>
        <Button variant="control" onClick={p.onFullscreen}>
          {p.fullscreen ? <Minimize /> : <Expand />} {p.fullscreen ? "Exit full" : "Full screen"}
        </Button>
      </div>
    </div>
  );
}
