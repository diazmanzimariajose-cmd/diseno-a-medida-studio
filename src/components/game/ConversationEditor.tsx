import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Mic, Play, Plus, Save, Square, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CHARACTERS, SCENES, type Conversation, type SceneId, type Speaker } from "@/lib/game/types";
import { addLine, moveLine, other, removeLine, setStarter, updateLine } from "@/lib/game/conversation";
import { getClip } from "@/lib/game/storage";
import { useRecorder } from "@/hooks/use-recorder";

interface Props {
  open: boolean;
  conversation: Conversation | null;
  clipIds: Set<string>;
  canDelete: boolean;
  onClose: () => void;
  onSave: (c: Conversation) => void;
  onDelete: (id: string) => void;
  onClipChange: (lineId: string, blob: Blob | null) => Promise<void>;
}

export function ConversationEditor(p: Props) {
  const [draft, setDraft] = useState<Conversation | null>(p.conversation);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const recorder = useRecorder();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadFor = useRef<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (p.open) setDraft(p.conversation ? structuredClone(p.conversation) : null);
  }, [p.open, p.conversation]);

  if (!draft) return null;

  const set = (c: Conversation) => setDraft(c);

  const toggleRecord = async (lineId: string) => {
    if (recordingId) {
      recorder.stop();
      return;
    }
    try {
      setRecordingId(lineId);
      const blob = await recorder.start();
      if (blob) {
        await p.onClipChange(lineId, blob);
        toast.success("Audio saved for this line");
      }
    } catch (e) {
      toast.error(micError(e));
    } finally {
      setRecordingId(null);
    }
  };

  const preview = async (lineId: string) => {
    const blob = await getClip(lineId);
    if (!blob) return;
    previewRef.current?.pause();
    const a = new Audio(URL.createObjectURL(blob));
    previewRef.current = a;
    a.play();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadFor.current;
    e.target.value = "";
    if (!file || !id) return;
    if (!file.type.startsWith("audio/")) return toast.error("Please choose an audio file");
    await p.onClipChange(id, file);
    toast.success("Audio uploaded");
  };

  const save = () => {
    if (!draft.title.trim()) return toast.error("Give the activity a title");
    p.onSave({ ...draft, updatedAt: Date.now() });
  };

  return (
    <Dialog open={p.open} onOpenChange={(o) => !o && p.onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-border bg-card p-0">
        <DialogHeader className="sticky top-0 z-10 border-b border-border bg-header px-6 py-4">
          <DialogTitle className="font-display text-2xl">Edit dialogue</DialogTitle>
          <DialogDescription>
            Write the English lines, add the Spanish translation and record or upload a voice for each one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Activity title</Label>
              <Input id="title" value={draft.title} onChange={(e) => set({ ...draft, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topic">Situation</Label>
              <Input id="topic" value={draft.topic} onChange={(e) => set({ ...draft, topic: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Who starts the conversation</Label>
              <Segmented
                value={draft.starter}
                options={[
                  { value: "male", label: CHARACTERS.male.name },
                  { value: "female", label: CHARACTERS.female.name },
                ]}
                onChange={(v) => set(setStarter(draft, v as Speaker))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scene</Label>
              <Segmented
                value={draft.scene}
                options={(Object.keys(SCENES) as SceneId[]).map((s) => ({ value: s, label: SCENES[s].name }))}
                onChange={(v) => set({ ...draft, scene: v as SceneId })}
              />
            </div>
          </div>

          <div className="space-y-3">
            {draft.lines.map((l, i) => {
              const hasClip = p.clipIds.has(l.id);
              const isRec = recordingId === l.id;
              return (
                <div
                  key={l.id}
                  className={cn(
                    "rounded-xl border bg-secondary/40 p-3",
                    l.speaker === "male" ? "border-l-4 border-l-male" : "border-l-4 border-l-female",
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-muted-foreground">#{i + 1}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 rounded-full text-xs"
                      onClick={() => set(updateLine(draft, l.id, { speaker: other(l.speaker) }))}
                      title="Switch speaker"
                    >
                      <span className={cn("size-2 rounded-full", l.speaker === "male" ? "bg-male" : "bg-female")} />
                      {CHARACTERS[l.speaker].name}
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={isRec ? "record" : "secondary"}
                        className="h-7 text-xs"
                        disabled={!!recordingId && !isRec}
                        onClick={() => toggleRecord(l.id)}
                      >
                        {isRec ? <Square /> : <Mic />} {isRec ? `Stop ${recorder.elapsed}s` : hasClip ? "Re-record" : "Record"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        onClick={() => {
                          uploadFor.current = l.id;
                          fileRef.current?.click();
                        }}
                      >
                        <Upload /> Upload
                      </Button>
                      {hasClip && (
                        <>
                          <Button size="icon" variant="secondary" className="size-7" aria-label="Listen" onClick={() => preview(l.id)}>
                            <Play />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="size-7"
                            aria-label="Remove audio"
                            onClick={() => p.onClipChange(l.id, null)}
                          >
                            <X />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="size-7" aria-label="Move up" onClick={() => set(moveLine(draft, i, -1))}>
                        <ArrowUp />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7" aria-label="Move down" onClick={() => set(moveLine(draft, i, 1))}>
                        <ArrowDown />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive"
                        aria-label="Delete line"
                        onClick={() => set(removeLine(draft, l.id))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Textarea
                      rows={2}
                      placeholder="English dialogue…"
                      value={l.en}
                      onChange={(e) => set(updateLine(draft, l.id, { en: e.target.value }))}
                    />
                    <Textarea
                      rows={2}
                      placeholder="Traducción al español…"
                      className="italic"
                      value={l.es}
                      onChange={(e) => set(updateLine(draft, l.id, { es: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
            <Button variant="outline" className="w-full border-dashed" onClick={() => set(addLine(draft))}>
              <Plus /> Add line
            </Button>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 flex-row items-center gap-2 border-t border-border bg-card px-6 py-4 sm:justify-between">
          {p.canDelete ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (window.confirm(`Delete "${draft.title}"?`)) p.onDelete(draft.id);
              }}
            >
              <Trash2 /> Delete activity
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={p.onClose}>
              Cancel
            </Button>
            <Button variant="gold" onClick={save}>
              <Save /> Save changes
            </Button>
          </div>
        </DialogFooter>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFile} />
      </DialogContent>
    </Dialog>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-secondary/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 truncate rounded-md px-2 py-1.5 text-xs font-bold transition-colors",
            value === o.value ? "bg-gold text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function micError(e: unknown) {
  if (e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError")) {
    return "Microphone access was blocked. Allow it in your browser to record.";
  }
  if (e instanceof DOMException && e.name === "NotFoundError") return "No microphone was found.";
  return e instanceof Error ? e.message : "Could not start recording.";
}
