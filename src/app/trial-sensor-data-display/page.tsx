"use client";

import SSEProvider from "@/components/SSEProvider";
import WarmingUp from "@/components/WarmingUp";
import FireStatus from "@/components/FireStatus";
import SensorReadings from "@/components/SensorReadings";
import SensorGraph from "@/components/SensorGraph";

export default function TrialPage() {
    return (
        <SSEProvider>
            <main className="p-6">
                <h1 className="text-2xl font-bold mb-4">
                    🔥 Fire Detection Dashboard (Trial)
                </h1>
                <WarmingUp />
                <FireStatus />
                <SensorReadings />
                <SensorGraph />
            </main>
        </SSEProvider>
    );
}