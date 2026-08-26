"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Zvučni signal za novu porudžbinu (Sloj 1 iz PLAN.md).
 * Web Audio, bez audio fajla — dva kratka tona, dovoljno da se čuje u ordinaciji.
 */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const beep = useCallback(() => {
    try {
      type WindowWithAudio = Window & { webkitAudioContext?: typeof AudioContext };
      const Ctor =
        window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
      if (!Ctor) return;

      const ctx = ctxRef.current ?? new Ctor();
      ctxRef.current = ctx;
      // Browser blokira zvuk dok korisnik ne klikne bar jednom po stranici.
      if (ctx.state === "suspended") void ctx.resume();

      [0, 0.22].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = i === 0 ? 880 : 1170;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.2);
      });
    } catch {
      // Zvuk je pomoćni signal — ćutke preskačemo ako browser ne da.
    }
  }, []);

  return beep;
}

/**
 * Zove `onNew` kada broj novih porudžbina poraste. Prvi snapshot se preskače
 * da ne bi zvonilo pri svakom otvaranju panela.
 */
export function useIncreaseAlert(count: number, onNew: () => void) {
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (previous.current !== null && count > previous.current) onNew();
    previous.current = count;
  }, [count, onNew]);
}
