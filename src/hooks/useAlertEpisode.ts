"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AlertEpisode   = Tables<"alert_episodes">;
export type AlertTransition = Tables<"alert_transitions">;

export function useAlertEpisode() {
    const [activeEpisode, setActiveEpisode]   = useState<AlertEpisode | null>(null);
    const [transitions,   setTransitions]     = useState<AlertTransition[]>([]);

    // Keep a ref so realtime callbacks always see the current episode id
    // without needing to be recreated on state changes
    const episodeIdRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchInitial = async () => {
            // Fetch the single active episode (at most one exists at a time)
            const { data: episodeRaw, error: epErr } = await supabase
                .from("alert_episodes")
                .select("*")
                .is("dismissed_at", null)
                .order("started_ts", { ascending: false })
                .limit(1)
                .maybeSingle();
            const episode = episodeRaw as AlertEpisode | null;

            if (epErr) {
                console.error("[useAlertEpisode] Episode fetch error:", epErr.code, epErr.message, epErr.details, epErr.hint);
                return;
            }

            if (!episode) return;

            setActiveEpisode(episode);
            episodeIdRef.current = episode.id;

            // Fetch all transitions for this episode
            const { data: trans, error: transErr } = await supabase
                .from("alert_transitions")
                .select("*")
                .eq("episode_id", episode.id)
                .order("ts", { ascending: true });

            if (transErr) {
                console.error("[useAlertEpisode] Transitions fetch error:", transErr);
                return;
            }

            setTransitions(trans ?? []);
        };

        fetchInitial();

        const channel = supabase
            .channel("alert_episode_live")

            // RPi creates a new confirmed alert episode
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alert_episodes" },
                async (payload) => {
                    const newEpisode = payload.new as AlertEpisode;
                    if (newEpisode.status !== "active") return;

                    setActiveEpisode(newEpisode);
                    episodeIdRef.current = newEpisode.id;
                    setTransitions([]);

                    // Fetch any transitions that may have been inserted in the same batch
                    const { data: trans } = await supabase
                        .from("alert_transitions")
                        .select("*")
                        .eq("episode_id", newEpisode.id)
                        .order("ts", { ascending: true });

                    setTransitions(trans ?? []);
                }
            )

            // RPi ticks last_updated_ts every second (and may change current_state)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "alert_episodes" },
                (payload) => {
                    const updated = payload.new as AlertEpisode;
                    if (updated.id !== episodeIdRef.current) return;
                    if (updated.dismissed_at !== null) {
                        setActiveEpisode(null);
                        setTransitions([]);
                        episodeIdRef.current = null;
                        return;
                    }
                    setActiveEpisode(updated);
                }
            )

            // RPi records a state transition within the active episode
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "alert_transitions" },
                (payload) => {
                    const newTrans = payload.new as AlertTransition;
                    if (newTrans.episode_id !== episodeIdRef.current) return;
                    setTransitions((prev) => [...prev, newTrans]);
                }
            )

            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[useAlertEpisode] Realtime connected ✅");
                }
                if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    console.warn("[useAlertEpisode] Realtime disconnected ⚠️");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { activeEpisode, transitions };
}
