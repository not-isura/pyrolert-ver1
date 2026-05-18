"use client";

import SupabaseProvider from "@/components/SupabaseProvider";
import DetectionStatus from "@/components/DetectionStatus";
import SensorGridGraphs from "@/components/SensorGridGraphs";

export default function TrialV2Page() {
    return (
        <SupabaseProvider>
            <main className="min-h-screen bg-gray-100 p-6">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        🔥 Fire Detection Dashboard
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Live sensor monitoring — updates every second
                    </p>
                </div>

                {/* Detection Status */}
                <DetectionStatus />

                {/* Sensor Graphs */}
                <SensorGridGraphs />

            </main>
        </SupabaseProvider>
    );
}