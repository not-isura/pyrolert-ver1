"use client";

import { useState } from "react";

export type AlertLevel = "warning" | "high_alert";
export type AlertStatus = "active" | "resolved" | "false_alarm" | "archived";

export type AlertEvent = {
    id: string;
    triggered_at: string;
    last_updated: string;
    current_level: AlertLevel;
    status: AlertStatus;
    created_at: string;
};

export type AlertStateHistory = {
    id: string;
    alert_event_id: string;
    state: AlertLevel;
    timestamp: string;
    created_at: string;
};

// ---------------------------------------------------------------------------
// Mock data — swap USE_MOCK to false and fill in Supabase queries when ready
// ---------------------------------------------------------------------------

const USE_MOCK = true;

const now = Date.now();

const MOCK_ALERT: AlertEvent = {
    id: "mock-alert-1",
    triggered_at: new Date(now - 5 * 60 * 1000).toISOString(),
    last_updated: new Date(now - 3 * 60 * 1000).toISOString(),
    current_level: "high_alert",
    status: "active",
    created_at: new Date(now - 5 * 60 * 1000).toISOString(),
};

const MOCK_HISTORY: AlertStateHistory[] = [
    {
        id: "h1",
        alert_event_id: "mock-alert-1",
        state: "warning",
        timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
        created_at: new Date(now - 5 * 60 * 1000).toISOString(),
    },
    {
        id: "h2",
        alert_event_id: "mock-alert-1",
        state: "high_alert",
        timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
        created_at: new Date(now - 3 * 60 * 1000).toISOString(),
    },
];

// ---------------------------------------------------------------------------

export function useAlert() {
    const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(USE_MOCK ? MOCK_ALERT : null);
    const [alertHistory] = useState<AlertStateHistory[]>(USE_MOCK ? MOCK_HISTORY : []);

    const resolveAlert = async (_id: string, resolution: "resolved" | "false_alarm") => {
        if (USE_MOCK) {
            setActiveAlert((prev) => prev ? { ...prev, status: resolution } : null);
            return;
        }
        // TODO: supabase.from("alert_event_logs").update({ status: resolution }).eq("id", _id)
    };

    const archiveAlert = async (_id: string) => {
        if (USE_MOCK) {
            setActiveAlert(null);
            return;
        }
        // TODO: supabase.from("alert_event_logs").update({ status: "archived" }).eq("id", _id)
    };

    return { activeAlert, alertHistory, resolveAlert, archiveAlert };
}
