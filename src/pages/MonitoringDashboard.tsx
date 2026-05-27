"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageLayout from "@/components/PageLayout";
import AlertOverlay, { type OverlayState } from "@/components/AlertOverlay";
import { SensorStatusBadge, SensorStatusType } from "@/components/SensorStatusBadge";
import { useSensor } from "@/components/SupabaseProvider";
import SensorReadingGraph, { SensorReading, VerticalLineSpec } from "@/components/SensorReadingGraph";
import type { IChartApi } from "lightweight-charts";
import TrendBadge from "@/components/TrendBadge";
import { useAlertEpisode } from "@/hooks/useAlertEpisode";
import { useAlertSound } from "@/hooks/useAlertSound";
import { useHeadcount } from "@/hooks/useHeadcount";
import HeadcountCarousel from "@/components/HeadcountCarousel";
import { useDeviceConnection } from "@/hooks/useDeviceConnection";
import { useAuth } from "@/app/providers";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Archive,
    Camera,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    HelpCircle,
    Loader2,
    RefreshCw,
    Volume2,
    VolumeX,
    X,
    XCircle,
} from "lucide-react";

type StatusLevel = "normal" | "warning" | "high_alert" | "disconnected";

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
    { name: "Carbon Monoxide (CO)", value: "", status: "normal", dataKey: "gas_co", color: "#ef4444", unit: "ppm", minVal: 0, maxVal: 100 },
    { name: "Nitrogen Dioxide (NO2)", value: "", status: "normal", dataKey: "gas_no2", color: "#f97316", unit: "ppm", minVal: 0, maxVal: 5 },
    { name: "Particulate Matter (PM2.5)", value: "", status: "normal", dataKey: "pm25", color: "#8b5cf6", unit: "ug/m3", minVal: 0, maxVal: 50 },
    { name: "Oxygen (O2)", value: "", status: "normal", dataKey: "gas_o2", color: "#22c55e", unit: "%", minVal: 10, maxVal: 25 },
    { name: "Temperature", value: "", status: "normal", dataKey: "temp_c", color: "#3b82f6", unit: "C", minVal: 20, maxVal: 70 },
    { name: "Temperature Rate of Change", value: "", status: "normal", dataKey: "temp_roc", color: "#06b6d4", unit: "C/min", minVal: -2, maxVal: 10 },
];

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


const statusConfig: Record<StatusLevel, { color: string; label: string }> = {
    normal: { color: "hsl(var(--brand-green))", label: "Normal" },
    warning: { color: "hsl(var(--brand-orange))", label: "Warning" },
    high_alert: { color: "hsl(var(--brand-red))", label: "High Alert" },
    disconnected: { color: "#9CA3AF", label: "Disconnected" },
};

const alertStatusBadge: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "text-amber-700 bg-amber-50 border border-amber-200" },
    resolved: { label: "Resolved", className: "text-green-700 bg-green-50 border border-green-200" },
    false_alarm: { label: "False Alarm", className: "text-gray-600  bg-gray-50  border border-gray-200" },
    archived: { label: "Archived", className: "text-gray-400  bg-gray-50  border border-gray-100" },
};

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
};

const describeArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};


export default function MonitoringDashboard() {
    const { readings } = useSensor();
    const { activeEpisode, transitions } = useAlertEpisode();
    const { webMuted, toggleWebMuted } = useAlertSound(activeEpisode);
    const { cardLogs, allLogs, totalCaptured, requesting, requestCapture } = useHeadcount(activeEpisode?.id ?? null);
    const { isDeviceConnected } = useDeviceConnection(readings);
    const { user } = useAuth();
    const canAct = user?.role === "admin" || user?.role === "security" || user?.role === "facility";

    // Reset card carousel to index 0 when a new capture arrives
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [allLogs.length]);

    const displayReadings = isDeviceConnected ? readings : [];
    const latestReading = isDeviceConnected && readings.length > 0 ? readings[readings.length - 1] : null;

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cardImageLoading, setCardImageLoading] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [modalReadings, setModalReadings] = useState<SensorReading[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [isActing, setIsActing] = useState(false);
    const [pendingAction, setPendingAction] = useState<"resolved" | "false_alarm" | null>(null);
    const [confirmAction, setConfirmAction] = useState<"resolved" | "false_alarm" | null>(null);
    const [resolutionMessage, setResolutionMessage] = useState("");
    const [showResolutionBanner, setShowResolutionBanner] = useState(true);
    const [successBanner, setSuccessBanner] = useState<string | null>(null);
    const [errorBanner, setErrorBanner] = useState<string | null>(null);
    const [rpiActive, setRpiActive] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);
    const [overlayState, setOverlayState] = useState<OverlayState>("hidden");
    const [overlayAnimKey, setOverlayAnimKey] = useState(0);
    const overlaySeverityRef = useRef(0);
    const pendingActionRef = useRef<"resolved" | "false_alarm" | null>(null);
    const prevAcknowledgedAtRef = useRef<string | null>(null);
    const actingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const muteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Watch for RPi acknowledgement after resolve / false-alarm
    useEffect(() => {
        if (!pendingActionRef.current) return;
        const ack = activeEpisode?.rpi_acknowledged_at ?? null;
        if (ack === null || ack === prevAcknowledgedAtRef.current) return;
        if (actingTimeoutRef.current) { clearTimeout(actingTimeoutRef.current); actingTimeoutRef.current = null; }
        setSuccessBanner(
            pendingActionRef.current === "resolved"
                ? "Alert resolved — RPi confirmed"
                : "Marked as false alarm — RPi confirmed"
        );
        setIsActing(false);
        setPendingAction(null);
        pendingActionRef.current = null;
    }, [activeEpisode?.rpi_acknowledged_at]);

    // Watch for RPi acknowledgement of mute toggle
    useEffect(() => {
        if (!muteTimeoutRef.current || !activeEpisode) return;
        const expected = activeEpisode.buzzer_muted ? "muted" : "on";
        if (activeEpisode.buzzer_status === expected) {
            clearTimeout(muteTimeoutRef.current);
            muteTimeoutRef.current = null;
        }
    }, [activeEpisode?.buzzer_status, activeEpisode?.buzzer_muted]);

    // Track whether RPi has sent an update within the last 30s
    useEffect(() => {
        if (!activeEpisode) { setRpiActive(false); return; }
        const remaining = Math.max(0, 30 - (Date.now() / 1000 - activeEpisode.last_updated_ts));
        setRpiActive(remaining > 0);
        if (remaining === 0) return;
        const timeout = setTimeout(() => setRpiActive(false), remaining * 1000);
        return () => clearTimeout(timeout);
    }, [activeEpisode?.last_updated_ts]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (actingTimeoutRef.current) clearTimeout(actingTimeoutRef.current);
            if (muteTimeoutRef.current) clearTimeout(muteTimeoutRef.current);
        };
    }, []);

    const handleMuteToggle = useCallback(async () => {
        if (!activeEpisode) return;
        const originalMuted = activeEpisode.buzzer_muted;
        await supabase
            .from("alert_episodes")
            .update({ buzzer_muted: !originalMuted } as never)
            .eq("id", activeEpisode.id);
        muteTimeoutRef.current = setTimeout(async () => {
            muteTimeoutRef.current = null;
            await supabase
                .from("alert_episodes")
                .update({ buzzer_muted: originalMuted } as never)
                .eq("id", activeEpisode.id);
            setErrorBanner("Buzzer command timed out — RPi did not respond. Reverted to previous state.");
        }, 10000);
    }, [activeEpisode]);

    const handleResolve = useCallback(() => {
        if (!activeEpisode) return;
        setResolutionMessage("");
        setConfirmAction("resolved");
    }, [activeEpisode]);

    const handleFalseAlarm = useCallback(() => {
        if (!activeEpisode) return;
        setResolutionMessage("");
        setConfirmAction("false_alarm");
    }, [activeEpisode]);

    const handleConfirmAction = useCallback(async () => {
        if (!activeEpisode || !confirmAction) return;
        const action = confirmAction;
        setConfirmAction(null);
        prevAcknowledgedAtRef.current = activeEpisode.rpi_acknowledged_at;
        pendingActionRef.current = action;
        setPendingAction(action);
        setIsActing(true);
        await supabase
            .from("alert_episodes")
            .update({
                status: action,
                resolved_by: user ? `${user.firstName} ${user.lastName}` : null,
                resolution_message: resolutionMessage.trim() || null,
            } as never)
            .eq("id", activeEpisode.id);
        actingTimeoutRef.current = setTimeout(async () => {
            actingTimeoutRef.current = null;
            await supabase
                .from("alert_episodes")
                .update({ status: "active" } as never)
                .eq("id", activeEpisode.id);
            setIsActing(false);
            setPendingAction(null);
            pendingActionRef.current = null;
            setErrorBanner("Action timed out — RPi did not respond. Reverted to active.");
        }, 10000);
    }, [activeEpisode, confirmAction, resolutionMessage, user]);

    const handleDismiss = useCallback(async () => {
        if (!activeEpisode) return;
        setIsDismissing(true);
        await supabase
            .from("alert_episodes")
            .update({ dismissed_at: new Date().toISOString() } as never)
            .eq("id", activeEpisode.id);
        setIsDismissing(false);
    }, [activeEpisode]);

    // Auto-dismiss any lingering resolved/false_alarm episodes when a new active one arrives
    useEffect(() => {
        if (!activeEpisode || activeEpisode.status !== "active") return;
        void (async () => {
            await supabase
                .from("alert_episodes")
                .update({ dismissed_at: new Date().toISOString() } as never)
                .in("status", ["resolved", "false_alarm"])
                .is("dismissed_at", null)
                .neq("id", activeEpisode.id);
        })();
    }, [activeEpisode?.id]);

    // Show overlay when a new active episode arrives or severity escalates
    useEffect(() => {
        if (!activeEpisode || activeEpisode.status !== "active") return;
        const rank = activeEpisode.current_state.trim().toLowerCase().replace(/\s+/g, "_") === "high_alert" ? 2 : 1;
        if (rank > overlaySeverityRef.current) {
            overlaySeverityRef.current = rank;
            setOverlayState("open");
            setOverlayAnimKey(k => k + 1);
        }
    }, [activeEpisode?.id, activeEpisode?.current_state]);

    // Hide overlay when episode resolves, is marked false alarm, or is dismissed
    useEffect(() => {
        if (!activeEpisode || activeEpisode.status !== "active") {
            setOverlayState("hidden");
            overlaySeverityRef.current = 0;
        }
    }, [activeEpisode?.status]);

    const modalChartsRef = useRef<IChartApi[]>([]);
    const isSyncingRef = useRef(false);

    const handleModalChartCreated = useCallback((chart: IChartApi) => {
        modalChartsRef.current.push(chart);
        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            if (isSyncingRef.current || !range) return;
            isSyncingRef.current = true;
            modalChartsRef.current.forEach((c) => {
                if (c !== chart) c.timeScale().setVisibleLogicalRange(range);
            });
            isSyncingRef.current = false;
        });
    }, []);

    const handleModalChartRemoved = useCallback((chart: IChartApi) => {
        modalChartsRef.current = modalChartsRef.current.filter((c) => c !== chart);
    }, []);

    // Build vertical line specs for modal graphs — stable reference until episode/transitions change
    const modalVerticalLines = useMemo((): VerticalLineSpec[] => {
        if (!activeEpisode) return [];
        const lines: VerticalLineSpec[] = [];

        // 1. Alert start — red solid
        lines.push({ ts: activeEpisode.started_ts, color: "#ef4444", dashed: false });

        // 2. Warning → High Alert transitions — orange dashed
        for (const t of transitions) {
            const normalized = t.state.trim().toLowerCase().replace(" ", "_");
            if (normalized === "high_alert") {
                lines.push({ ts: t.ts, color: "#f97316", dashed: true });
            }
        }

        // 3. Last updated — gray solid (end / last active)
        if (activeEpisode.last_updated_ts !== activeEpisode.started_ts) {
            lines.push({ ts: activeEpisode.last_updated_ts, color: "#94a3b8", dashed: false });
        }

        return lines;
        // Only the timestamps and transitions affect which lines are drawn — status/buzzer changes must not invalidate this
    }, [activeEpisode?.started_ts, activeEpisode?.last_updated_ts, transitions]);

    const fetchModalReadings = useCallback(async () => {
        if (!activeEpisode) return;
        setModalLoading(true);
        const { data } = await supabase
            .from("sensor_readings")
            .select("*")
            .gte("ts", activeEpisode.started_ts - 20)
            .lte("ts", activeEpisode.last_updated_ts + 20)
            .order("ts", { ascending: true });
        setModalReadings(data ?? []);
        setModalLoading(false);
    }, [activeEpisode]);

    // Priority: active alert > disconnected > normal
    const detectionStatus: StatusLevel =
        activeEpisode?.status === "active" ? ((): "warning" | "high_alert" => {
            const s = activeEpisode.current_state.trim().toLowerCase().replace(" ", "_");
            return s === "high_alert" ? "high_alert" : "warning";
        })() :
            !isDeviceConnected ? "disconnected" :
                "normal";

    const currentStatusConfig = statusConfig[detectionStatus] ?? statusConfig.normal;
    const isElevatedStatus = detectionStatus === "warning" || detectionStatus === "high_alert";
    const gaugeNeedleAngle =
        detectionStatus === "warning" ? 0 :
            detectionStatus === "high_alert" ? 75 :
                detectionStatus === "disconnected" ? -90 :
                    -75;

    // Live sensor values from the latest reading
    const liveValues = {
        co: typeof latestReading?.gas_co === "number" ? latestReading.gas_co : null,
        no2: typeof latestReading?.gas_no2 === "number" ? latestReading.gas_no2 : null,
        pm25: typeof latestReading?.pm25 === "number" ? latestReading.pm25 : null,
        o2: typeof latestReading?.gas_o2 === "number" ? latestReading.gas_o2 : null,
        tempC: typeof latestReading?.temp_c === "number" ? latestReading.temp_c : null,
        tempRoc: typeof latestReading?.temp_roc === "number" ? latestReading.temp_roc : null,
    };

    const formatLastUpdated = (reading: SensorReading | null) => {
        if (!reading) return "—";
        if (reading.recorded_at) return new Date(reading.recorded_at).toLocaleString();
        if (reading.created_at) return new Date(reading.created_at).toLocaleString();
        if (typeof reading.ts === "number") return new Date(reading.ts * 1000).toLocaleString();
        return "—";
    };

    const lastUpdatedLabel = formatLastUpdated(latestReading);

    const formatSensorValue = (sensor: SensorDisplayData, reading: SensorReading | null) => {
        if (!reading) return "—";
        const rawValue = reading[sensor.dataKey];
        if (typeof rawValue !== "number") return "—";
        if (sensor.name === "PM2.5" || sensor.name === "CO" || sensor.name === "NO2") return rawValue.toFixed(3);
        return rawValue.toFixed(2);
    };

    const getLiveStatus = (sensor: SensorDisplayData, reading: SensorReading | null): SensorStatusType => {
        if (!reading) return "normal";
        const rawValue = reading[sensor.dataKey];
        if (typeof rawValue !== "number") return "normal";
        switch (sensor.name) {
            case "CO": return getHigherIsWorseStatus(rawValue, 60, 25);
            case "NO2": return getHigherIsWorseStatus(rawValue, 1, 0.2);
            case "PM2.5": return getHigherIsWorseStatus(rawValue, 150, 90);
            case "O2": return getLowerIsWorseStatus(rawValue, 18, 19);
            case "Temperature": return getHighAlertOnlyStatus(rawValue, 57.2, true);
            case "Temp RoC": return getHighAlertOnlyStatus(rawValue, 8);
            default: return "normal";
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
        if (!isFullscreen) return;
        const preventScroll = (e: TouchEvent) => {
            if (!(e.target as HTMLElement).closest("[data-swipeable='true']")) e.preventDefault();
        };
        const preventGesture = (e: Event) => e.preventDefault();
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

    // Show spinner when navigating in card
    useEffect(() => {
        if (cardLogs[currentImageIndex]?.image_url) setCardImageLoading(true);
    }, [currentImageIndex]);

    // Card carousel handlers
    const handlePrevImage = (len: number) =>
        setCurrentImageIndex((prev) => prev === 0 ? len - 1 : prev - 1);

    const handleNextImage = (len: number) =>
        setCurrentImageIndex((prev) => prev === len - 1 ? 0 : prev + 1);

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
    const handleTouchEnd = () => {
        const len = cardLogs.length;
        if (touchStartX.current - touchEndX.current > 50) handleNextImage(len);
        if (touchStartX.current - touchEndX.current < -50) handlePrevImage(len);
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
            <div className="flex flex-col gap-3">
                {/* ── Alert Overlay (minimized strip sits here; full overlay is fixed) ── */}
                {activeEpisode && (
                    <div className={overlayState !== "hidden" ? "-mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-3" : ""}>
                        <AlertOverlay
                            state={overlayState}
                            episode={activeEpisode}
                            animationKey={overlayAnimKey}
                            webMuted={webMuted}
                            onToggleWebMuted={toggleWebMuted}
                            onMinimize={() => setOverlayState("minimized")}
                            onExpand={() => { setOverlayState("open"); setOverlayAnimKey(k => k + 1); }}
                            onViewReport={() => {
                                setOverlayState("minimized");
                                setIsReportOpen(true);
                                fetchModalReadings();
                            }}
                        />
                    </div>
                )}

                {/* ── Page header ───────────────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-brand-blue">{STATIC_ROOM_NAME}</h2>
                        <p className="text-xs text-muted-foreground">Last updated: {lastUpdatedLabel}</p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-brand-blue" aria-label="Dashboard guide">
                                <HelpCircle className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Dashboard Guide</DialogTitle>
                                <DialogDescription>Reference for status badges and sensor alert thresholds.</DialogDescription>
                            </DialogHeader>

                            {/* Status Badges */}
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-2">Status Badges</p>
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-1.5 pr-4 text-xs font-semibold text-muted-foreground w-28">Badge</th>
                                        <th className="text-left py-1.5 text-xs font-semibold text-muted-foreground">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { bg: "#F3F4F6", color: "#9CA3AF", label: "Offline", desc: "The Pyrolert device is not connected or has not sent data in the last 30 seconds." },
                                        { bg: "#D5F5DA", color: "hsl(var(--brand-green))", label: "Normal", desc: "All sensor readings are within safe operating ranges." },
                                        { bg: "#FFF4E5", color: "hsl(var(--brand-orange))", label: "Warning", desc: "One or more readings have exceeded an early-warning threshold. Monitor closely." },
                                        { bg: "#FFE5E5", color: "hsl(var(--brand-red))", label: "High Alert", desc: "One or more readings have exceeded a critical threshold. Immediate action may be required." },
                                    ].map(({ bg, color, label, desc }) => (
                                        <tr key={label} className="border-b border-gray-50">
                                            <td className="py-2 pr-4">
                                                <div className="px-2 py-0.5 rounded-full inline-flex items-center" style={{ backgroundColor: bg }}>
                                                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color }}>{label.toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 text-muted-foreground">{desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="border-t border-gray-100 my-2" />

                            {/* Per-sensor thresholds */}
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sensor Thresholds</p>
                            <div className="flex flex-col gap-4">
                                {[
                                    {
                                        name: "CO (Carbon Monoxide)",
                                        rows: [
                                            { label: "Normal", desc: "Below 25 ppm — safe ambient level." },
                                            { label: "Warning", desc: "25 – 59 ppm — elevated; prolonged exposure is harmful." },
                                            { label: "High Alert", desc: "≥ 60 ppm — dangerous concentration; evacuate immediately." },
                                        ],
                                    },
                                    {
                                        name: "NO2 (Nitrogen Dioxide)",
                                        rows: [
                                            { label: "Normal", desc: "Below 0.2 ppm — safe ambient level." },
                                            { label: "Warning", desc: "0.2 – 0.99 ppm — irritant; sensitive individuals at risk." },
                                            { label: "High Alert", desc: "≥ 1 ppm — hazardous; immediate ventilation required." },
                                        ],
                                    },
                                    {
                                        name: "PM2.5 (Fine Particulate Matter)",
                                        rows: [
                                            { label: "Normal", desc: "Below 90 µg/m³ — acceptable air quality." },
                                            { label: "Warning", desc: "90 – 149 µg/m³ — unhealthy for sensitive groups." },
                                            { label: "High Alert", desc: "≥ 150 µg/m³ — very unhealthy; reduce exposure." },
                                        ],
                                    },
                                    {
                                        name: "O2 (Oxygen)",
                                        rows: [
                                            { label: "Normal", desc: "≥ 19% — normal oxygen concentration." },
                                            { label: "Warning", desc: "18 – 18.99% — mildly oxygen-deficient environment." },
                                            { label: "High Alert", desc: "Below 18% — oxygen-deficient; serious health risk." },
                                        ],
                                    },
                                    {
                                        name: "Temperature",
                                        rows: [
                                            { label: "Normal", desc: "≤ 57.2°C — within expected operating range." },
                                            { label: "High Alert", desc: "> 57.2°C — critical temperature; potential fire risk." },
                                        ],
                                    },
                                    {
                                        name: "Temp RoC (Temperature Rate of Change)",
                                        rows: [
                                            { label: "Normal", desc: "Below 8°C/min — temperature rising at a safe rate." },
                                            { label: "High Alert", desc: "≥ 8°C/min — rapid temperature rise; potential fire indicator." },
                                        ],
                                    },
                                ].map(({ name, rows }) => (
                                    <div key={name}>
                                        <p className="text-sm font-semibold text-brand-blue mb-1.5">{name}</p>
                                        <table className="w-full text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    <th className="text-left py-1 pr-4 text-xs font-semibold text-muted-foreground w-28">Status</th>
                                                    <th className="text-left py-1 text-xs font-semibold text-muted-foreground">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map(({ label, desc }) => {
                                                    const cfg =
                                                        label === "Normal" ? { bg: "#D5F5DA", color: "hsl(var(--brand-green))" } :
                                                            label === "Warning" ? { bg: "#FFF4E5", color: "hsl(var(--brand-orange))" } :
                                                                { bg: "#FFE5E5", color: "hsl(var(--brand-red))" };
                                                    return (
                                                        <tr key={label} className="border-b border-gray-50">
                                                            <td className="py-1.5 pr-4">
                                                                <div className="px-2 py-0.5 rounded-full inline-flex items-center" style={{ backgroundColor: cfg.bg }}>
                                                                    <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: cfg.color }}>{label.toUpperCase()}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 text-muted-foreground">{desc}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ── Main layout: sidebar + sensor readings ─────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4">

                    {/* ── Left sidebar ─────────────────────────────────────────── */}
                    <div className="flex flex-col gap-3 h-full">

                        {/* Current Status */}
                        <Card>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-base font-bold text-brand-blue">Current Status</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 flex flex-col items-center gap-0">
                                <svg viewBox="0 0 260 135" className="w-48" aria-label="Detection status gauge">
                                    <path d={describeArc(130, 108, 95, -90, -30)} stroke="#22c55e" strokeWidth="18" fill="none" strokeLinecap="round" />
                                    <path d={describeArc(130, 108, 95, -30, 30)} stroke="#f59e0b" strokeWidth="18" fill="none" strokeLinecap="round" />
                                    <path d={describeArc(130, 108, 95, 30, 90)} stroke="#ef4444" strokeWidth="18" fill="none" strokeLinecap="round" />
                                    <g
                                        className="transition-transform duration-700 ease-in-out"
                                        style={{ transform: `rotate(${gaugeNeedleAngle}deg)`, transformOrigin: "130px 108px" }}
                                    >
                                        <path d="M 130 54 L 120 108 L 140 108 Z" fill="#000000" />
                                    </g>
                                    <circle cx="130" cy="108" r="10" fill="#000000" />
                                    <circle cx="130" cy="108" r="5" fill="hsl(var(--card))" />
                                </svg>
                                <p
                                    className={`text-2xl font-bold -mt-2 ${isElevatedStatus ? "motion-safe:animate-pulse" : ""}`}
                                    style={{ color: currentStatusConfig.color }}
                                >
                                    {currentStatusConfig.label.toUpperCase()}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Alert Information */}
                        <Card>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-base font-bold text-brand-blue">Alert Information</CardTitle>
                            </CardHeader>

                            {!activeEpisode ? (
                                <CardContent className="px-4 pb-3">
                                    <p className="text-sm text-muted-foreground">No active alerts.</p>
                                </CardContent>
                            ) : (
                                <CardContent className="px-4 pb-3 flex flex-col gap-3">
                                    {/* Metadata */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">Triggered At</p>
                                            <p className="text-xs font-semibold text-brand-blue">
                                                {new Date(activeEpisode.started_ts * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">Last Updated</p>
                                            <p className="text-xs font-semibold text-brand-blue">
                                                {new Date(activeEpisode.last_updated_ts * 1000).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-muted-foreground">Status</p>
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${alertStatusBadge[activeEpisode.status]?.className ?? ""}`}>
                                                {alertStatusBadge[activeEpisode.status]?.label ?? activeEpisode.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* View Report + Dismiss */}
                                    <div className="flex gap-2">
                                        {(activeEpisode.status === "resolved" || activeEpisode.status === "false_alarm") && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isDismissing}
                                                className="flex-1 gap-1.5 text-xs text-muted-foreground"
                                                onClick={handleDismiss}
                                            >
                                                {isDismissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                                                Dismiss
                                            </Button>
                                        )}
                                        <Dialog open={isReportOpen} onOpenChange={(open) => {
                                            setIsReportOpen(open);
                                            if (open) fetchModalReadings();
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    View Report
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-5xl flex flex-col gap-0 p-0 overflow-hidden" style={{ height: "calc(100vh - 2rem)" }}>
                                                {/* ── Sticky header ── */}
                                                <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100 pr-14 flex flex-col gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <DialogTitle className="text-lg font-bold text-brand-blue">Alert Report</DialogTitle>
                                                        {/* Nested graph guide */}
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
                                                                            {
                                                                                label: "Alert Start",
                                                                                color: "#ef4444",
                                                                                dashed: false,
                                                                                desc: "Marks triggered_at — the moment the alert episode began.",
                                                                            },
                                                                            {
                                                                                label: "Transition",
                                                                                color: "#f97316",
                                                                                dashed: true,
                                                                                desc: "Marks when the alert escalated from Warning to High Alert.",
                                                                            },
                                                                            {
                                                                                label: "Last Active",
                                                                                color: "#94a3b8",
                                                                                dashed: false,
                                                                                desc: "Marks last_updated_ts — the last recorded update of the active episode.",
                                                                            },
                                                                        ].map(({ label, color, dashed, desc }) => (
                                                                            <tr key={label} className="border-b border-gray-50">
                                                                                <td className="py-2 pr-4 text-xs font-medium">{label}</td>
                                                                                <td className="py-2 pr-4">
                                                                                    <svg width="60" height="14" aria-hidden="true">
                                                                                        <line
                                                                                            x1="0" y1="7" x2="60" y2="7"
                                                                                            stroke={color}
                                                                                            strokeWidth="2"
                                                                                            strokeDasharray={dashed ? "4 3" : undefined}
                                                                                        />
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

                                                    <div className="flex items-start gap-6">
                                                        {/* Left: status + timestamps */}
                                                        <div className="shrink-0 flex flex-col gap-1.5">
                                                            {[
                                                                {
                                                                    label: "Current Status", content: (() => {
                                                                        const epState = activeEpisode.current_state.trim().toLowerCase().replace(" ", "_") as StatusLevel;
                                                                        const epConfig = statusConfig[epState] ?? statusConfig.normal;
                                                                        const shouldPulse = activeEpisode.status === "active" && (epState === "warning" || epState === "high_alert");
                                                                        return (
                                                                            <span className={`text-xs font-bold ${shouldPulse ? "motion-safe:animate-pulse" : ""}`} style={{ color: epConfig.color }}>
                                                                                {epConfig.label.toUpperCase()}
                                                                            </span>
                                                                        );
                                                                    })()
                                                                },
                                                                { label: "Triggered At", content: <span className="text-xs">{new Date(activeEpisode.started_ts * 1000).toLocaleString()}</span> },
                                                                { label: "Last Updated", content: <span className="text-xs">{new Date(activeEpisode.last_updated_ts * 1000).toLocaleString()}</span> },
                                                            ].map(({ label, content }) => (
                                                                <div key={label} className="flex items-center gap-3 text-xs">
                                                                    <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                                                                    {content}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="w-px self-stretch bg-gray-200 shrink-0" />

                                                        {/* Middle: alert state history */}
                                                        <div className="shrink-0 flex flex-col gap-1.5">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alert State History</p>
                                                            <div className="space-y-1 overflow-y-auto max-h-20">
                                                                {transitions.length === 0 ? (
                                                                    <p className="text-xs text-muted-foreground">No transitions recorded.</p>
                                                                ) : [...transitions].reverse().map((entry) => (
                                                                    <div key={entry.id} className="flex items-center gap-3 text-xs">
                                                                        <span className="text-muted-foreground w-24 shrink-0">
                                                                            {new Date(entry.ts * 1000).toLocaleTimeString()}
                                                                        </span>
                                                                        <span className="font-medium" style={{ color: statusConfig[entry.state.trim().toLowerCase().replace(" ", "_") as StatusLevel]?.color ?? "#6b7280" }}>
                                                                            {statusConfig[entry.state.trim().toLowerCase().replace(" ", "_") as StatusLevel]?.label ?? entry.state}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>

                                                {/* ── Resolution banner (resolved / false alarm only) ── */}
                                                {(activeEpisode.status === "resolved" || activeEpisode.status === "false_alarm") && (
                                                    <div className="mx-6 mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                                                        {/* Banner header — always visible */}
                                                        <button
                                                            className="flex items-center gap-3 w-full group"
                                                            onClick={() => setShowResolutionBanner(v => !v)}
                                                        >
                                                            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">Resolution and Message Report</span>
                                                            <div className="flex-1" />
                                                            {showResolutionBanner
                                                                ? <ChevronUp className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-700" />
                                                                : <ChevronDown className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-700" />
                                                            }
                                                        </button>

                                                        {/* Collapsible body */}
                                                        {showResolutionBanner && (
                                                            <div className="flex gap-6 mt-2">
                                                                {/* Col 1: status + resolution metadata */}
                                                                <div className="flex flex-col gap-1.5 shrink-0">
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="text-amber-600 w-20 shrink-0">Status</span>
                                                                        <span className={`font-bold ${activeEpisode.status === "resolved" ? "text-green-600" : "text-gray-500"}`}>
                                                                            {activeEpisode.status === "resolved" ? "Resolved" : "False Alarm"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="text-amber-600 w-20 shrink-0">Resolved By</span>
                                                                        <span className="font-medium text-amber-900">{activeEpisode.resolved_by ?? "—"}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-xs">
                                                                        <span className="text-amber-600 w-20 shrink-0">Resolved At</span>
                                                                        <span className="font-medium text-amber-900">
                                                                            {activeEpisode.rpi_acknowledged_at ? new Date(activeEpisode.rpi_acknowledged_at).toLocaleString() : "—"}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="w-px self-stretch bg-amber-200 shrink-0" />

                                                                {/* Col 2: message */}
                                                                <div className="flex-1 flex flex-col gap-1.5">
                                                                    <span className="text-xs text-amber-600">Remarks</span>
                                                                    {activeEpisode.resolution_message ? (
                                                                        <p className="text-xs text-amber-800 leading-relaxed">{activeEpisode.resolution_message}</p>
                                                                    ) : (
                                                                        <p className="text-xs text-amber-400 italic">No message provided.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ── Sensor graphs header (fixed) ── */}
                                                <div className="px-6 py-2 flex items-center justify-between border-t border-gray-100 shrink-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Sensor Readings at Alert Time
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 gap-1.5 text-xs text-muted-foreground"
                                                        disabled={modalLoading}
                                                        onClick={fetchModalReadings}
                                                    >
                                                        <RefreshCw className={`h-3 w-3 ${modalLoading ? "animate-spin" : ""}`} />
                                                        Reload
                                                    </Button>
                                                </div>

                                                {/* ── Scrollable body: sensor graphs only ── */}
                                                <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-4">

                                                    {modalLoading ? (
                                                        <div className="flex items-center justify-center h-32">
                                                            <p className="text-sm text-muted-foreground">Loading sensor data…</p>
                                                        </div>
                                                    ) : modalReadings.length === 0 ? (
                                                        <div className="flex items-center justify-center h-32">
                                                            <p className="text-sm text-muted-foreground">No readings found for this episode window.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {STATIC_SENSORS.map((sensor) => {
                                                                const episodeState = activeEpisode.current_state.trim().toLowerCase().replace(" ", "_") as StatusLevel;
                                                                const threshold = getSensorThreshold(sensor.name, episodeState);
                                                                return (
                                                                    <div key={sensor.name} className="rounded-md border border-gray-200 p-3">
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <p className="text-sm font-semibold text-brand-blue">
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
                                                                            readings={modalReadings}
                                                                            verticalLines={modalVerticalLines}
                                                                            thresholdValue={threshold}
                                                                            interactive
                                                                            onChartCreated={handleModalChartCreated}
                                                                            onChartRemoved={handleModalChartRemoved}
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* ── Action footer ── */}
                                                <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex flex-col gap-2">
                                                    {/* Error banner */}
                                                    {errorBanner && (
                                                        <div className="flex items-center justify-between rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                                                            <div className="flex items-center gap-2">
                                                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                                                                {errorBanner}
                                                            </div>
                                                            <button onClick={() => setErrorBanner(null)} className="ml-4 text-red-400 hover:text-red-600">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Success banner */}
                                                    {successBanner && (
                                                        <div className="flex items-center justify-between rounded-md bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                                                                {successBanner}
                                                            </div>
                                                            <button onClick={() => setSuccessBanner(null)} className="ml-4 text-green-500 hover:text-green-700">
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Action buttons */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        {/* Left: activity indicator — only for active episodes */}
                                                        {activeEpisode.status === "active" ? (() => {
                                                            const dotColor =
                                                                rpiActive && detectionStatus === "high_alert" ? "#ef4444" :
                                                                    rpiActive && detectionStatus === "warning" ? "#f97316" :
                                                                        "#eab308";
                                                            const label = rpiActive ? "Alert Active" : "Alert Idle";
                                                            return (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={rpiActive ? "motion-safe:animate-pulse" : ""}
                                                                        style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: dotColor, flexShrink: 0 }}
                                                                    />
                                                                    <span className="text-xs font-medium" style={{ color: dotColor }}>{label}</span>
                                                                </div>
                                                            );
                                                        })() : <div />}

                                                        {/* Right: buttons */}
                                                        <div className="flex items-center gap-2">
                                                            {/* Mute / Unmute — warning (disabled) and high alert (active) */}
                                                            {(isElevatedStatus || (pendingAction !== null && ["warning", "high_alert"].includes(activeEpisode.current_state.trim().toLowerCase().replace(" ", "_")))) && (() => {
                                                                const muted = activeEpisode.buzzer_muted;
                                                                const bStatus = activeEpisode.buzzer_status;
                                                                const buzzerPending = (muted && bStatus === "on") || (!muted && bStatus === "muted");
                                                                const isOn = !muted && bStatus === "on";
                                                                return (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={buzzerPending || isActing || !canAct}
                                                                        onClick={handleMuteToggle}
                                                                        className="gap-1.5 text-xs"
                                                                    >
                                                                        {buzzerPending ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : isOn ? (
                                                                            <VolumeX className="h-3.5 w-3.5" />
                                                                        ) : (
                                                                            <Volume2 className="h-3.5 w-3.5" />
                                                                        )}
                                                                        {buzzerPending ? "Pending…" : isOn ? "Mute Alarm" : "Unmute Alarm"}
                                                                    </Button>
                                                                );
                                                            })()}

                                                            {/* Resolve */}
                                                            {(activeEpisode.status === "active" || pendingAction !== null) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={isActing || rpiActive || !canAct}
                                                                    onClick={handleResolve}
                                                                    className="gap-1.5 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                                                >
                                                                    {isActing && pendingAction === "resolved"
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        : <CheckCircle className="h-3.5 w-3.5" />
                                                                    }
                                                                    Mark as Resolved
                                                                </Button>
                                                            )}

                                                            {/* False Alarm */}
                                                            {(activeEpisode.status === "active" || pendingAction !== null) && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={isActing || rpiActive || !canAct}
                                                                    onClick={handleFalseAlarm}
                                                                    className="gap-1.5 text-xs text-muted-foreground"
                                                                >
                                                                    {isActing && pendingAction === "false_alarm"
                                                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        : <XCircle className="h-3.5 w-3.5" />
                                                                    }
                                                                    Mark as False Alarm
                                                                </Button>
                                                            )}

                                                            {/* Dismiss — only for resolved / false_alarm */}
                                                            {(activeEpisode.status === "resolved" || activeEpisode.status === "false_alarm") && !pendingAction && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={isDismissing}
                                                                    onClick={handleDismiss}
                                                                    className="gap-1.5 text-xs text-muted-foreground"
                                                                >
                                                                    {isDismissing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                                                                    Dismiss
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Resolve / False Alarm confirmation modal */}
                                                <Dialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                {confirmAction === "resolved" ? "Resolve Alert" : "Mark as False Alarm"}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                {confirmAction === "resolved"
                                                                    ? "Provide a resolution message before closing this alert."
                                                                    : "Provide a reason for marking this alert as a false alarm."}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="py-2">
                                                            <Textarea
                                                                placeholder="Enter resolution message…"
                                                                value={resolutionMessage}
                                                                onChange={(e) => setResolutionMessage(e.target.value)}
                                                                className="resize-none"
                                                                rows={4}
                                                            />
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button variant="outline" onClick={() => setConfirmAction(null)}>
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                disabled={!resolutionMessage.trim()}
                                                                onClick={handleConfirmAction}
                                                                className={confirmAction === "resolved" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                                            >
                                                                {confirmAction === "resolved" ? "Confirm Resolve" : "Confirm False Alarm"}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardContent>
                            )}
                        </Card>

                        {/* Camera Snapshots */}
                        <Card className={activeEpisode ? "flex-1 flex flex-col" : ""}>
                            <CardHeader className="pb-1 pt-3 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold text-brand-blue">Camera Snapshots</CardTitle>
                                    {activeEpisode && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 gap-1.5 text-xs"
                                            disabled={requesting || activeEpisode?.status !== "active"}
                                            onClick={requestCapture}
                                        >
                                            {requesting
                                                ? <><Loader2 className="h-3 w-3 animate-spin" /> Capturing…</>
                                                : <><Camera className="h-3 w-3" /> Request Capture</>
                                            }
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {!activeEpisode ? (
                                <CardContent className="px-4 pb-3">
                                    <p className="text-sm text-muted-foreground">No active alerts.</p>
                                </CardContent>
                            ) : (
                                <CardContent className="px-4 pb-3 flex flex-col gap-3 flex-1">
                                    {/* Headcount row */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Headcount</p>
                                            {(() => {
                                                const lastDetected = cardLogs.find((l) => l.total_count > 0);
                                                return (
                                                    <p className="text-xs text-muted-foreground">
                                                        {lastDetected
                                                            ? `Person detected at ${new Date(lastDetected.ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                                                            : "No person detected yet"
                                                        }
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                        <span className={`text-xl font-bold ${cardLogs.length === 0 ? "text-muted-foreground" : "text-brand-blue"}`}>
                                            {cardLogs.length === 0 ? "—" : cardLogs[0].total_count}
                                        </span>
                                    </div>

                                    {/* Snapshot carousel */}
                                    {cardLogs.length === 0 ? (
                                        <div
                                            className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 transition-colors"
                                            onClick={openFullscreen}
                                        >
                                            {requesting ? (
                                                <>
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground">Capturing…</p>
                                                </>
                                            ) : (
                                                <p className="text-xs text-muted-foreground text-center px-4">
                                                    Waiting for first capture…
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className="relative cursor-pointer"
                                                onClick={openFullscreen}
                                                onTouchStart={handleTouchStart}
                                                onTouchMove={handleTouchMove}
                                                onTouchEnd={handleTouchEnd}
                                            >
                                                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                                    {cardLogs[currentImageIndex]?.image_url ? (
                                                        <>
                                                            <img
                                                                key={cardLogs[currentImageIndex].id}
                                                                src={cardLogs[currentImageIndex].image_url!}
                                                                alt="Headcount capture"
                                                                className="w-full h-full object-cover"
                                                                onLoad={() => setCardImageLoading(false)}
                                                            />
                                                            {cardImageLoading && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <p className="text-xs text-muted-foreground">Upload pending…</p>
                                                        </div>
                                                    )}
                                                    {cardLogs[currentImageIndex] && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 rounded-b-lg flex items-center justify-between">
                                                            <p className="text-xs text-white/90">
                                                                {new Date(cardLogs[currentImageIndex].ts * 1000).toLocaleTimeString()}
                                                            </p>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs text-white/90 font-semibold">
                                                                    {cardLogs[currentImageIndex].total_count} person{cardLogs[currentImageIndex].total_count !== 1 ? "s" : ""}
                                                                </span>
                                                                <span className="text-xs text-white/60">
                                                                    {cardLogs[currentImageIndex].trigger_source === "manual" ? "· Manual" : "· Auto"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                {cardLogs.length > 1 && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); handlePrevImage(cardLogs.length); }}
                                                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-7 w-7"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => { e.stopPropagation(); handleNextImage(cardLogs.length); }}
                                                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white h-7 w-7"
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            {/* Dot indicators + caption */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex justify-center gap-1.5">
                                                    {cardLogs.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                                                            className="w-1.5 h-1.5 rounded-full transition-all"
                                                            style={{ backgroundColor: index === currentImageIndex ? "hsl(var(--brand-blue))" : "#CBD5E1" }}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {totalCaptured > 5
                                                        ? `Showing last 5 of ${totalCaptured} captures`
                                                        : `${totalCaptured} capture${totalCaptured !== 1 ? "s" : ""} this episode`
                                                    }
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* ── Sensor Readings (2-col grid) ──────────────────────────── */}
                    <Card className="flex flex-col">
                        <CardHeader className="pb-1 pt-3 px-4">
                            <CardTitle className="text-base font-bold text-brand-blue">Sensor Readings</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 flex-1 flex items-center">
                            <div className="grid grid-cols-2 gap-3 w-full">
                                {STATIC_SENSORS.map((sensor) => (
                                    <Card key={sensor.name}>
                                        <CardContent className="p-3 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-base font-semibold text-brand-blue">{sensor.name}</h3>
                                                <p className="text-sm font-semibold text-brand-blue">
                                                    {formatSensorValue(sensor, latestReading)}
                                                    <span className="text-gray-400 font-medium ml-1 text-xs">{sensor.unit}</span>
                                                </p>
                                            </div>
                                            <div className="border-t border-gray-100 pt-1">
                                                {isDeviceConnected ? (
                                                    <SensorReadingGraph
                                                        dataKey={sensor.dataKey}
                                                        color={sensor.color}
                                                        unit={sensor.unit}
                                                        minVal={sensor.minVal}
                                                        maxVal={sensor.maxVal}
                                                        height={120}
                                                        readings={displayReadings}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-[120px]">
                                                        <p className="text-xs text-muted-foreground text-center italic">Pyrolert device is disconnected</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-center">
                                                <SensorStatusBadge status={isDeviceConnected ? getLiveStatus(sensor, latestReading) : "offline"} />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>


            {/* ── Fullscreen Camera Overlay ─────────────────────────────────────── */}
            {isFullscreen && allLogs.length > 0 && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
                    style={{ touchAction: "none", WebkitOverflowScrolling: "touch", overscrollBehavior: "none" }}
                    onClick={closeFullscreen}
                >
                    <div
                        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ height: "calc(100vh - 2rem)", maxHeight: "calc(100vh - 2rem)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
                            <h2 className="text-base font-semibold text-gray-900">Headcount Captures</h2>
                            <Button variant="ghost" size="icon" onClick={closeFullscreen}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Modal body — HeadcountCarousel fills the remaining space */}
                        <div className="flex-1 overflow-hidden min-h-0">
                            <HeadcountCarousel
                                allLogs={allLogs}
                                showRequestCapture
                                requesting={requesting}
                                onRequestCapture={requestCapture}
                                isEpisodeActive={activeEpisode?.status === "active"}
                                initialIndex={currentImageIndex}
                            />
                        </div>
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
