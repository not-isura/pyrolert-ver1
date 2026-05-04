"use client";

import { useEffect, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { SensorStatusBadge, SensorStatusType } from "@/components/SensorStatusBadge";
import { useSensor } from "@/components/SupabaseProvider";
import SensorReadingGraph, { SensorReading } from "@/components/SensorReadingGraph";
import TrendBadge from "@/components/TrendBadge";
import AlertStateHistoryGraph from "@/components/AlertStateHistoryGraph";
import { useAlert } from "@/hooks/useAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertTriangle,
    Archive,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    Pause,
    RotateCcw,
    Users,
    X,
} from "lucide-react";

type StatusLevel = "normal" | "warning" | "high_alert";

type SensorDisplayData = {
    name: string;
    value: string;
    status: SensorStatusType;
    dataKey: keyof SensorReading;
    color: string;
    unit: string;
    minVal: number;
    maxVal: number;
};

const STATIC_ROOM_NAME = "Testing Room";

const getHigherIsWorseStatus = (value: number, highAlert: number, warning: number): SensorStatusType => {
    if (value >= highAlert) return "high_alert";
    if (value >= warning) return "warning";
    return "normal";
};

const getLowerIsWorseStatus = (value: number, highAlert: number, warning: number): SensorStatusType => {
    if (value < highAlert) return "high_alert";
    if (value < warning) return "warning";
    return "normal";
};

const getHighAlertOnlyStatus = (value: number, highAlert: number, strictGreater = false): SensorStatusType => {
    if (strictGreater ? value > highAlert : value >= highAlert) return "high_alert";
    return "normal";
};

const STATIC_SENSORS: SensorDisplayData[] = [
    { name: "CO",          value: "", status: "normal", dataKey: "gas_co",  color: "#ef4444", unit: "ppm",   minVal: 0,  maxVal: 100 },
    { name: "NO2",         value: "", status: "normal", dataKey: "gas_no2", color: "#f97316", unit: "ppm",   minVal: 0,  maxVal: 5   },
    { name: "PM2.5",       value: "", status: "normal", dataKey: "pm25",    color: "#8b5cf6", unit: "ug/m3", minVal: 0,  maxVal: 50  },
    { name: "O2",          value: "", status: "normal", dataKey: "gas_o2",  color: "#22c55e", unit: "%",     minVal: 10, maxVal: 25  },
    { name: "Temperature", value: "", status: "normal", dataKey: "temp_c",  color: "#3b82f6", unit: "C",     minVal: 20, maxVal: 70  },
    { name: "Temp RoC",    value: "", status: "normal", dataKey: "temp_c",  color: "#06b6d4", unit: "C/min", minVal: 20, maxVal: 70  },
];

const STATIC_CAMERA_SNAPSHOTS = [
    { id: "snapshot-1", label: "Snapshot 1 - 09:41 AM" },
    { id: "snapshot-2", label: "Snapshot 2 - 09:46 AM" },
    { id: "snapshot-3", label: "Snapshot 3 - 09:51 AM" },
];

const statusConfig: Record<StatusLevel, { color: string; label: string }> = {
    normal:     { color: "hsl(var(--brand-green))", label: "Normal"     },
    warning:    { color: "hsl(var(--brand-orange))", label: "Warning"   },
    high_alert: { color: "hsl(var(--brand-red))",    label: "High Alert" },
};

const alertStatusBadge: Record<string, { label: string; className: string }> = {
    active:      { label: "Active",      className: "text-amber-700 bg-amber-50 border border-amber-200"   },
    resolved:    { label: "Resolved",    className: "text-green-700 bg-green-50 border border-green-200"   },
    false_alarm: { label: "False Alarm", className: "text-gray-600  bg-gray-50  border border-gray-200"    },
    archived:    { label: "Archived",    className: "text-gray-400  bg-gray-50  border border-gray-100"    },
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
};

const describeArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end   = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

export default function MonitoringDashboard() {
    const { readings } = useSensor();
    const { activeAlert, alertHistory, resolveAlert, archiveAlert } = useAlert();

    const displayReadings = readings;
    const latestReading = displayReadings.length > 0 ? displayReadings[displayReadings.length - 1] : null;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen]           = useState(false);
    const touchStartX = useRef(0);
    const touchEndX   = useRef(0);

    // Detection status comes from the confirmed alert — not raw sensor fluctuation.
    // Current Status only shows elevated when the alert is still active.
    const detectionStatus: StatusLevel =
        activeAlert?.status === "active" ? activeAlert.current_level : "normal";

    const currentStatusConfig = statusConfig[detectionStatus];
    const isElevatedStatus    = detectionStatus !== "normal";
    const gaugeNeedleAngle    = detectionStatus === "normal" ? -75 : detectionStatus === "warning" ? 0 : 75;

    // Live sensor values from the latest reading
    const liveValues = {
        co:    typeof latestReading?.gas_co  === "number" ? latestReading.gas_co  : null,
        no2:   typeof latestReading?.gas_no2 === "number" ? latestReading.gas_no2 : null,
        pm25:  typeof latestReading?.pm25    === "number" ? latestReading.pm25    : null,
        o2:    typeof latestReading?.gas_o2  === "number" ? latestReading.gas_o2  : null,
        tempC: typeof latestReading?.temp_c  === "number" ? latestReading.temp_c  : null,
    };

    const highAlertThresholds = [
        { label: "CO",          value: liveValues.co    !== null ? `${liveValues.co.toFixed(3)} ppm`   : "—", threshold: ">= 60 ppm",   triggered: liveValues.co    !== null && liveValues.co    >= 60   },
        { label: "NO2",         value: liveValues.no2   !== null ? `${liveValues.no2.toFixed(3)} ppm`  : "—", threshold: ">= 1 ppm",    triggered: liveValues.no2   !== null && liveValues.no2   >= 1    },
        { label: "PM2.5",       value: liveValues.pm25  !== null ? `${liveValues.pm25.toFixed(0)} ug/m3` : "—", threshold: ">= 150 ug/m3", triggered: liveValues.pm25 !== null && liveValues.pm25  >= 150  },
        { label: "O2",          value: liveValues.o2    !== null ? `${liveValues.o2.toFixed(2)} %`     : "—", threshold: "< 18 %",      triggered: liveValues.o2    !== null && liveValues.o2    < 18    },
        { label: "Temperature", value: liveValues.tempC !== null ? `${liveValues.tempC.toFixed(2)} C`  : "—", threshold: "> 57.2 C",    triggered: liveValues.tempC !== null && liveValues.tempC > 57.2  },
        { label: "Temp RoC",    value: "+0.00 C/min",                                                         threshold: ">= 8 C/min",  triggered: false                                                  },
    ];

    const warningThresholds = [
        { label: "CO",          value: liveValues.co    !== null ? `${liveValues.co.toFixed(3)} ppm`   : "—", threshold: ">= 25 ppm",  triggered: liveValues.co    !== null && liveValues.co    >= 25   },
        { label: "NO2",         value: liveValues.no2   !== null ? `${liveValues.no2.toFixed(3)} ppm`  : "—", threshold: ">= 0.2 ppm", triggered: liveValues.no2   !== null && liveValues.no2   >= 0.2  },
        { label: "PM2.5",       value: liveValues.pm25  !== null ? `${liveValues.pm25.toFixed(0)} ug/m3` : "—", threshold: ">= 90 ug/m3", triggered: liveValues.pm25 !== null && liveValues.pm25 >= 90   },
        { label: "O2",          value: liveValues.o2    !== null ? `${liveValues.o2.toFixed(2)} %`     : "—", threshold: "< 19 %",     triggered: liveValues.o2    !== null && liveValues.o2    < 19    },
        { label: "Temperature", value: liveValues.tempC !== null ? `${liveValues.tempC.toFixed(2)} C`  : "—", threshold: "> 57.2 C",   triggered: liveValues.tempC !== null && liveValues.tempC > 57.2  },
        { label: "Temp RoC",    value: "+0.00 C/min",                                                         threshold: ">= 8 C/min", triggered: false                                                  },
    ];

    const triggerItems =
        detectionStatus === "high_alert" ? highAlertThresholds :
        detectionStatus === "warning"    ? warningThresholds   :
        warningThresholds.map((t) => ({ ...t, triggered: false }));

    const formatLastUpdated = (reading: SensorReading | null) => {
        if (!reading) return "—";
        if (reading.recorded_at) return new Date(reading.recorded_at).toLocaleString();
        if (reading.created_at)  return new Date(reading.created_at).toLocaleString();
        if (typeof reading.ts === "number") return new Date(reading.ts * 1000).toLocaleString();
        return "—";
    };

    const lastUpdatedLabel = formatLastUpdated(latestReading);

    const tempRocReadings = displayReadings.map((reading) => ({ ...reading, temp_c: 0 }));

    const formatSensorValue = (sensor: SensorDisplayData, reading: SensorReading | null) => {
        if (sensor.name === "Temp RoC") return "0.00";
        if (!reading) return "—";
        const rawValue = reading[sensor.dataKey];
        if (typeof rawValue !== "number") return "—";
        if (sensor.name === "PM2.5" || sensor.name === "CO" || sensor.name === "NO2") return rawValue.toFixed(3);
        return rawValue.toFixed(2);
    };

    const getLiveStatus = (sensor: SensorDisplayData, reading: SensorReading | null): SensorStatusType => {
        if (sensor.name === "Temp RoC") return "normal";
        if (!reading) return "normal";
        const rawValue = reading[sensor.dataKey];
        if (typeof rawValue !== "number") return "normal";
        switch (sensor.name) {
            case "CO":          return getHigherIsWorseStatus(rawValue, 60, 25);
            case "NO2":         return getHigherIsWorseStatus(rawValue, 1, 0.2);
            case "PM2.5":       return getHigherIsWorseStatus(rawValue, 150, 90);
            case "O2":          return getLowerIsWorseStatus(rawValue, 18, 19);
            case "Temperature": return getHighAlertOnlyStatus(rawValue, 57.2, true);
            default:            return "normal";
        }
    };

    useEffect(() => {
        return () => {
            document.documentElement.style.overflow  = "";
            document.documentElement.style.position  = "";
            document.documentElement.style.width     = "";
            document.documentElement.style.height    = "";
            document.body.style.overflow  = "";
            document.body.style.position  = "";
            document.body.style.top       = "";
            document.body.style.left      = "";
            document.body.style.right     = "";
            document.body.style.width     = "";
            document.body.style.height    = "";
        };
    }, []);

    useEffect(() => {
        if (!isFullscreen) return;
        const preventScroll = (e: TouchEvent) => {
            if (!(e.target as HTMLElement).closest("[data-swipeable='true']")) e.preventDefault();
        };
        const preventGesture = (e: Event) => e.preventDefault();
        document.addEventListener("touchmove",     preventScroll,  { passive: false });
        document.addEventListener("gesturestart",  preventGesture, { passive: false });
        document.addEventListener("gesturechange", preventGesture, { passive: false });
        document.addEventListener("gestureend",    preventGesture, { passive: false });
        return () => {
            document.removeEventListener("touchmove",     preventScroll);
            document.removeEventListener("gesturestart",  preventGesture);
            document.removeEventListener("gesturechange", preventGesture);
            document.removeEventListener("gestureend",    preventGesture);
        };
    }, [isFullscreen]);

    const handlePrevImage = () =>
        setCurrentImageIndex((prev) => prev === 0 ? STATIC_CAMERA_SNAPSHOTS.length - 1 : prev - 1);

    const handleNextImage = () =>
        setCurrentImageIndex((prev) => prev === STATIC_CAMERA_SNAPSHOTS.length - 1 ? 0 : prev + 1);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchMove  = (e: React.TouchEvent) => { touchEndX.current   = e.touches[0].clientX; };
    const handleTouchEnd   = () => {
        if (touchStartX.current - touchEndX.current > 50)  handleNextImage();
        if (touchStartX.current - touchEndX.current < -50) handlePrevImage();
    };

    const openFullscreen = () => {
        setIsFullscreen(true);
        const scrollY = window.scrollY;
        document.documentElement.style.overflow  = "hidden";
        document.documentElement.style.position  = "fixed";
        document.documentElement.style.width     = "100%";
        document.documentElement.style.height    = "100%";
        document.body.style.overflow  = "hidden";
        document.body.style.position  = "fixed";
        document.body.style.top       = `-${scrollY}px`;
        document.body.style.left      = "0";
        document.body.style.right     = "0";
        document.body.style.width     = "100%";
        document.body.style.height    = "100%";
    };

    const closeFullscreen = () => {
        setIsFullscreen(false);
        const scrollY = document.body.style.top;
        document.documentElement.style.overflow  = "";
        document.documentElement.style.position  = "";
        document.documentElement.style.width     = "";
        document.documentElement.style.height    = "";
        document.body.style.overflow  = "";
        document.body.style.position  = "";
        document.body.style.top       = "";
        document.body.style.left      = "";
        document.body.style.right     = "";
        document.body.style.width     = "";
        document.body.style.height    = "";
        window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
    };

    return (
        <PageLayout>
            <div className="max-w-[1920px] mx-auto space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-blue">{STATIC_ROOM_NAME}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Last updated: {lastUpdatedLabel}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* ── Current Status Card ─────────────────────────────────────── */}
                    <Card className="lg:col-span-1 h-full flex flex-col" style={{ minHeight: 0 }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-brand-blue">Current Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                            <svg viewBox="0 0 260 135" className="w-full" aria-label="Detection status gauge">
                                <path d={describeArc(130, 108, 95, -90, -30)} stroke="#22c55e" strokeWidth="18" fill="none" strokeLinecap="round" />
                                <path d={describeArc(130, 108, 95, -30,  30)} stroke="#f59e0b" strokeWidth="18" fill="none" strokeLinecap="round" />
                                <path d={describeArc(130, 108, 95,  30,  90)} stroke="#ef4444" strokeWidth="18" fill="none" strokeLinecap="round" />
                                <g
                                    className="transition-transform duration-700 ease-in-out"
                                    style={{ transform: `rotate(${gaugeNeedleAngle}deg)`, transformOrigin: "130px 108px" }}
                                >
                                    <path d="M 130 54 L 120 108 L 140 108 Z" fill="#000000" />
                                </g>
                                <circle cx="130" cy="108" r="10" fill="#000000" />
                                <circle cx="130" cy="108" r="5"  fill="hsl(var(--card))" />
                            </svg>
                            <p
                                className={`text-3xl font-bold ${isElevatedStatus ? "motion-safe:animate-pulse" : ""}`}
                                style={{ color: currentStatusConfig.color }}
                            >
                                {currentStatusConfig.label.toUpperCase()}
                            </p>
                        </CardContent>
                    </Card>

                    {/* ── Trigger Information Card ─────────────────────────────────── */}
                    <Card className={`${isElevatedStatus ? "border-amber-200" : "border-gray-200"} lg:col-span-1 h-full flex flex-col`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-brand-blue">Trigger Information</CardTitle>
                        </CardHeader>

                        {!activeAlert ? (
                            <CardContent className="flex flex-1 items-center justify-center">
                                <p className="text-sm text-muted-foreground">No active alerts.</p>
                            </CardContent>
                        ) : (
                            <CardContent className="flex flex-col gap-4">
                                {/* Metadata row */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Triggered At</p>
                                        <p className="text-sm font-semibold text-brand-blue">
                                            {new Date(activeAlert.triggered_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Last Updated</p>
                                        <p className="text-sm font-semibold text-brand-blue">
                                            {new Date(activeAlert.last_updated).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Status</p>
                                        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${alertStatusBadge[activeAlert.status]?.className ?? ""}`}>
                                            {alertStatusBadge[activeAlert.status]?.label ?? activeAlert.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="grid grid-cols-1 gap-2">
                                    {/* View Report — combines sensor trigger info + state history */}
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                View Report
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Alert Report</DialogTitle>
                                                <DialogDescription>
                                                    Episode started {new Date(activeAlert.triggered_at).toLocaleString()}.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-2">
                                                Sensor Trigger Information
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {triggerItems.map((trigger) => (
                                                    <div
                                                        key={trigger.label}
                                                        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
                                                            trigger.triggered ? "border-amber-200 bg-amber-50" : "border-gray-200"
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-brand-blue">{trigger.label}</p>
                                                            <p className="text-xs text-muted-foreground">Threshold: {trigger.threshold}</p>
                                                        </div>
                                                        <p className="text-sm font-semibold" style={{ color: currentStatusConfig.color }}>
                                                            {trigger.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t border-gray-100 my-2" />

                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Alert State History
                                            </p>
                                            <AlertStateHistoryGraph history={alertHistory} />
                                            <div className="mt-2 space-y-1">
                                                {alertHistory.map((entry) => (
                                                    <div key={entry.id} className="flex items-center gap-3 text-sm">
                                                        <span className="text-muted-foreground w-44 shrink-0">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </span>
                                                        <span
                                                            className="font-semibold"
                                                            style={{ color: statusConfig[entry.state].color }}
                                                        >
                                                            {statusConfig[entry.state].label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    {/* Resolution buttons */}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={activeAlert.status !== "active"}
                                        onClick={() => resolveAlert(activeAlert.id, "resolved")}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Resolved
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={activeAlert.status !== "active"}
                                        onClick={() => resolveAlert(activeAlert.id, "false_alarm")}
                                    >
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Mark as False Alarm
                                    </Button>
                                </div>

                                {/* Archive — only shown once resolved/false alarm */}
                                {activeAlert.status !== "active" && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-gray-500"
                                        onClick={() => archiveAlert(activeAlert.id)}
                                    >
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive &amp; Close
                                    </Button>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* ── Camera Snapshots ─────────────────────────────────────────── */}
                    <Card className="lg:col-span-2 h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-brand-blue">Camera Snapshots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-[160px_1fr] gap-4 items-center">
                                {/* Left: Headcount */}
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Headcount</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-brand-blue">18</span>
                                    </div>
                                    <TrendBadge value={2} />
                                    <p className="text-xs text-muted-foreground mt-1">vs. 30 min ago</p>
                                </div>

                                {/* Right: Snapshot carousel */}
                                <div
                                    className="relative cursor-pointer"
                                    onClick={openFullscreen}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors">
                                        <p className="text-xs text-muted-foreground">
                                            {STATIC_CAMERA_SNAPSHOTS[currentImageIndex].label}
                                        </p>
                                    </div>

                                    {STATIC_CAMERA_SNAPSHOTS.length > 1 && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-7 w-7"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-7 w-7"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}

                                    <div className="flex justify-center gap-1.5 mt-2">
                                        {STATIC_CAMERA_SNAPSHOTS.map((snapshot, index) => (
                                            <button
                                                key={snapshot.id}
                                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                                                className="w-1.5 h-1.5 rounded-full transition-all"
                                                style={{ backgroundColor: index === currentImageIndex ? "hsl(var(--brand-blue))" : "#CBD5E1" }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sensor Readings ──────────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold text-brand-blue">Sensor Readings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {STATIC_SENSORS.map((sensor) => (
                                <Card key={sensor.name}>
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm sm:text-base font-semibold text-brand-blue">{sensor.name}</h3>
                                            <p className="text-sm sm:text-base font-semibold text-brand-blue text-right">
                                                {formatSensorValue(sensor, latestReading)}
                                                <span className="text-gray-400 font-medium ml-1">{sensor.unit}</span>
                                            </p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                            <SensorReadingGraph
                                                dataKey={sensor.dataKey}
                                                color={sensor.color}
                                                unit={sensor.unit}
                                                minVal={sensor.minVal}
                                                maxVal={sensor.maxVal}
                                                readings={sensor.name === "Temp RoC" ? tempRocReadings : displayReadings}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <SensorStatusBadge status={getLiveStatus(sensor, latestReading)} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="pt-2">
                    <div className="border-t border-border" />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                        Occupants and Quick Actions
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* ── Occupants ────────────────────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-brand-blue">Occupants</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-baseline gap-2">
                                    <Users className="h-8 w-8 text-brand-blue" />
                                    <span className="text-5xl font-bold text-brand-blue">18</span>
                                </div>
                                <TrendBadge value={2} />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm text-text-secondary">vs. 30 minutes ago</p>
                                <p className="text-xs text-text-tertiary">Last updated: {lastUpdatedLabel}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Quick Actions ────────────────────────────────────────────── */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-brand-blue">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Monitoring
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restart the System
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="h-4 w-4 mr-2" />
                                Export Event Log
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Fullscreen Camera Overlay ─────────────────────────────────────── */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    style={{ touchAction: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "none" }}
                    onClick={closeFullscreen}
                >
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4"
                        data-swipeable="true"
                        style={{ touchAction: "pan-x", overscrollBehavior: "none" }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e); }}
                        onTouchMove={(e)  => { e.stopPropagation(); handleTouchMove(e);  }}
                        onTouchEnd={(e)   => { e.stopPropagation(); handleTouchEnd();    }}
                    >
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={closeFullscreen}
                            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        <div className="w-full max-w-6xl aspect-video bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-2xl text-muted-foreground">
                                {STATIC_CAMERA_SNAPSHOTS[currentImageIndex].label}
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePrevImage}
                            className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextImage}
                            className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3">
                            {STATIC_CAMERA_SNAPSHOTS.map((snapshot, index) => (
                                <button
                                    key={snapshot.id}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className="w-3 h-3 rounded-full transition-all"
                                    style={{ backgroundColor: index === currentImageIndex ? "#FFFFFF" : "#6B7280" }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
