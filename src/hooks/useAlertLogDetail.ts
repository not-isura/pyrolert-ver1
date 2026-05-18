"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { SensorReading } from "@/components/SensorReadingGraph";

export type AlertTransitionLog = Tables<"alert_transitions">;
export type HeadcountLogDetail = Tables<"headcount_logs">;
export type AlertEpisodeLog    = Tables<"alert_episodes">;

export function useAlertLogDetail(
    episode: AlertEpisodeLog | null,
    paddingBefore = 30,
    paddingAfter  = 30,
) {
    const [transitions,    setTransitions]    = useState<AlertTransitionLog[]>([]);
    const [readings,       setReadings]       = useState<SensorReading[]>([]);
    const [headcountLogs,  setHeadcountLogs]  = useState<HeadcountLogDetail[]>([]);
    const [loading,        setLoading]        = useState(false);
    const [readingsLoading, setReadingsLoading] = useState(false);

    // Fetch transitions + headcount only when episode changes
    useEffect(() => {
        if (!episode) {
            setTransitions([]);
            setHeadcountLogs([]);
            return;
        }
        const fetch = async () => {
            setLoading(true);
            const [transRes, hcRes] = await Promise.all([
                supabase
                    .from("alert_transitions")
                    .select("*")
                    .eq("episode_id", episode.id)
                    .order("ts", { ascending: true }),
                supabase
                    .from("headcount_logs")
                    .select("*")
                    .eq("episode_id", episode.id)
                    .order("ts", { ascending: false }),
            ]);
            setTransitions((transRes.data ?? []) as AlertTransitionLog[]);
            setHeadcountLogs((hcRes.data ?? []) as HeadcountLogDetail[]);
            setLoading(false);
        };
        fetch();
    }, [episode?.id]);

    // Fetch readings whenever episode or padding changes
    useEffect(() => {
        if (!episode) { setReadings([]); return; }
        const fetch = async () => {
            setReadingsLoading(true);
            const { data } = await supabase
                .from("sensor_readings")
                .select("*")
                .gte("ts", episode.started_ts - paddingBefore)
                .lte("ts", episode.last_updated_ts + paddingAfter)
                .order("ts", { ascending: true });
            setReadings((data ?? []) as SensorReading[]);
            setReadingsLoading(false);
        };
        fetch();
    }, [episode?.id, paddingBefore, paddingAfter]);

    return { transitions, readings, headcountLogs, loading, readingsLoading };
}
