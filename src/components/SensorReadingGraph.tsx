"use client";

import { useEffect, useRef } from "react";
import { CanvasRenderingTarget2D } from "fancy-canvas";
import { createChart, IChartApi, ISeriesApi, LineData, LineSeries, LogicalRange, UTCTimestamp, LastPriceAnimationMode, LineStyle } from "lightweight-charts";
import type { Tables } from "@/integrations/supabase/types";

export type SensorReading = Tables<"sensor_readings">;
export interface VerticalLineSpec { ts: number; color: string; dashed?: boolean; }

interface VLine { ts: UTCTimestamp; color: string; dashed: boolean; }

// Draws one or more dashed vertical lines at given timestamps
class VerticalLinePrimitive {
    private _lines: VLine[] = [];
    private _chart: IChartApi | null = null;
    private _requestUpdate: (() => void) | null = null;

    setLines(lines: VLine[]) {
        this._lines = lines;
        this._requestUpdate?.();
    }

    attached({ chart, requestUpdate }: { chart: IChartApi; requestUpdate: () => void }) {
        this._chart = chart;
        this._requestUpdate = requestUpdate;
    }

    detached() {
        this._chart = null;
        this._requestUpdate = null;
    }

    paneViews() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return [{
            renderer() {
                return {
                    draw(target: CanvasRenderingTarget2D) {
                        if (!self._chart || self._lines.length === 0) return;
                        target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio, verticalPixelRatio }) => {
                            for (const line of self._lines) {
                                const x = self._chart!.timeScale().timeToCoordinate(line.ts);
                                if (x === null) continue;
                                const bx = Math.round(x * horizontalPixelRatio);
                                context.save();
                                context.beginPath();
                                context.setLineDash(line.dashed ? [3 * verticalPixelRatio, 3 * verticalPixelRatio] : []);
                                context.moveTo(bx, 0);
                                context.lineTo(bx, bitmapSize.height);
                                context.strokeStyle = line.color;
                                context.lineWidth = 1.5 * horizontalPixelRatio;
                                context.stroke();
                                context.restore();
                            }
                        });
                    },
                };
            },
        }];
    }
}

interface SensorReadingGraphProps {
    dataKey: keyof SensorReading;
    color: string;
    unit: string;
    minVal: number;
    maxVal: number;
    readings: SensorReading[];
    height?: number;
    verticalLines?: VerticalLineSpec[];
    thresholdValue?: number;
    interactive?: boolean;
    onChartCreated?: (chart: IChartApi) => void;
    onChartRemoved?: (chart: IChartApi) => void;
}

export default function SensorReadingGraph({
    dataKey,
    color,
    unit,
    minVal,
    maxVal,
    readings,
    height = 150,
    verticalLines,
    thresholdValue,
    interactive = false,
    onChartCreated,
    onChartRemoved,
}: SensorReadingGraphProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef     = useRef<IChartApi | null>(null);
    const seriesRef    = useRef<ISeriesApi<"Line"> | null>(null);
    const vertLineRef  = useRef<VerticalLinePrimitive | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

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
            leftPriceScale: { visible: false },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: true,
                fixLeftEdge: interactive,
                fixRightEdge: interactive,
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
            handleScroll: interactive
                ? { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false }
                : false,
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
                if (!res) return { priceRange: { minValue: minVal, maxValue: maxVal } };
                return {
                    priceRange: {
                        minValue: Math.min(res.priceRange.minValue, minVal),
                        maxValue: Math.max(res.priceRange.maxValue, maxVal),
                    },
                };
            },
        });

        if (thresholdValue !== undefined) {
            series.createPriceLine({
                price: thresholdValue,
                color: "#f59e0b",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: false,
                title: "",
            });
        }

        const vertLine = new VerticalLinePrimitive();
        series.attachPrimitive(vertLine);

        chartRef.current  = chart;
        seriesRef.current = series;
        vertLineRef.current = vertLine;
        onChartCreated?.(chart);

        const resizeObserver = new ResizeObserver(() => {
            if (!containerRef.current || !chartRef.current) return;
            chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            onChartRemoved?.(chart);
            chart.remove();
        };
    }, [color, minVal, maxVal, unit, thresholdValue, interactive]);

    useEffect(() => {
        if (!seriesRef.current || readings.length === 0) return;

        const seen = new Set<number>();
        const data: LineData[] = readings
            .reduce<LineData[]>((acc, reading) => {
                const value = reading[dataKey];
                if (typeof value !== "number" || !Number.isFinite(value)) return acc;
                const unixTime = Math.floor(reading.ts);
                if (!Number.isFinite(unixTime) || seen.has(unixTime)) return acc;
                seen.add(unixTime);
                acc.push({ time: unixTime as UTCTimestamp, value });
                return acc;
            }, [])
            .sort((a, b) => (a.time as number) - (b.time as number));

        if (data.length === 0) return;

        seriesRef.current.setData(data);

        // Filter vertical lines to those within the data window
        const first = data[0].time as number;
        const last  = data[data.length - 1].time as number;
        const vlines: VLine[] = (verticalLines ?? [])
            .map(l => ({ ts: Math.floor(l.ts) as UTCTimestamp, color: l.color, dashed: l.dashed ?? false }))
            .filter(l => (l.ts as number) >= first && (l.ts as number) <= last);
        vertLineRef.current?.setLines(vlines);

        if (interactive) {
            chartRef.current?.timeScale().fitContent();
        } else {
            chartRef.current?.timeScale().scrollToRealTime();
        }
    }, [readings, dataKey, verticalLines]);

    return <div ref={containerRef} className="w-full" aria-label={`Sensor reading graph (${unit})`} />;
}
