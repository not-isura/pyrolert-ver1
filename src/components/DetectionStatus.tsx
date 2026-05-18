"use client";

import { useSensor } from "@/components/SupabaseProvider";

const STATUS_CONFIG = {
  "High Alert": {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-600",
    subtext: "text-red-400",
    icon: "🔥",
    label: "HIGH ALERT",
  },
  "Warning": {
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    text: "text-yellow-600",
    subtext: "text-yellow-400",
    icon: "⚠️",
    label: "WARNING",
  },
  "Normal": {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-600",
    subtext: "text-green-400",
    icon: "✅",
    label: "NORMAL",
  },
} as const;

type DetectionResult = keyof typeof STATUS_CONFIG;

export default function DetectionStatus() {
  const { latestReading, isOffline } = useSensor();

  // Offline
  if (isOffline) {
    return (
      <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
        <p className="text-gray-400 text-center font-medium">
          ⏳ Waiting for connection...
        </p>
      </div>
    );
  }

  // No data yet
  if (!latestReading || !latestReading.detection_result) {
    return (
      <div className="w-full bg-gray-50 border border-gray-300 rounded-lg p-6 mb-4">
        <p className="text-gray-400 text-center font-medium">
          ⏳ Waiting for detection data...
        </p>
      </div>
    );
  }

  const result = latestReading.detection_result as DetectionResult;
  const config = STATUS_CONFIG[result] ?? STATUS_CONFIG["Normal"];

  return (
    <div
      className={`w-full rounded-lg border p-6 mb-4 
        transition-all duration-500 ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-5xl">{config.icon}</span>
        <div>
          <p className={`text-2xl font-bold ${config.text}`}>
            {config.label}
          </p>
          <p className={`text-sm mt-1 ${config.subtext}`}>
            Last updated: {latestReading.recorded_at
              ? new Date(latestReading.recorded_at).toLocaleTimeString()
              : "—"
            }
          </p>
        </div>
      </div>
    </div>
  );
}