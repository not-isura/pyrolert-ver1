"use client";

import { useSensor } from "@/components/SSEProvider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MiniGraphProps {
  label: string;
  dataKey: string;
  color: string;
  unit: string;
  domain: [number, number];
  data: any[];
}

function MiniGraph({ label, dataKey, color, unit, domain, data }: MiniGraphProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">
        {label}
        <span className="text-gray-400 font-normal ml-1">({unit})</span>
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" hide />
          <YAxis domain={domain} tick={{ fontSize: 9 }} width={28} />
          <Tooltip
            contentStyle={{ fontSize: "11px" }}
            labelFormatter={(label) => `Time: ${label}`}
            formatter={(value: any) => [`${value} ${unit}`, label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SensorGraph() {
  const { data, connected } = useSensor();

  if (!connected) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-gray-400 text-center text-sm">
          ⏳ Waiting for connection...
        </p>
      </div>
    );
  }

  if (!data || data.warming_up) {
    return (
      <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-gray-400 text-center text-sm">
          📊 Graph will appear once 100 readings are collected...
        </p>
      </div>
    );
  }

  const chartData = data.readings.map((r) => ({
    time: r.timestamp.split("T")[1],
    gas1: r.gas1,
    gas2: r.gas2,
    gas3: r.gas3,
    temperature: r.temperature,
    pm: r.pm,
  }));

  return (
    <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-3">
        📊 Sensor Readings — Last 100 Seconds
      </h2>

      {/* Row 1 — Gas Sensors */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <MiniGraph
          label="Gas Sensor 1"
          dataKey="gas1"
          color="#ef4444"
          unit="ppm"
          domain={[0, 1]}
          data={chartData}
        />
        <MiniGraph
          label="Gas Sensor 2"
          dataKey="gas2"
          color="#f97316"
          unit="ppm"
          domain={[0, 1]}
          data={chartData}
        />
        <MiniGraph
          label="Gas Sensor 3"
          dataKey="gas3"
          color="#eab308"
          unit="ppm"
          domain={[0, 1]}
          data={chartData}
        />
      </div>

      {/* Row 2 — PM and Temperature */}
      <div className="grid grid-cols-2 gap-3">
        <MiniGraph
          label="PM Sensor"
          dataKey="pm"
          color="#8b5cf6"
          unit="μg/m³"
          domain={[0, 30]}
          data={chartData}
        />
        <MiniGraph
          label="Temperature"
          dataKey="temperature"
          color="#3b82f6"
          unit="°C"
          domain={[0, 100]}
          data={chartData}
        />
      </div>
    </div>
  );
}