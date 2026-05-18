"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { useAlertLogs, AlertEpisodeLog, LOGS_PAGE_SIZE } from "@/hooks/useAlertLogs";
import { useAlertLogDetail } from "@/hooks/useAlertLogDetail";
import HeadcountCarousel from "@/components/HeadcountCarousel";
import SensorReadingGraph from "@/components/SensorReadingGraph";
import type { SensorReading, VerticalLineSpec } from "@/components/SensorReadingGraph";
import type { IChartApi } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, HelpCircle, Loader2, X } from "lucide-react";

// ── Sensor config (mirrors MonitoringDashboard) ──────────────────────────────

type SensorDisplayData = {
    name: string;
    dataKey: keyof SensorReading;
    color: string;
    unit: string;
    minVal: number;
    maxVal: number;
};

const STATIC_SENSORS: SensorDisplayData[] = [
    { name: "CO", dataKey: "gas_co", color: "#ef4444", unit: "ppm", minVal: 0, maxVal: 100 },
    { name: "NO2", dataKey: "gas_no2", color: "#f97316", unit: "ppm", minVal: 0, maxVal: 5 },
    { name: "PM2.5", dataKey: "pm25", color: "#8b5cf6", unit: "ug/m3", minVal: 0, maxVal: 50 },
    { name: "O2", dataKey: "gas_o2", color: "#22c55e", unit: "%", minVal: 10, maxVal: 25 },
    { name: "Temperature", dataKey: "temp_c", color: "#3b82f6", unit: "C", minVal: 20, maxVal: 70 },
    { name: "Temp RoC", dataKey: "temp_roc", color: "#06b6d4", unit: "C/min", minVal: -2, maxVal: 10 },
];

type StatusLevel = "normal" | "warning" | "high_alert";

const getSensorThreshold = (sensorName: string, status: StatusLevel): number | undefined => {
    if (status !== "warning" && status !== "high_alert") return undefined;
    switch (sensorName) {
        case "CO": return status === "high_alert" ? 60 : 25;
        case "NO2": return status === "high_alert" ? 1 : 0.2;
        case "PM2.5": return status === "high_alert" ? 150 : 90;
        case "O2": return status === "high_alert" ? 18 : 19;
        case "Temperature": return 57.2;
        case "Temp RoC": return 8;
        default: return undefined;
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatTs = (ts: number) => {
    const d = new Date(ts * 1000);
    return (
        d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    );
};

const formatTime = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

const formatIso = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return (
        d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    );
};

const stateLabel = (state: string) => {
    const s = state.trim().toLowerCase().replace(/\s+/g, "_");
    if (s === "high_alert") return "High Alert";
    if (s === "warning") return "Warning";
    return state;
};

const stateColor = (state: string): string => {
    const s = state.trim().toLowerCase().replace(/\s+/g, "_");
    if (s === "high_alert") return "#dc2626";
    if (s === "warning") return "#d97706";
    return "#6b7280";
};

// ── Resolution Banner ─────────────────────────────────────────────────────────

function ResolutionBanner({ episode }: { episode: AlertEpisodeLog }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 mb-3">
            <button
                className="flex items-center gap-3 w-full group"
                onClick={() => setOpen(v => !v)}
            >
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Resolution and Message Report
                </span>
                <div className="flex-1" />
                {open
                    ? <ChevronUp className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-700" />
                    : <ChevronDown className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-700" />
                }
            </button>

            {open && (
                <div className="flex gap-6 mt-2">
                    {/* Col 1: status + resolution metadata */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-amber-600 w-20 shrink-0">Status</span>
                            <span className={`font-bold ${episode.status === "resolved" ? "text-green-600" : "text-gray-500"}`}>
                                {episode.status === "resolved" ? "Resolved" : "False Alarm"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-amber-600 w-20 shrink-0">Resolved By</span>
                            <span className="font-medium text-amber-900">{episode.resolved_by ?? "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-amber-600 w-20 shrink-0">Resolved At</span>
                            <span className="font-medium text-amber-900">
                                {episode.rpi_acknowledged_at ? new Date(episode.rpi_acknowledged_at).toLocaleString() : "—"}
                            </span>
                        </div>
                    </div>

                    <div className="w-px self-stretch bg-amber-200 shrink-0" />

                    {/* Col 2: message */}
                    <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-xs text-amber-600">Remarks</span>
                        {episode.resolution_message ? (
                            <p className="text-xs text-amber-800 leading-relaxed">{episode.resolution_message}</p>
                        ) : (
                            <p className="text-xs text-amber-400 italic">No message provided.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

type Tab = "overview" | "snapshots";

function DetailModal({
    episode,
    onClose,
}: {
    episode: AlertEpisodeLog;
    onClose: () => void;
}) {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [beforeVal, setBeforeVal] = useState(30);
    const [beforeUnit, setBeforeUnit] = useState<"s" | "min">("s");
    const [afterVal, setAfterVal] = useState(30);
    const [afterUnit, setAfterUnit] = useState<"s" | "min">("s");

    // Committed values — only update when user clicks Apply
    const [committedBefore, setCommittedBefore] = useState(30);
    const [committedAfter, setCommittedAfter] = useState(30);

    const applyRange = () => {
        setCommittedBefore(beforeVal * (beforeUnit === "min" ? 60 : 1));
        setCommittedAfter(afterVal * (afterUnit === "min" ? 60 : 1));
    };

    const chartsRef = useRef<IChartApi[]>([]);
    const isSyncingRef = useRef(false);

    const handleChartCreated = useCallback((chart: IChartApi) => {
        chartsRef.current.push(chart);
        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (isSyncingRef.current || !range) return;
            isSyncingRef.current = true;
            chartsRef.current.forEach((c) => {
                if (c !== chart) c.timeScale().setVisibleLogicalRange(range);
            });
            isSyncingRef.current = false;
        });
    }, []);

    const handleChartRemoved = useCallback((chart: IChartApi) => {
        chartsRef.current = chartsRef.current.filter((c) => c !== chart);
    }, []);

    const { transitions, readings, headcountLogs, loading, readingsLoading } = useAlertLogDetail(episode, committedBefore, committedAfter);

    const episodeState = episode.current_state.trim().toLowerCase().replace(/\s+/g, "_") as StatusLevel;

    const verticalLines = useMemo((): VerticalLineSpec[] => {
        const lines: VerticalLineSpec[] = [];
        lines.push({ ts: episode.started_ts, color: "#ef4444", dashed: false });
        for (const t of transitions) {
            const s = t.state.trim().toLowerCase().replace(/\s+/g, "_");
            if (s === "high_alert") lines.push({ ts: t.ts, color: "#f97316", dashed: true });
        }
        if (episode.last_updated_ts !== episode.started_ts) {
            lines.push({ ts: episode.last_updated_ts, color: "#94a3b8", dashed: false });
        }
        return lines;
    }, [episode.started_ts, episode.last_updated_ts, transitions]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        >
            <div
                className="w-full max-w-5xl bg-white rounded-lg shadow-lg flex flex-col overflow-hidden"
                style={{ height: "calc(100vh - 2rem)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="px-6 pt-4 pb-0 border-b shrink-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-4 mb-0">
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-brand-blue">Alert Episode Report</span>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full h-6 w-6 text-muted-foreground hover:text-brand-blue" aria-label="Graph guide">
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Graph Guide</DialogTitle>
                                        <DialogDescription>Reference for vertical and horizontal lines shown in sensor graphs.</DialogDescription>
                                    </DialogHeader>

                                    {/* Vertical lines */}
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-2">Vertical Lines</p>
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-1.5 pr-4 text-xs font-semibold text-muted-foreground w-24">Line</th>
                                                <th className="text-left py-1.5 pr-4 text-xs font-semibold text-muted-foreground w-28">Style</th>
                                                <th className="text-left py-1.5 text-xs font-semibold text-muted-foreground">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: "Alert Start", color: "#ef4444", dashed: false, desc: "Marks triggered_at — the moment the alert episode began." },
                                                { label: "Transition", color: "#f97316", dashed: true, desc: "Marks when the alert escalated from Warning to High Alert." },
                                                { label: "Last Active", color: "#94a3b8", dashed: false, desc: "Marks last_updated_ts — the last recorded update of the active episode." },
                                            ].map(({ label, color, dashed, desc }) => (
                                                <tr key={label} className="border-b border-gray-50">
                                                    <td className="py-2 pr-4 text-xs font-medium">{label}</td>
                                                    <td className="py-2 pr-4">
                                                        <svg width="60" height="14" aria-hidden="true">
                                                            <line x1="0" y1="7" x2="60" y2="7" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 3" : undefined} />
                                                        </svg>
                                                    </td>
                                                    <td className="py-2 text-xs text-muted-foreground">{desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="border-t border-gray-100 my-2" />

                                    {/* Horizontal line */}
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Horizontal Line</p>
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-1.5 pr-4 text-xs font-semibold text-muted-foreground w-24">Line</th>
                                                <th className="text-left py-1.5 pr-4 text-xs font-semibold text-muted-foreground w-28">Style</th>
                                                <th className="text-left py-1.5 text-xs font-semibold text-muted-foreground">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-50">
                                                <td className="py-2 pr-4 text-xs font-medium">Threshold</td>
                                                <td className="py-2 pr-4">
                                                    <svg width="60" height="14" aria-hidden="true">
                                                        <line x1="0" y1="7" x2="60" y2="7" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" />
                                                    </svg>
                                                </td>
                                                <td className="py-2 text-xs text-muted-foreground">
                                                    The alert threshold for this sensor. For Warning status, shows the warning threshold; for High Alert, shows the critical threshold. Temperature and Temp RoC always show the High Alert threshold.
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Status + history block */}
                    <div className="flex items-start gap-6 mb-4">
                        {/* Left: status + timestamps */}
                        <div className="shrink-0 flex flex-col gap-1.5">
                            {[
                                {
                                    label: "Last Status",
                                    content: (
                                        <span className="text-xs font-bold" style={{ color: stateColor(episode.current_state) }}>
                                            {stateLabel(episode.current_state).toUpperCase()}
                                        </span>
                                    ),
                                },
                                {
                                    label: "Triggered At",
                                    content: <span className="text-xs">{formatTs(episode.started_ts)}</span>,
                                },
                                {
                                    label: "Last Triggered At",
                                    content: <span className="text-xs">{formatTs(episode.last_updated_ts)}</span>,
                                },
                            ].map(({ label, content }) => (
                                <div key={label} className="flex items-center gap-3 text-xs">
                                    <span className="text-muted-foreground w-32 shrink-0">{label}</span>
                                    {content}
                                </div>
                            ))}
                        </div>

                        <div className="w-px self-stretch bg-gray-200 shrink-0" />

                        {/* Right: alert state history */}
                        <div className="shrink-0 flex flex-col gap-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Alert State History
                            </p>
                            <div className="space-y-1 overflow-y-auto max-h-20">
                                {transitions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No transitions recorded.</p>
                                ) : [...transitions].reverse().map((t) => (
                                    <div key={t.id} className="flex items-center gap-3 text-xs">
                                        <span className="text-muted-foreground w-24 shrink-0">{formatTime(t.ts)}</span>
                                        <span className="font-medium" style={{ color: stateColor(t.state) }}>
                                            {stateLabel(t.state)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Resolution and Message Report banner */}
                    <ResolutionBanner episode={episode} />

                    {/* Tab bar */}
                    <div className="flex gap-1 border-b -mb-px">
                        {(["overview", "snapshots"] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab === "overview" ? "Overview" : `Camera Snapshots${headcountLogs.length > 0 ? ` (${headcountLogs.length})` : ""}`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab content ── */}
                <div className="flex-1 overflow-hidden">

                    {/* Overview tab */}
                    {activeTab === "overview" && (
                        <div className="h-full overflow-y-auto px-6 py-4 flex flex-col gap-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <>
                                    {/* Sensor graphs */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Sensor Readings
                                                </p>
                                                {readingsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="shrink-0">Range:</span>
                                                {/* Before control */}
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={beforeVal}
                                                        onChange={(e) => setBeforeVal(Math.min(beforeUnit === "min" ? 120 : 7200, Math.max(0, Number(e.target.value))))}
                                                        className="w-14 h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={() => setBeforeUnit(u => {
                                                            const next = u === "s" ? "min" : "s";
                                                            setBeforeVal(v => Math.min(v, next === "min" ? 120 : 7200));
                                                            return next;
                                                        })}
                                                        className="h-7 px-2 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                                    >
                                                        {beforeUnit}
                                                    </button>
                                                    <span className="text-gray-400">before</span>
                                                </div>
                                                <span className="text-gray-300">·</span>
                                                {/* After control */}
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        value={afterVal}
                                                        onChange={(e) => setAfterVal(Math.min(afterUnit === "min" ? 120 : 7200, Math.max(0, Number(e.target.value))))}
                                                        className="w-14 h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        onClick={() => setAfterUnit(u => {
                                                            const next = u === "s" ? "min" : "s";
                                                            setAfterVal(v => Math.min(v, next === "min" ? 120 : 7200));
                                                            return next;
                                                        })}
                                                        className="h-7 px-2 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                                                    >
                                                        {afterUnit}
                                                    </button>
                                                    <span className="text-gray-400">after</span>
                                                </div>
                                                <button
                                                    onClick={applyRange}
                                                    className="h-7 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                        {readingsLoading ? (
                                            <div className="flex items-center justify-center h-40">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : readings.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No readings found for this episode window.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {STATIC_SENSORS.map((sensor) => {
                                                    const threshold = getSensorThreshold(sensor.name, episodeState);
                                                    return (
                                                        <div key={sensor.name} className="rounded-md border border-gray-200 p-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="text-xs font-semibold text-gray-700">
                                                                    {sensor.name}
                                                                    <span className="text-gray-400 font-normal ml-1">({sensor.unit})</span>
                                                                </p>
                                                                {threshold !== undefined && (
                                                                    <p className="text-[10px] text-amber-600 font-medium">
                                                                        threshold: {threshold} {sensor.unit}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <SensorReadingGraph
                                                                dataKey={sensor.dataKey}
                                                                color={sensor.color}
                                                                unit={sensor.unit}
                                                                minVal={sensor.minVal}
                                                                maxVal={sensor.maxVal}
                                                                height={120}
                                                                readings={readings}
                                                                verticalLines={verticalLines}
                                                                thresholdValue={threshold}
                                                                interactive
                                                                onChartCreated={handleChartCreated}
                                                                onChartRemoved={handleChartRemoved}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Snapshots tab */}
                    {activeTab === "snapshots" && (
                        loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <HeadcountCarousel
                                allLogs={headcountLogs}
                                showRequestCapture={false}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlertLogsPage() {
    const { episodes, totalCount, totalPages, page, setPage, loading } = useAlertLogs();
    const [selected, setSelected] = useState<AlertEpisodeLog | null>(null);

    return (
        <PageLayout>
            <div className="space-y-4">
                {/* Page header */}
                <div>
                    <h1 className="text-xl font-bold text-brand-red">Alert Episode Logs</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {totalCount} closed episode{totalCount !== 1 ? "s" : ""} · resolved and false alarms
                    </p>
                </div>

                {/* Table */}
                <div className="rounded-xl border overflow-hidden bg-white">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3 text-left w-10">#</th>
                                <th className="px-4 py-3 text-left">Time</th>
                                <th className="px-4 py-3 text-center">State</th>
                                <th className="px-4 py-3 text-center">Conclusion</th>
                                <th className="px-4 py-3 text-left">Resolved By</th>
                                <th className="px-4 py-3 text-left">Resolution Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin inline-block" />
                                    </td>
                                </tr>
                            ) : episodes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                        No closed episodes yet.
                                    </td>
                                </tr>
                            ) : episodes.map((ep, idx) => {
                                const displayNum = page * LOGS_PAGE_SIZE + idx + 1;
                                const isHighAlert = ep.current_state.trim().toLowerCase().replace(/\s+/g, "_") === "high_alert";
                                const isResolved = ep.status === "resolved";

                                return (
                                    <tr
                                        key={ep.id}
                                        onClick={() => setSelected(ep)}
                                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-4 py-3 text-gray-400 text-xs">{displayNum}</td>
                                        <td className="px-4 py-3 text-gray-700 text-xs">
                                            <span className="font-medium">{formatTs(ep.started_ts)}</span>
                                            <span className="text-gray-400 mx-1">→</span>
                                            <span>{formatTs(ep.last_updated_ts)}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border"
                                                style={{
                                                    color: isHighAlert ? "#dc2626" : "#d97706",
                                                    borderColor: isHighAlert ? "#fca5a5" : "#fcd34d",
                                                    backgroundColor: isHighAlert ? "#fef2f2" : "#fffbeb",
                                                }}
                                            >
                                                {isHighAlert ? "High Alert" : "Warning"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border"
                                                style={{
                                                    color: isResolved ? "#16a34a" : "#6b7280",
                                                    borderColor: isResolved ? "#bbf7d0" : "#e5e7eb",
                                                    backgroundColor: isResolved ? "#f0fdf4" : "#f9fafb",
                                                }}
                                            >
                                                {isResolved ? "Resolved" : "False Alarm"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">{ep.resolved_by ?? "—"}</td>
                                        <td className="px-4 py-3 text-gray-600 text-xs">
                                            {formatIso(ep.rpi_acknowledged_at)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Page {page + 1} of {totalPages} · {totalCount} total
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {selected && (
                <DetailModal
                    episode={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </PageLayout>
    );
}
