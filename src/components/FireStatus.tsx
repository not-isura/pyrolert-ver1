"use client";

import { useSensor } from "@/components/SSEProvider";

export default function FireStatus() {
  const { data, connected, latestReading } = useSensor();

  // Not connected yet
  if (!connected || !data || !latestReading) {
    return (
      <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
        <p className="text-gray-500 font-medium text-center">
          ⏳ Waiting for sensor data...
        </p>
      </div>
    );
  }

  const isFire = latestReading.is_fire;

  return (
    <div
      className={`w-full rounded-lg p-6 mb-4 border transition-all duration-500 ${
        isFire
          ? "bg-red-50 border-red-400"
          : "bg-green-50 border-green-400"
      }`}
    >
      {/* Main Status */}
      <div className="flex items-center gap-4">
        <span className="text-5xl">{isFire ? "🔥" : "✅"}</span>
        <div>
          <p
            className={`text-2xl font-bold ${
              isFire ? "text-red-600" : "text-green-600"
            }`}
          >
            {isFire ? "FIRE DETECTED" : "ALL CLEAR"}
          </p>
          <p
            className={`text-sm mt-1 ${
              isFire ? "text-red-400" : "text-green-400"
            }`}
          >
            Last updated: {latestReading.timestamp}
          </p>
        </div>
      </div>

      {/* Fire Details — only show when fire is detected */}
      {isFire && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-red-400 uppercase tracking-wide">
                Triggered By
              </p>
              <p className="text-red-600 font-semibold mt-1">
                {latestReading.triggered_by}
              </p>
            </div>
            <div>
              <p className="text-xs text-red-400 uppercase tracking-wide">
                Confidence
              </p>
              <p className="text-red-600 font-semibold mt-1">
                {Math.round(latestReading.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}