"use client";

import { useEffect, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { SensorStatusBadge, SensorStatusType } from "@/components/SensorStatusBadge";
import { useSensor } from "@/components/SupabaseProvider";
import SensorReadingGraph, { SensorReading } from "@/components/SensorReadingGraph";
import TrendBadge from "@/components/TrendBadge";
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

type DetectionResultLabel = "Normal" | "Warning" | "High Alert";

const STATIC_DETECTION_RESULT: DetectionResultLabel = "Normal";

const STATIC_SENSOR_VALUES = {
    co: 60,
    no2: 0,
    pm25: 500,
    o2: 17.9,
    tempC: 57.3,
    temp_roc: 0,
};

const MOCK_BASE_TS = Math.floor(Date.now() / 1000) - 95;
const MOCK_READINGS: SensorReading[] = Array.from({ length: 100 }, (_, index) => {
    const ts = MOCK_BASE_TS + index * 5;
    const createdAt = new Date(ts * 1000).toISOString();

    return {
        id: index + 1,
        ts,
        recorded_at: null,
        gas_co: 22 + index * 0.6,
        gas_no2: 0.8 + index * 0.05,
        gas_o2: 20.5 - index * 0.1,
        temp_c: 48 + index * 0.6,
        pm25: 70 + index * 4.2,
        detection_result: null,
        created_at: createdAt,
    };
});

const getHigherIsWorseStatus = (value: number, highAlert: number, warning: number): SensorStatusType => {
    if (value >= highAlert) {
        return "high_alert";
    }

    if (value >= warning) {
        return "warning";
    }

    return "normal";
};

const getLowerIsWorseStatus = (value: number, highAlert: number, warning: number): SensorStatusType => {
    if (value < highAlert) {
        return "high_alert";
    }

    if (value < warning) {
        return "warning";
    }

    return "normal";
};

const getHighAlertOnlyStatus = (value: number, highAlert: number, strictGreater = false): SensorStatusType => {
    if (strictGreater ? value > highAlert : value >= highAlert) {
        return "high_alert";
    }

    return "normal";
};

const tempRoc = STATIC_SENSOR_VALUES.temp_roc;

const STATIC_SENSORS: SensorDisplayData[] = [
    {
        name: "CO",
        value: `${STATIC_SENSOR_VALUES.co.toFixed(2)}`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.co, 60, 25),
        dataKey: "gas_co",
        color: "#ef4444",
        unit: "ppm",
        minVal: 0,
        maxVal: 100,
    },
    {
        name: "NO2",
        value: `${STATIC_SENSOR_VALUES.no2.toFixed(2)}`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.no2, 1, 0.2),
        dataKey: "gas_no2",
        color: "#f97316",
        unit: "ppm",
        minVal: 0,
        maxVal: 5,
    },
    {
        name: "PM2.5",
        value: `${STATIC_SENSOR_VALUES.pm25.toFixed()}`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.pm25, 150, 90),
        dataKey: "pm25",
        color: "#8b5cf6",
        unit: "ug/m3",
        minVal: 0,
        maxVal: 50,
    },
    {
        name: "O2",
        value: `${STATIC_SENSOR_VALUES.o2.toFixed(2)}`,
        status: getLowerIsWorseStatus(STATIC_SENSOR_VALUES.o2, 18, 19),
        dataKey: "gas_o2",
        color: "#22c55e",
        unit: "%",
        minVal: 10,
        maxVal: 25,
    },
    {
        name: "Temperature",
        value: `${STATIC_SENSOR_VALUES.tempC.toFixed(2)}`,
        status: getHighAlertOnlyStatus(STATIC_SENSOR_VALUES.tempC, 57.2, true),
        dataKey: "temp_c",
        color: "#3b82f6",
        unit: "C",
        minVal: 20,
        maxVal: 70,
    },
    {
        name: "Temp RoC",
        value: `${tempRoc >= 0 ? "+" : ""}${tempRoc.toFixed(2)}`,
        status: getHighAlertOnlyStatus(tempRoc, 8),
        dataKey: "temp_c",
        color: "#06b6d4",
        unit: "C/min",
        minVal: 20,
        maxVal: 70,
    },
];

const STATIC_CAMERA_SNAPSHOTS = [
    { id: "snapshot-1", label: "Snapshot 1 - 09:41 AM" },
    { id: "snapshot-2", label: "Snapshot 2 - 09:46 AM" },
    { id: "snapshot-3", label: "Snapshot 3 - 09:51 AM" },
];

const statusConfig: Record<StatusLevel, { color: string; label: string }> = {
    normal: { color: "hsl(var(--brand-green))", label: "Normal" },
    warning: { color: "hsl(var(--brand-orange))", label: "Warning" },
    high_alert: { color: "hsl(var(--brand-red))", label: "High Alert" },
};

const detectionResultToStatus: Record<DetectionResultLabel, StatusLevel> = {
    Normal: "normal",
    Warning: "warning",
    "High Alert": "high_alert",
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number,
) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};


export default function MonitoringDashboard() {
    const { readings } = useSensor();
    const displayReadings = readings;
    const latestReading = displayReadings.length > 0 ? displayReadings[displayReadings.length - 1] : null;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const detectionStatus = detectionResultToStatus[STATIC_DETECTION_RESULT];
    const currentStatusConfig = statusConfig[detectionStatus];
    const isElevatedStatus = detectionStatus !== "normal";
    const confidenceSampleSize = detectionStatus === "high_alert" ? 20 : detectionStatus === "warning" ? 10 : 0;
    const recentReadings = confidenceSampleSize > 0 ? displayReadings.slice(-confidenceSampleSize) : [];
    const gaugeNeedleAngle = detectionStatus === "normal" ? -75 : detectionStatus === "warning" ? 0 : 75;
    const triggerInfo = detectionStatus === "high_alert"
        ? [
            {
                label: "CO",
                value: `${STATIC_SENSOR_VALUES.co.toFixed(2)} ppm`,
                threshold: ">= 60 ppm",
                triggered: STATIC_SENSOR_VALUES.co >= 60,
            },
            {
                label: "NO2",
                value: `${STATIC_SENSOR_VALUES.no2.toFixed(2)} ppm`,
                threshold: ">= 1 ppm",
                triggered: STATIC_SENSOR_VALUES.no2 >= 1,
            },
            {
                label: "PM2.5",
                value: `${STATIC_SENSOR_VALUES.pm25.toFixed(2)} ug/m3`,
                threshold: ">= 150 ug/m3",
                triggered: STATIC_SENSOR_VALUES.pm25 >= 150,
            },
            {
                label: "O2",
                value: `${STATIC_SENSOR_VALUES.o2.toFixed(2)} %`,
                threshold: "< 18 %",
                triggered: STATIC_SENSOR_VALUES.o2 < 18,
            },
            {
                label: "Temperature",
                value: `${STATIC_SENSOR_VALUES.tempC.toFixed(2)} C`,
                threshold: "> 57.2 C",
                triggered: STATIC_SENSOR_VALUES.tempC > 57.2,
            },
            {
                label: "Temp RoC",
                value: `${tempRoc >= 0 ? "+" : ""}${tempRoc.toFixed(2)} C/min`,
                threshold: ">= 8 C/min",
                triggered: tempRoc >= 8,
            },
        ]
        : detectionStatus === "warning"
            ? [
                {
                    label: "CO",
                    value: `${STATIC_SENSOR_VALUES.co.toFixed(2)} ppm`,
                    threshold: ">= 25 ppm",
                    triggered: STATIC_SENSOR_VALUES.co >= 25,
                },
                {
                    label: "NO2",
                    value: `${STATIC_SENSOR_VALUES.no2.toFixed(2)} ppm`,
                    threshold: ">= 0.2 ppm",
                    triggered: STATIC_SENSOR_VALUES.no2 >= 0.2,
                },
                {
                    label: "PM2.5",
                    value: `${STATIC_SENSOR_VALUES.pm25.toFixed(2)} ug/m3`,
                    threshold: ">= 90 ug/m3",
                    triggered: STATIC_SENSOR_VALUES.pm25 >= 90,
                },
                {
                    label: "O2",
                    value: `${STATIC_SENSOR_VALUES.o2.toFixed(2)} %`,
                    threshold: "< 19 %",
                    triggered: STATIC_SENSOR_VALUES.o2 < 19,
                },
                {
                    label: "Temperature",
                    value: `${STATIC_SENSOR_VALUES.tempC.toFixed(2)} C`,
                    threshold: "> 57.2 C",
                    triggered: STATIC_SENSOR_VALUES.tempC > 57.2,
                },
                {
                    label: "Temp RoC",
                    value: `${tempRoc >= 0 ? "+" : ""}${tempRoc.toFixed(2)} C/min`,
                    threshold: ">= 8 C/min",
                    triggered: tempRoc >= 8,
                },
            ]
            : [];

    const triggerInfoPlaceholder = [
        {
            label: "CO",
            value: `${STATIC_SENSOR_VALUES.co.toFixed(2)} ppm`,
            threshold: ">= 25 ppm",
            triggered: false,
        },
        {
            label: "NO2",
            value: `${STATIC_SENSOR_VALUES.no2.toFixed(2)} ppm`,
            threshold: ">= 0.2 ppm",
            triggered: false,
        },
        {
            label: "PM2.5",
            value: `${STATIC_SENSOR_VALUES.pm25.toFixed(2)} ug/m3`,
            threshold: ">= 90 ug/m3",
            triggered: false,
        },
        {
            label: "O2",
            value: `${STATIC_SENSOR_VALUES.o2.toFixed(2)} %`,
            threshold: "< 19 %",
            triggered: false,
        },
        {
            label: "Temperature",
            value: `${STATIC_SENSOR_VALUES.tempC.toFixed(2)} C`,
            threshold: "> 57.2 C",
            triggered: false,
        },
        {
            label: "Temp RoC",
            value: `${tempRoc >= 0 ? "+" : ""}${tempRoc.toFixed(2)} C/min`,
            threshold: ">= 8 C/min",
            triggered: false,
        },
    ];

    const triggerInfoLayout = triggerInfo.length > 0 ? triggerInfo : triggerInfoPlaceholder;

    const isReadingTriggered = (reading: SensorReading) => {
        if (detectionStatus === "normal") {
            return false;
        }

        const co = typeof reading.gas_co === "number" ? reading.gas_co : null;
        const no2 = typeof reading.gas_no2 === "number" ? reading.gas_no2 : null;
        const pm25 = typeof reading.pm25 === "number" ? reading.pm25 : null;
        const o2 = typeof reading.gas_o2 === "number" ? reading.gas_o2 : null;
        const temp = typeof reading.temp_c === "number" ? reading.temp_c : null;

        if (detectionStatus === "high_alert") {
            return (
                (co !== null && co >= 60) ||
                (no2 !== null && no2 >= 1) ||
                (pm25 !== null && pm25 >= 150) ||
                (o2 !== null && o2 < 18) ||
                (temp !== null && temp > 57.2)
            );
        }

        return (
            (co !== null && co >= 25) ||
            (no2 !== null && no2 >= 0.2) ||
            (pm25 !== null && pm25 >= 90) ||
            (o2 !== null && o2 < 19) ||
            (temp !== null && temp > 57.2)
        );
    };

    const triggeredSamplesCount = recentReadings.reduce((count, reading) =>
        count + (isReadingTriggered(reading) ? 1 : 0),
        0,
    );
    const confidenceLabel = confidenceSampleSize > 0
        ? `${triggeredSamplesCount}/${confidenceSampleSize}`
        : "—";

    const formatLastUpdated = (reading: SensorReading | null) => {
        if (!reading) {
            return "—";
        }

        if (reading.recorded_at) {
            return new Date(reading.recorded_at).toLocaleString();
        }

        if (reading.created_at) {
            return new Date(reading.created_at).toLocaleString();
        }

        if (typeof reading.ts === "number") {
            return new Date(reading.ts * 1000).toLocaleString();
        }

        return "—";
    };

    const lastUpdatedLabel = formatLastUpdated(latestReading);

    const tempRocReadings = displayReadings.map((reading) => ({
        ...reading,
        temp_c: 0,
    }));

    const formatSensorValue = (sensor: SensorDisplayData, reading: SensorReading | null) => {
        if (sensor.name === "Temp RoC") {
            return "0.00";
        }

        if (!reading) {
            return "—";
        }

        const rawValue = reading[sensor.dataKey];

        if (typeof rawValue !== "number") {
            return "—";
        }

        if (sensor.name === "PM2.5" || sensor.name === "CO" || sensor.name === "NO2") {
            return rawValue.toFixed(3);
        }

        return rawValue.toFixed(2);
    };

    const getLiveStatus = (sensor: SensorDisplayData, reading: SensorReading | null): SensorStatusType => {
        if (sensor.name === "Temp RoC") {
            return "normal";
        }

        if (!reading) {
            return "normal";
        }

        const rawValue = reading[sensor.dataKey];

        if (typeof rawValue !== "number") {
            return "normal";
        }

        switch (sensor.name) {
            case "CO":
                return getHigherIsWorseStatus(rawValue, 60, 25);
            case "NO2":
                return getHigherIsWorseStatus(rawValue, 1, 0.2);
            case "PM2.5":
                return getHigherIsWorseStatus(rawValue, 150, 90);
            case "O2":
                return getLowerIsWorseStatus(rawValue, 18, 19);
            case "Temperature":
                return getHighAlertOnlyStatus(rawValue, 57.2, true);
            default:
                return "normal";
        }
    };


    useEffect(() => {
        return () => {
            document.documentElement.style.overflow = "";
            document.documentElement.style.position = "";
            document.documentElement.style.width = "";
            document.documentElement.style.height = "";
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.top = "";
            document.body.style.left = "";
            document.body.style.right = "";
            document.body.style.width = "";
            document.body.style.height = "";
        };
    }, []);

    useEffect(() => {
        if (!isFullscreen) {
            return;
        }

        const preventScroll = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            const isModalContent = target.closest("[data-swipeable='true']");

            if (!isModalContent) {
                e.preventDefault();
            }
        };

        const preventGesture = (e: Event) => {
            e.preventDefault();
        };

        document.addEventListener("touchmove", preventScroll, { passive: false });
        document.addEventListener("gesturestart", preventGesture, { passive: false });
        document.addEventListener("gesturechange", preventGesture, { passive: false });
        document.addEventListener("gestureend", preventGesture, { passive: false });

        return () => {
            document.removeEventListener("touchmove", preventScroll);
            document.removeEventListener("gesturestart", preventGesture);
            document.removeEventListener("gesturechange", preventGesture);
            document.removeEventListener("gestureend", preventGesture);
        };
    }, [isFullscreen]);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? STATIC_CAMERA_SNAPSHOTS.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) =>
            prev === STATIC_CAMERA_SNAPSHOTS.length - 1 ? 0 : prev + 1
        );
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 50) {
            handleNextImage();
        }

        if (touchStartX.current - touchEndX.current < -50) {
            handlePrevImage();
        }
    };

    const openFullscreen = () => {
        setIsFullscreen(true);
        const scrollY = window.scrollY;

        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.position = "fixed";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
    };

    const closeFullscreen = () => {
        setIsFullscreen(false);
        const scrollY = document.body.style.top;

        document.documentElement.style.overflow = "";
        document.documentElement.style.position = "";
        document.documentElement.style.width = "";
        document.documentElement.style.height = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.height = "";

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
                    <Card className="lg:col-span-1 h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-brand-blue">Current Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                            <svg
                                viewBox="0 0 260 135"
                                className="w-full"
                                aria-label="Detection status gauge"
                            >
                                <path
                                    d={describeArc(130, 108, 95, -90, -30)}
                                    stroke="#22c55e"
                                    strokeWidth="18"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path
                                    d={describeArc(130, 108, 95, -30, 30)}
                                    stroke="#f59e0b"
                                    strokeWidth="18"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path
                                    d={describeArc(130, 108, 95, 30, 90)}
                                    stroke="#ef4444"
                                    strokeWidth="18"
                                    fill="none"
                                    strokeLinecap="round"
                                />

                                <g
                                    className="transition-transform duration-700 ease-in-out"
                                    style={{
                                        transform: `rotate(${gaugeNeedleAngle}deg)`,
                                        transformOrigin: "130px 108px",
                                    }}
                                >
                                    <path
                                        d="M 130 54 L 120 108 L 140 108 Z"
                                        fill="#000000"
                                    />
                                </g>
                                <circle cx="130" cy="108" r="10" fill="#000000" />
                                <circle cx="130" cy="108" r="5" fill="hsl(var(--card))" />
                            </svg>

                            <p
                                className={`text-3xl font-bold ${isElevatedStatus ? "motion-safe:animate-pulse" : ""}`}
                                style={{ color: currentStatusConfig.color }}
                            >
                                {STATIC_DETECTION_RESULT.toUpperCase()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`${isElevatedStatus ? "border-amber-200" : "border-gray-200"} lg:col-span-3 h-full flex flex-col`}>
                        <CardHeader className="pb-2">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="text-base font-bold text-brand-blue">Trigger Information</CardTitle>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Sensor Trigger Information
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                            <div className="h-full lg:pr-4 flex flex-col justify-center gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Triggered At</p>
                                    <p className="text-base font-semibold text-brand-blue">Apr 28, 2026 · 09:41 AM</p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Confidence</p>
                                    <p className="text-2xl font-bold text-brand-blue">{confidenceLabel}</p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Occupants</p>
                                    <p className="text-2xl font-bold text-brand-blue">10</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full" disabled={!isElevatedStatus}>
                                                View Details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Trigger Details</DialogTitle>
                                                <DialogDescription>
                                                    Confidence is based on the last {confidenceSampleSize || 0} readings. The system
                                                    flagged {triggeredSamplesCount} of them as threshold breaches.
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4">
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                    <p className="text-sm text-gray-600">
                                                        Confidence: <span className="font-semibold text-brand-blue">{confidenceLabel}</span>
                                                    </p>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-xs uppercase text-muted-foreground border-b">
                                                            <tr>
                                                                <th className="py-2 text-left">Time</th>
                                                                <th className="py-2 text-left">CO (ppm)</th>
                                                                <th className="py-2 text-left">NO2 (ppm)</th>
                                                                <th className="py-2 text-left">PM2.5 (ug/m3)</th>
                                                                <th className="py-2 text-left">O2 (%)</th>
                                                                <th className="py-2 text-left">Temp (C)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recentReadings.length > 0 ? (
                                                                recentReadings.map((reading) => (
                                                                    <tr key={reading.ts} className="border-b last:border-b-0">
                                                                        <td className="py-2">
                                                                            {new Date(reading.ts * 1000).toLocaleTimeString()}
                                                                        </td>
                                                                        <td className="py-2">{reading.gas_co?.toFixed(2) ?? "—"}</td>
                                                                        <td className="py-2">{reading.gas_no2?.toFixed(2) ?? "—"}</td>
                                                                        <td className="py-2">{reading.pm25?.toFixed(2) ?? "—"}</td>
                                                                        <td className="py-2">{reading.gas_o2?.toFixed(2) ?? "—"}</td>
                                                                        <td className="py-2">{reading.temp_c?.toFixed(2) ?? "—"}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td className="py-4 text-center text-muted-foreground" colSpan={6}>
                                                                        No recent readings available.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button variant="outline" className="w-full">
                                        View Occupancy
                                    </Button>
                                </div>
                            </div>

                            <div className="lg:border-l lg:border-gray-200 lg:pl-4">
                                <div className="relative">
                                    {!isElevatedStatus && (
                                        <p className="absolute left-0 top-0 text-sm text-muted-foreground">
                                            All sensors are within normal thresholds.
                                        </p>
                                    )}

                                    <div
                                        className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${isElevatedStatus ? "" : "opacity-0 pointer-events-none"}`}
                                        aria-hidden={!isElevatedStatus}
                                    >
                                        {triggerInfoLayout.map((trigger) => (
                                            <div
                                                key={trigger.label}
                                                className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${trigger.triggered ? "border-amber-200 bg-amber-50" : "border-gray-200"
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
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                        Camera Snapshots, Occupants, and Quick Actions
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-brand-blue">Camera Snapshots</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="relative cursor-pointer"
                                onClick={openFullscreen}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <p className="text-sm text-muted-foreground">
                                        {STATIC_CAMERA_SNAPSHOTS[currentImageIndex].label}
                                    </p>
                                </div>

                                {STATIC_CAMERA_SNAPSHOTS.length > 1 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrevImage();
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNextImage();
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    </>
                                )}

                                <div className="flex justify-center gap-2 mt-4">
                                    {STATIC_CAMERA_SNAPSHOTS.map((snapshot, index) => (
                                        <button
                                            key={snapshot.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex(index);
                                            }}
                                            className="w-2 h-2 rounded-full transition-all"
                                            style={{
                                                backgroundColor: index === currentImageIndex ? "hsl(var(--brand-blue))" : "#CBD5E1",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Mark as False Alarm
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Download className="h-4 w-4 mr-2" />
                                Export Event Log
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {isFullscreen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
                    style={{
                        touchAction: "none",
                        WebkitOverflowScrolling: "touch",
                        overscrollBehavior: "none",
                    }}
                    onClick={closeFullscreen}
                >
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4"
                        data-swipeable="true"
                        style={{
                            touchAction: "pan-x",
                            overscrollBehavior: "none",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => {
                            e.stopPropagation();
                            handleTouchStart(e);
                        }}
                        onTouchMove={(e) => {
                            e.stopPropagation();
                            handleTouchMove(e);
                        }}
                        onTouchEnd={(e) => {
                            e.stopPropagation();
                            handleTouchEnd();
                        }}
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
                                    style={{
                                        backgroundColor: index === currentImageIndex ? "#FFFFFF" : "#6B7280",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
