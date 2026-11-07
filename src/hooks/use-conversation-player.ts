import { useCallback, useEffect, useRef, useState } from "react";
import type { DialogueLine, Speaker } from "@/lib/game/types";
import { getClip } from "@/lib/game/storage";
import { pickVoice, VOICE_PITCH, VOICE_RATE } from "@/lib/game/voices";
import { conversationProgress } from "@/lib/game/conversation";

export type PlayerStatus = "idle" | "playing" | "paused";
const GAP_MS = 550;

interface Current {
  audio?: HTMLAudioElement;
  url?: string;
  analyser?: AnalyserNode;
  ttsStart?: number;
  ttsChars?: number;
  textLen?: number;
  timer?: ReturnType<typeof setTimeout>;
}

/**
 * Plays a conversation line by line, in order. Recorded clips win; otherwise the
 * browser's English text-to-speech is used. Mouth frames are driven directly on
 * registered DOM nodes (data-mouth) to avoid re-rendering 60 times a second.
 */
export function useConversationPlayer(lines: DialogueLine[]) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState<Speaker | null>(null);
  const [progress, setProgress] = useState(0);
  const [source, setSource] = useState<"clip" | "tts" | null>(null);

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const indexRef = useRef(0);
  const statusRef = useRef<PlayerStatus>("idle");
  const tokenRef = useRef(0);
  const cur = useRef<Current>({});
  const ctxRef = useRef<AudioContext | null>(null);
  const mouthEls = useRef<Record<Speaker, HTMLElement | null>>({ male: null, female: null });
  const speakingRef = useRef<Speaker | null>(null);
  const rafRef = useRef<number>(0);
  const lastProgress = useRef(0);

  const setMouth = (who: Speaker | null, open: boolean) => {
    (["male", "female"] as Speaker[]).forEach((s) => {
      const el = mouthEls.current[s];
      if (el) el.dataset["mouth"] = s === who && open ? "open" : "closed";
    });
  };

  const registerMouth = useCallback((speaker: Speaker, el: HTMLElement | null) => {
    mouthEls.current[speaker] = el;
  }, []);

  const setStatusBoth = (s: PlayerStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  const cleanupCurrent = () => {
    const c = cur.current;
    if (c.timer) clearTimeout(c.timer);
    if (c.audio) {
      c.audio.onended = null;
      c.audio.pause();
    }
    if (c.url) URL.revokeObjectURL(c.url);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    cur.current = {};
  };

  // Animation loop: mouth + progress.
  useEffect(() => {
    let mouthOpen = false;
    let nextFlip = 0;
    const buf = new Uint8Array(1024);
    const loop = (t: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const who = speakingRef.current;
      if (statusRef.current !== "playing" || !who) {
        if (mouthOpen) {
          mouthOpen = false;
          setMouth(null, false);
        }
        return;
      }
      const c = cur.current;
      let fraction = 0;
      if (c.audio && c.analyser) {
        c.analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        const open = mouthOpen ? rms > 0.025 : rms > 0.045;
        if (open !== mouthOpen && t > nextFlip) {
          mouthOpen = open;
          nextFlip = t + 70;
          setMouth(who, open);
        }
        if (c.audio.duration && isFinite(c.audio.duration)) fraction = c.audio.currentTime / c.audio.duration;
      } else if (c.ttsStart) {
        // Syllable-like flapping while the synthetic voice speaks.
        if (t > nextFlip) {
          mouthOpen = !mouthOpen;
          nextFlip = t + (mouthOpen ? 110 + Math.random() * 90 : 70 + Math.random() * 80);
          setMouth(who, mouthOpen);
        }
        const len = c.textLen || 1;
        const est = (performance.now() - c.ttsStart) / (len * 70);
        fraction = Math.max((c.ttsChars ?? 0) / len, Math.min(est, 0.95));
      }
      const p = conversationProgress(linesRef.current.length, indexRef.current, fraction);
      if (Math.abs(p - lastProgress.current) > 0.004) {
        lastProgress.current = p;
        setProgress(p);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const finish = () => {
    speakingRef.current = null;
    setSpeaking(null);
    setSource(null);
    setMouth(null, false);
    setStatusBoth("idle");
    setProgress(1);
    lastProgress.current = 1;
  };

  const playLine = useCallback(async (i: number, token: number) => {
    const list = linesRef.current;
    if (token !== tokenRef.current) return;
    const line = list[i];
    if (!line) return finish();
    cleanupCurrent();
    indexRef.current = i;
    setIndex(i);
    speakingRef.current = line.speaker;
    setSpeaking(line.speaker);

    const after = () => {
      if (token !== tokenRef.current) return;
      speakingRef.current = null;
      setSpeaking(null);
      setMouth(null, false);
      cur.current.timer = setTimeout(() => playLine(i + 1, token), GAP_MS);
    };

    let clip: Blob | undefined;
    try {
      clip = await getClip(line.id);
    } catch {
      clip = undefined;
    }
    if (token !== tokenRef.current) return;

    if (clip) {
      setSource("clip");
      const url = URL.createObjectURL(clip);
      const audio = new Audio(url);
      cur.current = { audio, url };
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current ??= new Ctx();
        await ctxRef.current.resume();
        const src = ctxRef.current.createMediaElementSource(audio);
        const analyser = ctxRef.current.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        analyser.connect(ctxRef.current.destination);
        cur.current.analyser = analyser;
      } catch {
        /* analyser optional */
      }
      audio.onended = after;
      audio.onerror = after;
      audio.play().catch(after);
      return;
    }

    setSource("tts");
    const text = line.en;
    if (!("speechSynthesis" in window)) {
      cur.current = { ttsStart: performance.now(), textLen: text.length };
      cur.current.timer = setTimeout(after, Math.max(1500, text.length * 70));
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const voice = pickVoice(line.speaker);
    if (voice) u.voice = voice;
    u.pitch = VOICE_PITCH[line.speaker];
    u.rate = VOICE_RATE;
    cur.current = { ttsStart: performance.now(), textLen: text.length, ttsChars: 0 };
    u.onboundary = (e) => {
      if (token === tokenRef.current) cur.current.ttsChars = e.charIndex;
    };
    u.onend = after;
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") return;
      after();
    };
    window.speechSynthesis.speak(u);
  }, []);

  const play = useCallback(
    (from = 0) => {
      tokenRef.current += 1;
      cleanupCurrent();
      setStatusBoth("playing");
      lastProgress.current = 0;
      playLine(from, tokenRef.current);
    },
    [playLine],
  );

  const pause = useCallback(() => {
    if (statusRef.current !== "playing") return;
    setStatusBoth("paused");
    const c = cur.current;
    if (c.audio) {
      c.audio.pause();
    } else {
      // Synthetic speech can't pause reliably across browsers: the line restarts on resume.
      tokenRef.current += 1;
      cleanupCurrent();
    }
    setMouth(null, false);
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== "paused") return;
    const c = cur.current;
    setStatusBoth("playing");
    if (c.audio && !c.audio.ended) {
      speakingRef.current = linesRef.current[indexRef.current]?.speaker ?? null;
      setSpeaking(speakingRef.current);
      c.audio.play().catch(() => undefined);
    } else {
      tokenRef.current += 1;
      playLine(indexRef.current, tokenRef.current);
    }
  }, [playLine]);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    cleanupCurrent();
    speakingRef.current = null;
    setSpeaking(null);
    setSource(null);
    setMouth(null, false);
    setStatusBoth("idle");
    indexRef.current = 0;
    setIndex(0);
    setProgress(0);
    lastProgress.current = 0;
  }, []);

  useEffect(() => () => {
    tokenRef.current += 1;
    cleanupCurrent();
  }, []);

  // Warm up the voice list (Chrome loads it asynchronously).
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    const h = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", h);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", h);
  }, []);

  return { status, index, speaking, progress, source, play, pause, resume, stop, registerMouth };
}
