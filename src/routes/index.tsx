import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Stage } from "@/components/game/Stage";
import { ControlBar } from "@/components/game/ControlBar";
import { Transcript } from "@/components/game/Transcript";
import { ActivityList } from "@/components/game/ActivityList";
import { ConversationEditor, micError } from "@/components/game/ConversationEditor";
import { useConversationPlayer } from "@/hooks/use-conversation-player";
import { useRecorder } from "@/hooks/use-recorder";
import { CHARACTERS, type Conversation, type SceneId } from "@/lib/game/types";
import { blankConversation, nextScene, playableLines } from "@/lib/game/conversation";
import { DEFAULT_CONVERSATIONS } from "@/lib/game/defaults";
import {
  deleteClip,
  listClipIds,
  loadConversations,
  saveClip,
  saveConversations,
} from "@/lib/game/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arte y Pasión Café – Interactive English Experience" },
      {
        name: "description",
        content:
          "Juego educativo: dos baristas animados conversan en inglés en la cafetería Arte y Pasión. Graba voces, traduce y crea tus propios diálogos.",
      },
      { property: "og:title", content: "Arte y Pasión Café – Interactive English Experience" },
      {
        property: "og:description",
        content: "Aprende inglés con conversaciones de baristas, voces grabadas y traducción al español.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

function Game() {
  const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [activeId, setActiveId] = useState(DEFAULT_CONVERSATIONS[0].id);
  const [scene, setScene] = useState<SceneId>(DEFAULT_CONVERSATIONS[0].scene);
  const [translate, setTranslate] = useState(false);
  const [clipIds, setClipIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState(0);
  const [editor, setEditor] = useState<{ open: boolean; conv: Conversation | null; isNew: boolean }>({
    open: false,
    conv: null,
    isNew: false,
  });
  const [fullscreen, setFullscreen] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useRecorder();

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const lines = useMemo(() => playableLines(active), [active]);
  const player = useConversationPlayer(lines);

  // Load saved data on the client.
  useEffect(() => {
    const saved = loadConversations();
    setConversations(saved);
    setActiveId(saved[0].id);
    setScene(saved[0].scene);
    listClipIds()
      .then((ids) => setClipIds(new Set(ids)))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Follow the playing line.
  useEffect(() => {
    if (player.status !== "idle") setSelected(player.index);
  }, [player.index, player.status]);

  const persist = (list: Conversation[]) => {
    setConversations(list);
    saveConversations(list);
  };

  const selectConversation = (id: string) => {
    player.stop();
    const c = conversations.find((x) => x.id === id);
    setActiveId(id);
    setSelected(0);
    if (c) setScene(c.scene);
  };

  const setClip = useCallback(async (lineId: string, blob: Blob | null) => {
    if (blob) await saveClip(lineId, blob);
    else await deleteClip(lineId);
    setClipIds((prev) => {
      const next = new Set(prev);
      if (blob) next.add(lineId);
      else next.delete(lineId);
      return next;
    });
  }, []);

  const targetLine = lines[selected] ?? null;
  const targetLabel = targetLine
    ? `Line ${selected + 1} · ${CHARACTERS[targetLine.speaker].name}`
    : "No line selected";

  const handlePlay = () => {
    if (!lines.length) return toast.info("Add some dialogue first with Edit dialogue.");
    if (player.status === "paused") player.resume();
    else player.play(0);
  };

  const handleRecord = async () => {
    if (recorder.recording) return recorder.stop();
    if (!targetLine) return toast.info("Select a dialogue line to record.");
    player.stop();
    const lineId = targetLine.id;
    try {
      toast.message(`Recording line ${selected + 1}… press Stop when done.`);
      const blob = await recorder.start();
      if (blob) {
        await setClip(lineId, blob);
        toast.success("Recording saved. Press Play to hear it in the scene.");
      }
    } catch (e) {
      toast.error(micError(e));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !targetLine) return;
    if (!file.type.startsWith("audio/")) return toast.error("Please choose an audio file");
    await setClip(targetLine.id, file);
    toast.success(`Audio linked to line ${selected + 1}`);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await gameRef.current?.requestFullscreen();
    } catch {
      toast.error("Full screen isn't available on this device.");
    }
  };

  const openEditor = (conv: Conversation, isNew: boolean) => {
    player.stop();
    setEditor({ open: true, conv, isNew });
  };

  const saveEdited = async (c: Conversation) => {
    const exists = conversations.some((x) => x.id === c.id);
    const prev = conversations.find((x) => x.id === c.id);
    if (prev) {
      const keep = new Set(c.lines.map((l) => l.id));
      await Promise.all(prev.lines.filter((l) => !keep.has(l.id)).map((l) => setClip(l.id, null)));
    }
    const list = exists ? conversations.map((x) => (x.id === c.id ? c : x)) : [...conversations, c];
    persist(list);
    setActiveId(c.id);
    setScene(c.scene);
    setSelected(0);
    setEditor({ open: false, conv: null, isNew: false });
    toast.success("Conversation saved");
  };

  const deleteConversation = async (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (c) await Promise.all(c.lines.map((l) => setClip(l.id, null)));
    const list = conversations.filter((x) => x.id !== id);
    persist(list);
    setActiveId(list[0].id);
    setScene(list[0].scene);
    setEditor({ open: false, conv: null, isNew: false });
    toast.success("Activity deleted");
  };

  const currentLine = player.status !== "idle" ? (lines[player.index] ?? null) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-5 sm:py-5">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-header px-4 py-3 shadow-panel sm:px-6">
          <div className="flex items-center gap-3">
            <CupMark />
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                ARTE Y PASIÓN CAFÉ
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Interactive English Experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-live/40 bg-live/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-live">
              {translate ? "English + Español" : "English mode"}
            </span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div
            ref={gameRef}
            className={cn("flex flex-col gap-3", fullscreen && "h-screen bg-background p-3")}
          >
            <Stage
              scene={scene}
              status={player.status}
              speaking={player.speaking}
              line={currentLine}
              lineNumber={player.index + 1}
              total={lines.length}
              progress={player.progress}
              translate={translate}
              source={player.source}
              fullscreen={fullscreen}
              registerMouth={player.registerMouth}
              onPlay={handlePlay}
            />
            <ControlBar
              status={player.status}
              translate={translate}
              recording={recorder.recording}
              recordElapsed={recorder.elapsed}
              fullscreen={fullscreen}
              targetLabel={targetLabel}
              onPlay={handlePlay}
              onPause={player.pause}
              onStop={player.stop}
              onReplay={() => lines.length && player.play(0)}
              onTranslate={() => setTranslate((t) => !t)}
              onRecord={handleRecord}
              onUpload={() => {
                if (!targetLine) return toast.info("Select a dialogue line first.");
                fileRef.current?.click();
              }}
              onEdit={() => openEditor(active, false)}
              onNextScene={() => setScene((s) => nextScene(s))}
              onFullscreen={toggleFullscreen}
            />
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleUpload} />
          </div>

          <aside className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-panel">
            <ActivityList
              conversations={conversations}
              activeId={active.id}
              onSelect={selectConversation}
              onCreate={() => openEditor(blankConversation(), true)}
            />
            <div className="border-t border-border pt-3">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold">
                    {active.topic}
                  </p>
                  <h2 className="truncate font-display text-xl">{active.title}</h2>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {Math.round(player.progress * 100)}%
                </span>
              </div>
              <div className="lg:max-h-[52vh] lg:overflow-y-auto lg:pr-1">
                <Transcript
                  lines={lines}
                  currentIndex={player.index}
                  playing={player.status !== "idle"}
                  selectedIndex={selected}
                  translate={translate}
                  clipIds={clipIds}
                  onSelect={setSelected}
                  onPlayFrom={(i) => player.play(i)}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ConversationEditor
        open={editor.open}
        conversation={editor.conv}
        clipIds={clipIds}
        canDelete={!editor.isNew && conversations.length > 1}
        onClose={() => setEditor({ open: false, conv: null, isNew: false })}
        onSave={saveEdited}
        onDelete={deleteConversation}
        onClipChange={setClip}
      />
    </div>
  );
}

function CupMark() {
  return (
    <div className="relative grid size-11 place-items-center rounded-full bg-gold shadow-gold">
      <svg viewBox="0 0 32 32" className="size-6 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <path d="M6 13h16v6a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7v-6Z" />
        <path d="M22 15h2.5a3 3 0 0 1 0 6H22" />
        <path className="animate-steam" d="M11 9c0-2 2-2 2-4" />
        <path className="animate-steam [animation-delay:600ms]" d="M16 9c0-2 2-2 2-4" />
      </svg>
    </div>
  );
}
