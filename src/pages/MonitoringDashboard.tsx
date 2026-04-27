"use client";

import { useEffect, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { SensorStatusBadge, SensorStatusType } from "@/components/SensorStatusBadge";
import TrendBadge from "@/components/TrendBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
};

const STATIC_ROOM_NAME = "Testing Room";

type DetectionResultLabel = "Normal" | "Warning" | "High Alert";

const STATIC_DETECTION_RESULT: DetectionResultLabel = "Warning";

const STATIC_SENSOR_VALUES = {
    co: 26,
    no2: 0,
    pm25: 100.036,
    o2: 18.74,
    tempC: 57.245,
    temp_roc: 0.1,
};

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
        value: `${STATIC_SENSOR_VALUES.co.toFixed(2)} ppm`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.co, 60, 25),
    },
    {
        name: "NO2",
        value: `${STATIC_SENSOR_VALUES.no2.toFixed(2)} ppm`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.no2, 1, 0.2),
    },
    {
        name: "PM2.5",
        value: `${STATIC_SENSOR_VALUES.pm25.toFixed()} ug/m3`,
        status: getHigherIsWorseStatus(STATIC_SENSOR_VALUES.pm25, 150, 90),
    },
    {
        name: "O2",
        value: `${STATIC_SENSOR_VALUES.o2.toFixed(2)}%`,
        status: getLowerIsWorseStatus(STATIC_SENSOR_VALUES.o2, 18, 19),
    },
    {
        name: "Temp",
        value: `${STATIC_SENSOR_VALUES.tempC.toFixed(2)} C`,
        status: getHighAlertOnlyStatus(STATIC_SENSOR_VALUES.tempC, 57.2, true),
    },
    {
        name: "Temp RoC",
        value: `${tempRoc >= 0 ? "+" : ""}${tempRoc.toFixed(2)} C/min`,
        status: getHighAlertOnlyStatus(tempRoc, 8),
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

export default function MonitoringDashboard() {
    const [timestamp, setTimestamp] = useState(new Date().toLocaleString());
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const detectionStatus = detectionResultToStatus[STATIC_DETECTION_RESULT];
    const currentStatusConfig = statusConfig[detectionStatus];

    useEffect(() => {
        const interval = setInterval(() => {
            setTimestamp(new Date().toLocaleString());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

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
                <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-blue">{STATIC_ROOM_NAME}</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">Last updated: {timestamp}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-brand-blue">Sensor Readings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {STATIC_SENSORS.map((sensor) => (
                                        <Card
                                            key={sensor.name}
                                        // className={
                                        //     sensor.status === "high_alert"
                                        //         ? "border-red-300 ring-2 ring-red-200 shadow-[0_0_20px_rgba(239,68,68,0.35)] motion-safe:animate-pulse"
                                        //         : sensor.status === "warning"
                                        //             ? "border-amber-300 ring-2 ring-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.28)] motion-safe:animate-pulse"
                                        //             : ""
                                        // }
                                        >
                                            <CardContent className="p-4 space-y-3">
                                                <h3 className="text-sm sm:text-base font-semibold text-brand-blue">{sensor.name}</h3>

                                                <div className="text-center py-2">
                                                    <span className="text-2xl sm:text-3xl font-bold text-brand-blue">{sensor.value}</span>
                                                </div>

                                                <div className="flex justify-center">
                                                    <SensorStatusBadge status={sensor.status} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-brand-blue">Detection Result</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center">
                                    <div className="relative w-40 h-40">
                                        <svg className="transform -rotate-90 w-40 h-40">
                                            <defs>
                                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                                                    <feFlood floodColor={currentStatusConfig.color} floodOpacity="0.3" result="color" />
                                                    <feComposite in="color" in2="blur" operator="in" result="shadow" />
                                                    <feMerge>
                                                        <feMergeNode in="shadow" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>

                                            <circle cx="80" cy="80" r="70" stroke="#E5E7EB" strokeWidth="12" fill="none" />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke={currentStatusConfig.color}
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={440}
                                                strokeDashoffset={
                                                    detectionStatus === "normal" ? 293 : detectionStatus === "warning" ? 147 : 0
                                                }
                                                strokeLinecap="round"
                                                className="transition-all duration-700 ease-in-out"
                                                filter="url(#glow)"
                                            />
                                        </svg>

                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div
                                                className="w-3 h-3 rounded-full mb-2 animate-pulse"
                                                style={{ backgroundColor: currentStatusConfig.color }}
                                            />
                                            <span
                                                className="text-xl font-bold text-center px-2"
                                                style={{ color: currentStatusConfig.color }}
                                            >
                                                {STATIC_DETECTION_RESULT}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-sm text-center text-text-primary leading-relaxed">
                                    As of <span className="font-semibold">{timestamp}</span>, the
                                    <span className="font-semibold"> {STATIC_ROOM_NAME}</span> detection status is
                                    <span className="font-bold" style={{ color: currentStatusConfig.color }}>
                                        {` ${STATIC_DETECTION_RESULT}`}
                                    </span>
                                    .
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

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
                                <p className="text-xs text-text-tertiary">Last updated: {timestamp}</p>
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
