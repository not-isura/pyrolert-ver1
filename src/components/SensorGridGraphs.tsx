"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, LineData, LineSeries, UTCTimestamp } from "lightweight-charts";
import { useSensor } from "@/components/SupabaseProvider";
import type { Tables } from "@/integrations/supabase/types";

type SensorReading = Tables<"sensor_readings">;

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

// --- Individual Mini Chart ---
interface MiniChartProps {
    label: string;
    unit: string;
    color: string;
    dataKey: keyof SensorReading;
    minVal: number;
    maxVal: number;
    readings: SensorReading[];
}

function MiniChart({
    label,
    unit,
    color,
    dataKey,
    minVal,
    maxVal,
    readings,
}: MiniChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    // --- Initialize chart once ---
    useEffect(() => {
        if (!containerRef.current) return;

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 150,
            layout: {
                background: { color: "transparent" },
                textColor: "#6b7280",
                attributionLogo: false
            },
            grid: {
                vertLines: { color: "#f3f4f6" },
                horzLines: { color: "#f3f4f6" },
            },
            rightPriceScale: {
                visible: true,
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            leftPriceScale: {
                visible: false,
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: true,
            },
            crosshair: {
                vertLine: { visible: true },
                horzLine: { visible: true },
            },
            handleScroll: false,
            handleScale: false,
        });

        const series = chart.addSeries(LineSeries, {
            color: color,
            lineWidth: 2,
            crosshairMarkerVisible: true,
            priceLineVisible: false,
            lastValueVisible: true,
            autoscaleInfoProvider: (original) => {
                const res = original();

                if (!res) {
                    return {
                        priceRange: {
                            minValue: minVal,
                            maxValue: maxVal,
                        },
                    };
                }

                return {
                    priceRange: {
                        // Never go above hardMax or below hardMin
                        minValue: Math.min(res.priceRange.minValue, minVal),
                        maxValue: Math.max(res.priceRange.maxValue, maxVal),
                    },
                };
            },
        });

        chartRef.current = chart;
        seriesRef.current = series;

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: containerRef.current.clientWidth,
                });
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // --- Update data when readings change ---
    useEffect(() => {
        if (!seriesRef.current || readings.length === 0) return;

        const seen = new Set<number>();

        // Skip null values — leave gap in graph
        const data: LineData[] = readings
            .reduce<LineData[]>((acc, r) => {
                const value = r[dataKey];

                // Skip null or non-finite values
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    return acc;
                }

                const unixTime = Math.floor(r.ts);
                if (!Number.isFinite(unixTime)) {
                    return acc;
                }

                // Skip duplicate timestamps ← THIS WAS MISSING
                if (seen.has(unixTime)) {
                    return acc;
                }
                seen.add(unixTime)

                acc.push({
                    time: unixTime as UTCTimestamp,
                    value,
                });

                return acc;
            }, [])
            .sort((a, b) => (a.time as number) - (b.time as number)); // ← ensure asc order

        if (data.length === 0) return;

        seriesRef.current.setData(data);
        chartRef.current?.timeScale().scrollToRealTime();
    }, [readings, dataKey]);

    // Get latest value for display
    const latestValue = readings.length > 0
        ? (readings[readings.length - 1][dataKey] as number | null)
        : null;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-gray-600">
                    {label}
                    <span className="text-gray-400 font-normal ml-1">({unit})</span>
                </p>
                <p
                    className="text-sm font-bold"
                    style={{ color }}
                >
                    {latestValue !== null ? latestValue.toFixed(2) : "—"}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                        {unit}
                    </span>
                </p>
            </div>

            {/* Chart */}
            <div ref={containerRef} className="w-full" />
        </div>
    );
}

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
                    <MiniChart
                        key={config.key as string}
                        label={config.label}
                        unit={config.unit}
                        color={config.color}
                        dataKey={config.key}
                        minVal={config.minVal}
                        maxVal={config.maxVal}
                        readings={readings}
                    />
                ))}
            </div>
        </div>
    );
}