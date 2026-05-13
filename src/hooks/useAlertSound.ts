"use client";

import { useEffect, useRef, useState } from "react";
import type { AlertEpisode } from "@/hooks/useAlertEpisode";

const STORAGE_KEY  = "pyrolert_web_muted";
const LOOKAHEAD_S  = 2.5;
const TICK_MS      = 500;

interface BeepPattern {
    frequency:     number;
    beepDuration:  number;
    pauseDuration: number;
}

const WARNING_PATTERN:    BeepPattern = { frequency: 880,  beepDuration: 1.0, pauseDuration: 1.0 };
const HIGH_ALERT_PATTERN: BeepPattern = { frequency: 1100, beepDuration: 0.2, pauseDuration: 0.1 };

export function useAlertSound(episode: AlertEpisode | null) {
    const [webMuted, setWebMuted] = useState<boolean>(() => {
        try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
    });

    const audioCtxRef    = useRef<AudioContext | null>(null);
    const sessionGainRef = useRef<GainNode | null>(null);  // disconnected on each stop to kill all pending oscillators
    const scheduledUntil = useRef<number>(0);
    const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevSeverity   = useRef<string | null>(null);

    // Unlock AudioContext on first user gesture (browser autoplay policy)
    useEffect(() => {
        const unlock = () => {
            if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
        };
        document.addEventListener("click",      unlock);
        document.addEventListener("touchstart", unlock);
        return () => {
            document.removeEventListener("click",      unlock);
            document.removeEventListener("touchstart", unlock);
        };
    }, []);

    // Reset mute when episode ends so the next alert always starts unmuted
    useEffect(() => {
        if (!episode) {
            setWebMuted(false);
            try { localStorage.setItem(STORAGE_KEY, "false"); } catch {}
            prevSeverity.current = null;
        }
    }, [episode]);

    // Auto-unmute on escalation to high_alert
    useEffect(() => {
        const severity = episode?.current_state.trim().toLowerCase().replace(/\s+/g, "_");
        if (severity === "high_alert" && prevSeverity.current === "warning" && webMuted) {
            setWebMuted(false);
            try { localStorage.setItem(STORAGE_KEY, "false"); } catch {}
        }
        prevSeverity.current = severity ?? null;
    }, [episode?.current_state]);

    // Main scheduling effect
    useEffect(() => {
        const severity   = episode?.current_state.trim().toLowerCase().replace(/\s+/g, "_");
        const active     = episode?.status === "active";
        const shouldPlay = active && (severity === "warning" || severity === "high_alert") && !webMuted;

        // Stop: disconnect session gain so all pending oscillators go silent immediately
        if (!shouldPlay) {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            if (sessionGainRef.current) { sessionGainRef.current.disconnect(); sessionGainRef.current = null; }
            scheduledUntil.current = 0;
            return;
        }

        const pattern = severity === "high_alert" ? HIGH_ALERT_PATTERN : WARNING_PATTERN;

        // Create AudioContext once
        if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        // Fresh session gain — old oscillators routed to the previous (disconnected) gain are gone
        if (sessionGainRef.current) sessionGainRef.current.disconnect();
        const sessionGain = ctx.createGain();
        sessionGain.connect(ctx.destination);
        sessionGainRef.current = sessionGain;
        scheduledUntil.current = 0;

        const scheduleBeeps = () => {
            const sg = sessionGainRef.current;
            if (!audioCtxRef.current || !sg) return;
            const now   = ctx.currentTime;
            const until = now + LOOKAHEAD_S;
            let t = Math.max(scheduledUntil.current, now);

            while (t < until) {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(sg);

                osc.type            = "sine";
                osc.frequency.value = pattern.frequency;

                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.35, t + 0.01);
                gain.gain.setValueAtTime(0.35, t + pattern.beepDuration - 0.01);
                gain.gain.linearRampToValueAtTime(0, t + pattern.beepDuration);

                osc.start(t);
                osc.stop(t + pattern.beepDuration);

                t += pattern.beepDuration + pattern.pauseDuration;
            }

            scheduledUntil.current = t;
        };

        scheduleBeeps();
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(scheduleBeeps, TICK_MS);

        return () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        };
    }, [episode?.status, episode?.current_state, webMuted]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            sessionGainRef.current?.disconnect();
            audioCtxRef.current?.close();
        };
    }, []);

    const toggleWebMuted = () => {
        setWebMuted(prev => {
            const next = !prev;
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
            return next;
        });
    };

    return { webMuted, toggleWebMuted };
}
