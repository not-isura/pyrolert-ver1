"use client";

import { useSensor } from "@/components/SSEProvider";

interface SensorCardProps {
    label: string;
    value: number | null;
    unit: string;
    icon: string;
    warning?: boolean;
}

function SensorCard({ label, value, unit, icon, warning }: SensorCardProps) {
    return (
        <div
            className={`rounded-lg border p-4 flex flex-col gap-2 transition-all duration-300 ${warning
                    ? "bg-red-50 border-red-300"
                    : "bg-white border-gray-200"
                }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <span className="text-xl">{icon}</span>
            </div>
            <p
                className={`text-3xl font-bold ${warning ? "text-red-600" : "text-gray-800"
                    }`}
            >
                {value !== null ? value.toFixed(2) : "---"}
                <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
            </p>
        </div>
    );
}

export default function SensorReadings() {
    const { latestReading, connected } = useSensor();

    if (!connected || !latestReading) {
        return (
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-center text-sm">
                    ⏳ Waiting for sensor readings...
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
                📡 Live Sensor Readings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <SensorCard
                    label="Gas Sensor 1"
                    value={latestReading.gas1}
                    unit="ppm"
                    icon="💨"
                    warning={latestReading.gas1 > 0.8}
                />
                <SensorCard
                    label="Gas Sensor 2"
                    value={latestReading.gas2}
                    unit="ppm"
                    icon="💨"
                    warning={latestReading.gas2 > 0.8}
                />
                <SensorCard
                    label="Gas Sensor 3"
                    value={latestReading.gas3}
                    unit="ppm"
                    icon="💨"
                    warning={latestReading.gas3 > 0.8}
                />
                <SensorCard
                    label="Temperature"
                    value={latestReading.temperature}
                    unit="°C"
                    icon="🌡️"
                    warning={latestReading.temperature > 60}
                />
                <SensorCard
                    label="PM Sensor"
                    value={latestReading.pm}
                    unit="μg/m³"
                    icon="🌫️"
                    warning={latestReading.pm > 15}
                />
            </div>
        </div>
    );
}