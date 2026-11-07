import { useCallback, useEffect, useRef, useState } from "react";

/** Microphone recorder. start() asks for permission; stop() resolves with the recorded clip. */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const resolver = useRef<((b: Blob | null) => void) | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("Este navegador no permite grabar audio.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    const done = new Promise<Blob | null>((resolve) => (resolver.current = resolve));
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = chunks.current.length
        ? new Blob(chunks.current, { type: rec.mimeType || "audio/webm" })
        : null;
      resolver.current?.(blob);
      resolver.current = null;
    };
    rec.start();
    recRef.current = rec;
    setRecording(true);
    setElapsed(0);
    const t0 = Date.now();
    timer.current = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 250);
    return done;
  }, []);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (recRef.current?.state === "recording") recRef.current.stop();
    recRef.current = null;
    setRecording(false);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      if (recRef.current?.state === "recording") recRef.current.stop();
    },
    [],
  );

  return { recording, elapsed, start, stop };
}
