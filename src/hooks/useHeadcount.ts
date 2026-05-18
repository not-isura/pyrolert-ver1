"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type HeadcountLog = Tables<"headcount_logs">;

const CARD_LIMIT = 5; // max slides shown in the card carousel

export function useHeadcount(episodeId: number | null) {
    const [logs,          setLogs]          = useState<HeadcountLog[]>([]);
    const [requesting,    setRequesting]    = useState(false); // true while waiting for RPi to deliver a new capture
    const prevLogCount    = useRef<number>(0);
    const episodeIdRef    = useRef<number | null>(null);

    // Reset when episode changes
    useEffect(() => {
        episodeIdRef.current = episodeId;
        setLogs([]);
        setRequesting(false);
        prevLogCount.current = 0;

        if (!episodeId) return;

        const fetch = async () => {
            const { data, error } = await supabase
                .from("headcount_logs")
                .select("*")
                .eq("episode_id", episodeId)
                .order("ts", { ascending: false });

            if (error) {
                console.error("[useHeadcount] Fetch error:", error.code, error.message);
                return;
            }
            const rows = (data ?? []) as HeadcountLog[];
            setLogs(rows);
            prevLogCount.current = rows.length;
        };

        fetch();

        const channel = supabase
            .channel(`headcount_live_${episodeId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "headcount_logs", filter: `episode_id=eq.${episodeId}` },
                (payload) => {
                    const newLog = payload.new as HeadcountLog;
                    setLogs((prev) => {
                        if (prev.some((l) => l.id === newLog.id)) return prev;
                        return [newLog, ...prev]; // newest first
                    });
                    // A new row arrived — the RPi acted on the request
                    setRequesting(false);
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "headcount_logs", filter: `episode_id=eq.${episodeId}` },
                (payload) => {
                    const updated = payload.new as HeadcountLog;
                    // image_url may have been filled in after a retry
                    setLogs((prev) => prev.map((l) => l.id === updated.id ? updated : l));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [episodeId]);

    const requestCapture = async () => {
        if (!episodeIdRef.current || requesting) return;
        setRequesting(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from("alert_episodes")
            .update({ headcount_requested: true })
            .eq("id", episodeIdRef.current);

        if (error) {
            console.error("[useHeadcount] Request error:", error.code, error.message);
            setRequesting(false);
        }
    };

    // Newest-first; card shows only successful captures (last CARD_LIMIT), fullscreen shows all
    const cardLogs     = logs.filter(l => l.status === "success").slice(0, CARD_LIMIT);
    const totalCaptured = logs.length;

    return { cardLogs, allLogs: logs, totalCaptured, requesting, requestCapture };
}
