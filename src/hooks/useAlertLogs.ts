"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AlertEpisodeLog = Tables<"alert_episodes">;

export const LOGS_PAGE_SIZE = 10;

export function useAlertLogs() {
    const [episodes, setEpisodes] = useState<AlertEpisodeLog[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0); // 0-indexed
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from("alert_episodes")
                .select("*", { count: "exact", head: true })
                .in("status", ["resolved", "false_alarm"]);
            setTotalCount(count ?? 0);
        };
        fetchCount();
    }, []);

    useEffect(() => {
        const fetchPage = async () => {
            setLoading(true);
            const from = page * LOGS_PAGE_SIZE;
            const to   = from + LOGS_PAGE_SIZE - 1;
            const { data, error } = await supabase
                .from("alert_episodes")
                .select("*")
                .in("status", ["resolved", "false_alarm"])
                .order("started_ts", { ascending: false })
                .range(from, to);
            if (!error) setEpisodes((data ?? []) as AlertEpisodeLog[]);
            setLoading(false);
        };
        fetchPage();
    }, [page]);

    const totalPages = Math.ceil(totalCount / LOGS_PAGE_SIZE);

    return { episodes, totalCount, totalPages, page, setPage, loading };
}
