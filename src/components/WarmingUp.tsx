"use client";

import { useSensor } from "@/components/SupabaseProvider";
export default function WarmingUp() {
    const { isWarming, isOffline, count } = useSensor();

    // Don't show anything if not connected yet
    if (isOffline) {
        return (
            <div className="w-full bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-yellow-700 font-medium">
                    ⏳ Waiting for connection...
                </p>
            </div>
        );
    }

    // Don't show warming up bar once we have 100 readings
    if (!isWarming) return null;

    const progress = Math.round((count / 100) * 100);

    return (
        <div className="w-full bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
            {/* Title */}
            <div className="flex justify-between items-center mb-2">
                <p className="text-blue-700 font-medium">
                    🔄 Warming up... collecting readings
                </p>
                <p className="text-blue-700 font-medium text-sm">
                    {count} / 100
                </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-3">
                <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="text-blue-500 text-xs mt-2">
                Graph will appear once 100 readings are collected
            </p>
        </div>
    );
}