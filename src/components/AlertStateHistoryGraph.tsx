"use client";

import { useEffect, useRef } from "react";
import {
    createChart,
    IChartApi,
    ISeriesApi,
    LineData,
    LineSeries,
    LineStyle,
    LineType,
    UTCTimestamp,
} from "lightweight-charts";
import type { AlertStateHistory } from "@/hooks/useAlert";

interface AlertStateHistoryGraphProps {
    history: AlertStateHistory[];
}

// Numeric encoding for y-axis: Warning = 1, High Alert = 2
const STATE_VALUE: Record<string, number> = {
    warning: 1,
    high_alert: 2,
};

const STATE_LABEL: Record<number, string> = {
    1: "Warning",
    2: "High Alert",
};

export default function AlertStateHistoryGraph({ history }: AlertStateHistoryGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 180,
            layout: {
                background: { color: "transparent" },
                textColor: "#6b7280",
                attributionLogo: false,
            },
            localization: {
                priceFormatter: (price: number) => STATE_LABEL[Math.round(price)] ?? "",
                timeFormatter: (time) =>
                    new Date(time * 1000).toLocaleTimeString("en-PH", {
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
                scaleMargins: { top: 0.3, bottom: 0.3 },
                ticksVisible: true,
            },
            leftPriceScale: { visible: false },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: true,
                tickMarkFormatter: (time) =>
                    new Date((time as number) * 1000).toLocaleTimeString("en-PH", {
                        timeZone: "Asia/Manila",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    }),
            },
            crosshair: {
                vertLine: { visible: true },
                horzLine: { visible: false },
            },
            handleScroll: false,
            handleScale: false,
        });

        const series = chart.addSeries(LineSeries, {
            color: "#ef4444",
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            lineType: LineType.WithSteps,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 5,
            priceLineVisible: false,
            lastValueVisible: false,
            autoscaleInfoProvider: () => ({
                priceRange: { minValue: 0.5, maxValue: 2.5 },
            }),
        });

        chartRef.current = chart;
        seriesRef.current = series;

        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current || !chartRef.current) {
                return;
            }
            chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (!seriesRef.current || history.length === 0) {
            return;
        }

        const data: LineData[] = history
            .map((entry) => ({
                time: Math.floor(new Date(entry.timestamp).getTime() / 1000) as UTCTimestamp,
                value: STATE_VALUE[entry.state] ?? 1,
            }))
            .sort((a, b) => (a.time as number) - (b.time as number));

        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
    }, [history]);

    if (history.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                No state transitions recorded.
            </p>
        );
    }

    return (
        <div ref={containerRef} className="w-full" aria-label="Alert state history graph" />
    );
}
