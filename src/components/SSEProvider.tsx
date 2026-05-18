"use client";

import { createContext, useContext, useEffect, useState } from "react";

// --- Types ---
export interface SensorReading {
  timestamp: string;
  gas1: number;
  gas2: number;
  gas3: number;
  temperature: number;
  pm: number;
  is_fire: boolean;
  confidence: number;
  triggered_by: string;
}

export interface SensorPayload {
  readings: SensorReading[];
  count: number;
  warming_up: boolean;
}

interface SSEContextType {
  data: SensorPayload | null;
  connected: boolean;
  latestReading: SensorReading | null;
}

// --- Context ---
const SSEContext = createContext<SSEContextType>({
  data: null,
  connected: false,
  latestReading: null,
});

// --- Hook ---
export function useSensor() {
  return useContext(SSEContext);
}

// --- Provider ---
export default function SSEProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => {
      setConnected(true);
      console.log("[SSE] Connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed: SensorPayload = JSON.parse(event.data);
        setData(parsed);
      } catch (err) {
        console.error("[SSE] Failed to parse data:", err);
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      console.warn("[SSE] Connection lost, retrying...");
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      console.log("[SSE] Disconnected");
    };
  }, []);

  // Latest reading is always the last item in the array
  const latestReading = data?.readings?.[data.readings.length - 1] ?? null;

  return (
    <SSEContext.Provider value={{ data, connected, latestReading }}>
      {children}
    </SSEContext.Provider>
  );
}