"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// --- Types ---
type SensorReading = Tables<"sensor_readings">;

interface SupabaseContextType {
    readings: SensorReading[];
    latestReading: SensorReading | null;
    isWarming: boolean;
    isOffline: boolean;
    count: number;
}

// --- Context ---
const SupabaseContext = createContext<SupabaseContextType>({
    readings: [],
    latestReading: null,
    isWarming: true,
    isOffline: false,
    count: 0,
});

// --- Hook ---
export function useSensor() {
    return useContext(SupabaseContext);
}

// --- Provider ---
export default function SupabaseProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [readings, setReadings] = useState<SensorReading[]>([]);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        // Current unix timestamp in seconds
        const now = Math.floor(Date.now() / 1000);
        const windowStart = now - 100; // last 100 seconds

        // --- Step 1: Fetch initial 100 rows within last 100 seconds ---
        const fetchInitial = async () => {
            try {
                const { data, error } = await supabase
                    .from("sensor_readings")
                    .select("*")
                    .gte("ts", windowStart)   // within last 100 seconds
                    .order("ts", { ascending: true })
                    .limit(100);

                if (error) {
                    console.error("[Supabase] Initial fetch error:", error);
                    setIsOffline(true);
                    return;
                }

                setReadings(data ?? []);
                setIsOffline(false);
                console.log(`[Supabase] Initial fetch: ${data?.length ?? 0} rows`);
            } catch (err) {
                console.error("[Supabase] Fetch failed:", err);
                setIsOffline(true);
            }
        };

        fetchInitial();

        // --- Step 2: Subscribe to Realtime for new rows ---
        const channel = supabase
            .channel("sensor_readings_live")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "sensor_readings",
                },
                (payload) => {
                    const newRow = payload.new as SensorReading;

                    setReadings((prev) => {
                        // Ignore late sync rows (older than latest in array)
                        if (prev.length > 0) {
                            const latest = prev[prev.length - 1];
                            if (newRow.ts <= latest.ts) {
                                console.log("[Supabase] Late sync row ignored:", newRow.ts);
                                return prev;
                            }
                        }

                        // FIFO — add new row, keep last 100
                        const updated = [...prev, newRow];
                        return updated.slice(-100);
                    });

                    setIsOffline(false);
                }
            )
            .subscribe((status) => {
                console.log("[Supabase] Realtime status:", status);
                if (status === "SUBSCRIBED") {
                    console.log("[Supabase] Realtime connected ✅");
                }
                if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                    console.warn("[Supabase] Realtime disconnected ⚠️");
                    setIsOffline(true);
                }
            });

        // --- Cleanup on unmount ---
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const latestReading = readings.length > 0
        ? readings[readings.length - 1]
        : null;

    const isWarming = readings.length < 100;
    const count = readings.length;

    return (
        <SupabaseContext.Provider
            value={{
                readings,
                latestReading,
                isWarming,
                isOffline,
                count,
            }}
        >
            {children}
        </SupabaseContext.Provider>
    );
}