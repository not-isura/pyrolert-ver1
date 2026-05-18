"use client";

import { useEffect, useRef, useState } from "react";
import type { SensorReading } from "@/components/SensorReadingGraph";

const STALE_THRESHOLD_SECONDS = 30;
const CHECK_INTERVAL_MS = 5000;

export function useDeviceConnection(readings: SensorReading[]) {
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const latestTsRef = useRef<number | null>(null);

    useEffect(() => {
        if (readings.length === 0) return;
        const latest = readings[readings.length - 1];
        if (typeof latest.ts === "number") {
            latestTsRef.current = latest.ts;
        }
    }, [readings]);

    useEffect(() => {
        const evaluate = () => {
            if (latestTsRef.current === null) {
                setIsDeviceConnected(false);
                return;
            }
            const ageSeconds = Date.now() / 1000 - latestTsRef.current;
            setIsDeviceConnected(ageSeconds < STALE_THRESHOLD_SECONDS);
        };

        evaluate();
        const id = setInterval(evaluate, CHECK_INTERVAL_MS);
        return () => clearInterval(id);
    }, [readings]);

    return { isDeviceConnected };
}
