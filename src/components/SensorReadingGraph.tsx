"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, LineData, LineSeries, UTCTimestamp, LastPriceAnimationMode, LineStyle } from "lightweight-charts";
import type { Tables } from "@/integrations/supabase/types";

export type SensorReading = Tables<"sensor_readings">;

interface SensorReadingGraphProps {
    dataKey: keyof SensorReading;
    color: string;
    unit: string;
    minVal: number;
    maxVal: number;
    readings: SensorReading[];
    height?: number;
}

export default function SensorReadingGraph({
    dataKey,
    color,
    unit,
    minVal,
    maxVal,
    readings,
    height = 150,
}: SensorReadingGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height,
            layout: {
                background: { color: "transparent" },
                textColor: "#6b7280",
                attributionLogo: false,
            },
            localization: {
                timeFormatter: (time) => new Date(time * 1000).toLocaleTimeString("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                }),
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
                tickMarkFormatter: (time) => new Date((time as number) * 1000).toLocaleTimeString("en-PH", {
                    timeZone: "Asia/Manila",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                }),
            },
            crosshair: {
                vertLine: { visible: true },
                horzLine: { visible: true },
            },
            handleScroll: false,
            handleScale: false,
        });

        const series = chart.addSeries(LineSeries, {
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Solid,

            lastPriceAnimation: LastPriceAnimationMode.Continuous,
            crosshairMarkerVisible: true,
            priceLineVisible: false,
            lastValueVisible: false,
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
                        minValue: Math.min(res.priceRange.minValue, minVal),
                        maxValue: Math.max(res.priceRange.maxValue, maxVal),
                    },
                };
            },
        });

        chartRef.current = chart;
        seriesRef.current = series;

        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current || !chartRef.current) {
                return;
            }

            chartRef.current.applyOptions({
                width: containerRef.current.clientWidth,
            });
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [color, minVal, maxVal, unit]);

    useEffect(() => {
        if (!seriesRef.current || readings.length === 0) {
            return;
        }

        const seen = new Set<number>();

        const data: LineData[] = readings
            .reduce<LineData[]>((acc, reading) => {
                const value = reading[dataKey];

                if (typeof value !== "number" || !Number.isFinite(value)) {
                    return acc;
                }

                const unixTime = Math.floor(reading.ts);
                if (!Number.isFinite(unixTime) || seen.has(unixTime)) {
                    return acc;
                }

                seen.add(unixTime);

                acc.push({
                    time: unixTime as UTCTimestamp,
                    value,
                });

                return acc;
            }, [])
            .sort((a, b) => (a.time as number) - (b.time as number));

        if (data.length === 0) {
            return;
        }

        seriesRef.current.setData(data);
        chartRef.current?.timeScale().scrollToRealTime();
    }, [readings, dataKey]);

    return <div ref={containerRef} className="w-full" aria-label={`Sensor reading graph (${unit})`} />;
}
