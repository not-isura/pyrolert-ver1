"use client";

import { useSensor } from "@/components/SupabaseProvider";
import SensorReadingGraph, { SensorReading } from "@/components/SensorReadingGraph";

// --- Config for each sensor graph ---
const SENSOR_CONFIG = [
    {
        key: "gas_co" as keyof SensorReading,
        label: "Carbon Monoxide (CO)",
        unit: "ppm",
        color: "#ef4444",
        minVal: 0,      // preferred min
        maxVal: 100,    // preferred max
        //hardMin: 0,     // never go below this
        //hardMax: 500,  // never go above this
    },
    {
        key: "gas_no2" as keyof SensorReading,
        label: "Nitrogen Dioxide (NO2)",
        unit: "ppm",
        color: "#f97316",
        minVal: 0,
        maxVal: 5,
        //hardMin: 0,
        //hardMax: 10,
    },
    {
        key: "gas_o2" as keyof SensorReading,
        label: "Oxygen (O2)",
        unit: "%",
        color: "#22c55e",
        minVal: 10,     // preferred min (show from 10%)
        maxVal: 25,     // preferred max
        //hardMin: 0,     // can adapt down to 0%
        //hardMax: 30,    // never show above 30%
    },
    {
        key: "pm25" as keyof SensorReading,
        label: "Particulate Matter (PM2.5)",
        unit: "μg/m³",
        color: "#8b5cf6",
        minVal: 0,
        maxVal: 50,
        //hardMin: 0,
        //hardMax: 1000,
    },
    {
        key: "temp_c" as keyof SensorReading,
        label: "Temperature",
        unit: "°C",
        color: "#3b82f6",
        minVal: 20,
        maxVal: 70,
        //hardMin: 20,
        //hardMax: 120,
    },
];

// --- Main Grid Component ---
export default function SensorGridGraphs() {
    const { readings, isOffline } = useSensor();

    if (isOffline) {
        return (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-center text-sm">
                    ❌ Connection lost — waiting to reconnect...
                </p>
            </div>
        );
    }

    if (readings.length === 0) {
        return (
            <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-gray-400 text-center text-sm">
                    📊 Waiting for sensor data...
                </p>
            </div>
        );
    }

    return (
        <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
                📊 Sensor Readings — Last 100 Seconds
            </h2>

            {/* 2 per row grid */}
            <div className="grid grid-cols-2 gap-3">
                {SENSOR_CONFIG.map((config) => (
                    <div key={config.key as string} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-600">
                                {config.label}
                                <span className="text-gray-400 font-normal ml-1">({config.unit})</span>
                            </p>
                            <p className="text-sm font-bold" style={{ color: config.color }}>
                                {typeof readings[readings.length - 1]?.[config.key] === "number"
                                    ? (readings[readings.length - 1][config.key] as number).toFixed(2)
                                    : "—"}
                                <span className="text-xs font-normal text-gray-400 ml-1">
                                    {config.unit}
                                </span>
                            </p>
                        </div>
                        <SensorReadingGraph
                            dataKey={config.key}
                            color={config.color}
                            unit={config.unit}
                            minVal={config.minVal}
                            maxVal={config.maxVal}
                            readings={readings}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}