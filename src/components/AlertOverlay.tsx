"use client";

import { AlertTriangle, ChevronDown, Flame, Minus, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AlertEpisode } from "@/hooks/useAlertEpisode";

export type OverlayState = "open" | "minimized" | "hidden";

interface AlertOverlayProps {
    state: OverlayState;
    episode: AlertEpisode;
    animationKey: number;
    webMuted: boolean;
    onToggleWebMuted: () => void;
    onMinimize: () => void;
    onExpand: () => void;
    onViewReport: () => void;
}

const KEYFRAMES = `
@keyframes backdropPulseWarning {
    0%, 100% { background-color: rgba(0, 0, 0, 0.55); }
    50%       { background-color: rgba(245, 158, 11, 0.28); }
}
@keyframes backdropPulseHighAlert {
    0%, 100% { background-color: rgba(0, 0, 0, 0.60); }
    50%       { background-color: rgba(239, 68, 68, 0.42); }
}
@keyframes iconScaleWarning {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.15); }
}
@keyframes iconScaleHighAlert {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.15); }
}
@keyframes slideUpFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
`;

export default function AlertOverlay({
    state,
    episode,
    animationKey,
    webMuted,
    onToggleWebMuted,
    onMinimize,
    onExpand,
    onViewReport,
}: AlertOverlayProps) {
    if (state === "hidden") return null;

    const severity = episode.current_state.trim().toLowerCase().replace(/\s+/g, "_");
    const isHigh   = severity === "high_alert";

    const theme = isHigh ? {
        bar:           "bg-red-600",
        cardBg:        "#ffffff",
        borderColor:   "#dc2626",
        iconBg:        "rgba(239, 68, 68, 0.10)",
        iconColor:     "#dc2626",
        badgeBg:       "rgba(239, 68, 68, 0.10)",
        badgeText:     "#dc2626",
        title:         "#111827",
        subtitle:      "#6b7280",
        action:        "bg-red-600 hover:bg-red-700",
        outlineBorder: "#dc2626",
        outlineText:   "#dc2626",
        outlineHover:  "rgba(220, 38, 38, 0.08)",
    } : {
        bar:           "bg-amber-500",
        cardBg:        "#ffffff",
        borderColor:   "#d97706",
        iconBg:        "rgba(245, 158, 11, 0.10)",
        iconColor:     "#d97706",
        badgeBg:       "rgba(245, 158, 11, 0.10)",
        badgeText:     "#d97706",
        title:         "#111827",
        subtitle:      "#6b7280",
        action:        "bg-amber-500 hover:bg-amber-600",
        outlineBorder: "#d97706",
        outlineText:   "#d97706",
        outlineHover:  "rgba(217, 119, 6, 0.08)",
    };

    const label          = isHigh ? "HIGH ALERT" : "WARNING";
    const backdropAnim   = isHigh ? "backdropPulseHighAlert 1s ease-in-out infinite" : "backdropPulseWarning 2s ease-in-out infinite";
    const iconAnim       = isHigh ? "iconScaleHighAlert 1s ease-in-out infinite"     : "iconScaleWarning 2s ease-in-out infinite";

    const banner = (
        <div
            className={`w-full ${theme.bar} text-white flex items-center justify-between px-4 py-2 select-none`}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={onExpand}
                onKeyDown={(e) => e.key === "Enter" && onExpand()}
                className="flex items-center gap-2 cursor-pointer flex-1"
            >
                {isHigh
                    ? <Flame className="h-4 w-4 shrink-0" />
                    : <AlertTriangle className="h-4 w-4 shrink-0" />
                }
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs opacity-80">— tap to expand</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleWebMuted(); }}
                    className="p-1 rounded opacity-80 hover:opacity-100 transition-opacity"
                    aria-label={webMuted ? "Unmute web alarm" : "Mute web alarm"}
                >
                    {webMuted
                        ? <VolumeX className="h-4 w-4" />
                        : <Volume2 className="h-4 w-4" />
                    }
                </button>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-80" />
            </div>
        </div>
    );

    /* ── Minimized: banner only ── */
    if (state === "minimized") return banner;

    /* ── Full overlay: banner stays rendered + backdrop card on top ── */
    return (
        <>
            <style>{KEYFRAMES}</style>

            {banner}

            {/* Pulsing backdrop */}
            <div
                className="fixed inset-0 z-[45] flex items-center justify-center p-4"
                style={{ animation: backdropAnim }}
            >
                {/* Slide-up card — key changes on each open/escalation to re-trigger animation */}
                <div
                    key={animationKey}
                    className="w-full max-w-xs rounded-2xl border-2 shadow-2xl p-6 flex flex-col gap-5"
                    style={{
                        animation: "slideUpFadeIn 0.3s ease-out forwards",
                        backgroundColor: theme.cardBg,
                        borderColor: theme.borderColor,
                    }}
                >
                    {/* Pulsing icon */}
                    <div className="flex justify-center">
                        <div
                            className="rounded-full p-3"
                            style={{
                                backgroundColor: theme.iconBg,
                                animation: iconAnim,
                                display: "inline-flex",
                            }}
                        >
                            {isHigh
                                ? <Flame      style={{ width: 32, height: 32, color: theme.iconColor }} />
                                : <AlertTriangle style={{ width: 32, height: 32, color: theme.iconColor }} />
                            }
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="flex justify-center">
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                        >
                            {isHigh
                                ? <Flame className="h-3.5 w-3.5" />
                                : <AlertTriangle className="h-3.5 w-3.5" />
                            }
                            {label}
                        </span>
                    </div>

                    {/* Title + timestamp */}
                    <div className="text-center space-y-1">
                        <h2 className="text-xl font-bold" style={{ color: theme.title }}>
                            {isHigh ? "Critical Alert Detected" : "Warning Alert Detected"}
                        </h2>
                        <p className="text-xs" style={{ color: theme.subtitle }}>
                            Triggered {new Date(episode.started_ts * 1000).toLocaleString()}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <Button
                            className={`w-full text-white gap-1.5 ${theme.action}`}
                            onClick={onViewReport}
                        >
                            View Report
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-1.5"
                            style={{
                                borderColor: theme.outlineBorder,
                                color: theme.outlineText,
                                backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.outlineHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            onClick={onToggleWebMuted}
                        >
                            {webMuted
                                ? <><Volume2 className="h-4 w-4" /> Unmute Alarm</>
                                : <><VolumeX className="h-4 w-4" /> Mute Alarm</>
                            }
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full gap-1.5"
                            style={{
                                borderColor: theme.outlineBorder,
                                color: theme.outlineText,
                                backgroundColor: "transparent",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.outlineHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            onClick={onMinimize}
                        >
                            <Minus className="h-4 w-4" />
                            Minimize
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
