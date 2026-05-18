"use client";

import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, LineData, LineSeries, UTCTimestamp } from "lightweight-charts";
import { useSensor } from "@/components/SupabaseProvider";

interface MiniChartProps {
  label: string;
  unit: string;
  color: string;
  dataKey: keyof {
    gas_co: number | null;
    gas_no2: number | null;
    gas_o2: number | null;
    temp_c: number | null;
    pm25: number | null;
  };
  minVal: number;
  maxVal: number;
}

function MiniChart({ label, unit, color, dataKey, minVal, maxVal }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const { readings } = useSensor();

  // --- Initialize chart once ---
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 120,
      layout: {
        background: { color: "transparent" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      leftPriceScale: {
        visible: false,
      },
      rightPriceScale: {
        visible: true,
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
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
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: minVal,
          maxValue: maxVal,
        },
      }),
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
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

  // --- Update chart data when readings change ---
  useEffect(() => {
    if (!seriesRef.current || readings.length === 0) return;

    const data: LineData[] = readings
      .filter((r) => r[dataKey] !== null)
      .map((r) => ({
        time: r.ts as UTCTimestamp,
        value: r[dataKey] as number,
      }));

    seriesRef.current.setData(data);
    chartRef.current?.timeScale().scrollToRealTime();
  }, [readings, dataKey]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-semibold text-gray-600">
          {label}
          <span className="text-gray-400 font-normal ml-1">({unit})</span>
        </p>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

export default function SensorGraph() {
  const { isWarming, isOffline, count } = useSensor();

  // Offline state
  if (isOffline) {
    return (
      <div className="w-full bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-400 text-center text-sm">
          ❌ Connection lost — waiting to reconnect...
        </p>
      </div>
    );
  }

  // Warming up state
  if (isWarming) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-gray-400 text-center text-sm">
          📊 Collecting readings... ({count} / 100)
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        📊 Sensor Readings — Last 100 Seconds
      </h2>

      {/* Row 1 — Gas Sensors */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <MiniChart
          label="Gas CO"
          unit="ppm"
          color="#ef4444"
          dataKey="gas_co"
          minVal={0}
          maxVal={100}
        />
        <MiniChart
          label="Gas NO2"
          unit="ppm"
          color="#f97316"
          dataKey="gas_no2"
          minVal={0}
          maxVal={10}
        />
        <MiniChart
          label="Gas O2"
          unit="%"
          color="#eab308"
          dataKey="gas_o2"
          minVal={0}
          maxVal={25}
        />
      </div>

      {/* Row 2 — PM and Temperature */}
      <div className="grid grid-cols-2 gap-3">
        <MiniChart
          label="PM 2.5"
          unit="μg/m³"
          color="#8b5cf6"
          dataKey="pm25"
          minVal={0}
          maxVal={50}
        />
        <MiniChart
          label="Temperature"
          unit="°C"
          color="#3b82f6"
          dataKey="temp_c"
          minVal={0}
          maxVal={100}
        />
      </div>
    </div>
  );
}