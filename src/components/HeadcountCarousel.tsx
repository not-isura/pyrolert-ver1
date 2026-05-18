"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export type HeadcountLog = Tables<"headcount_logs">;

interface HeadcountCarouselProps {
    allLogs: HeadcountLog[];
    showRequestCapture: boolean;
    requesting?: boolean;
    onRequestCapture?: () => void;
    isEpisodeActive?: boolean;
    initialIndex?: number;
}

export default function HeadcountCarousel({
    allLogs,
    showRequestCapture,
    requesting = false,
    onRequestCapture,
    isEpisodeActive = false,
    initialIndex = 0,
}: HeadcountCarouselProps) {
    const [index,        setIndex]        = useState(initialIndex);
    const [imageLoading, setImageLoading] = useState(false);
    const [lightbox,     setLightbox]     = useState(false);
    const captureListRef = useRef<HTMLDivElement>(null);
    const touchStartX    = useRef(0);
    const touchEndX      = useRef(0);
    const prevLength     = useRef(allLogs.length);

    // Jump to latest when a new capture arrives
    useEffect(() => {
        if (allLogs.length > prevLength.current) setIndex(0);
        prevLength.current = allLogs.length;
    }, [allLogs.length]);

    // Clamp index if logs shrink (defensive)
    useEffect(() => {
        if (allLogs.length > 0 && index >= allLogs.length) setIndex(0);
    }, [allLogs.length, index]);

    // Scroll active list item into view
    useEffect(() => {
        if (!captureListRef.current) return;
        const el = captureListRef.current.querySelector('[data-active="true"]');
        el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, [index]);

    // Show spinner when navigating to an image
    useEffect(() => {
        const log = allLogs[index];
        if (log?.image_url && log?.status !== "timeout") setImageLoading(true);
    }, [index]);

    const handlePrev = () => setIndex(i => i === 0 ? allLogs.length - 1 : i - 1);
    const handleNext = () => setIndex(i => i === allLogs.length - 1 ? 0 : i + 1);

    const handlePrevDetected = () => {
        const len = allLogs.length;
        for (let i = 1; i <= len; i++) {
            const idx = (index - i + len) % len;
            if (allLogs[idx].total_count > 0) { setIndex(idx); return; }
        }
    };

    const handleNextDetected = () => {
        const len = allLogs.length;
        for (let i = 1; i <= len; i++) {
            const idx = (index + i) % len;
            if (allLogs[idx].total_count > 0) { setIndex(idx); return; }
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchMove  = (e: React.TouchEvent) => { touchEndX.current   = e.touches[0].clientX; };
    const handleTouchEnd   = () => {
        if (touchStartX.current - touchEndX.current > 50)  handleNext();
        if (touchStartX.current - touchEndX.current < -50) handlePrev();
    };

    const log = allLogs[index] as HeadcountLog | undefined;
    const detectionCount       = allLogs.filter(l => l.total_count > 0).length;
    const currentHasDetection  = (log?.total_count ?? 0) > 0;
    const detectedNavDisabled  = detectionCount === 0 || (currentHasDetection && detectionCount === 1);

    if (allLogs.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No captures for this episode.
            </div>
        );
    }

    return (
        <>
            <div
                className="flex flex-col sm:flex-row h-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* ── Image ── */}
                <div className="flex-1 min-w-0 bg-gray-100 flex items-center justify-center p-4">
                    <div className="relative w-full">
                        <div className="w-full aspect-video bg-gray-800 rounded-xl overflow-hidden relative">
                            {log?.status === "timeout" ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <div className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-4 py-2 rounded-lg">
                                        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block shrink-0" />
                                        <p className="text-orange-300 text-sm font-medium">Capture timed out</p>
                                    </div>
                                    <p className="text-white/40 text-xs">Camera did not respond in time</p>
                                </div>
                            ) : log?.image_url ? (
                                <>
                                    <img
                                        key={log.id}
                                        src={log.image_url}
                                        alt="Headcount capture"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onLoad={() => setImageLoading(false)}
                                        onClick={() => setLightbox(true)}
                                    />
                                    {imageLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                            <Loader2 className="h-8 w-8 text-white/60 animate-spin" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <p className="text-white/50 text-sm">Upload pending…</p>
                                </div>
                            )}
                        </div>
                        <Button
                            size="icon"
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white border-0 w-10 h-10"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white border-0 w-10 h-10"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* ── Panel ── */}
                <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l flex flex-col overflow-hidden shrink-0">

                    {/* Counter + nav */}
                    <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
                        <span className="text-sm font-semibold text-gray-700">
                            {index + 1} / {allLogs.length}
                        </span>
                        <div className="flex items-center gap-0.5">
                            <Button
                                size="icon" variant="outline"
                                className="h-7 w-7 border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                                title="Previous capture with person detected"
                                onClick={handlePrevDetected}
                                disabled={detectedNavDisabled}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePrev}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon" variant="outline"
                                className="h-7 w-7 border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-30"
                                title="Next capture with person detected"
                                onClick={handleNextDetected}
                                disabled={detectedNavDisabled}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Capture details */}
                    {log && (
                        <div className="px-5 py-4 border-b space-y-3 shrink-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-gray-900">{log.total_count}</span>
                                <span className="text-lg text-gray-500">{log.total_count === 1 ? "person" : "persons"} detected</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-green-600 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shrink-0" />
                                    High: <strong>{log.high_count}</strong>
                                </span>
                                <span className="text-sm text-yellow-600 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block shrink-0" />
                                    Mid: <strong>{log.mid_count}</strong>
                                </span>
                                <span className="text-sm text-red-500 flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block shrink-0" />
                                    Low: <strong>{log.low_count}</strong>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{new Date(log.ts * 1000).toLocaleTimeString()}</span>
                                <span className="text-gray-300">·</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                    {log.trigger_source === "manual" ? "Manual" : "Auto"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Request capture — monitoring dashboard only */}
                    {showRequestCapture && (
                        <div className="px-4 py-3 border-b shrink-0">
                            <Button
                                className="w-full gap-1.5"
                                disabled={requesting || !isEpisodeActive}
                                onClick={onRequestCapture}
                            >
                                {requesting
                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Requesting…</>
                                    : <><Camera className="h-4 w-4" /> Request Capture</>
                                }
                            </Button>
                        </div>
                    )}

                    {/* Captures list */}
                    <div ref={captureListRef} className="flex-1 overflow-y-auto min-h-0 pb-3 pr-1">
                        {allLogs.map((l, i) => (
                            <button
                                key={l.id}
                                data-active={i === index ? "true" : undefined}
                                onClick={() => setIndex(i)}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors border-l-2 ${
                                    i === index
                                        ? "bg-blue-50 border-blue-500"
                                        : "hover:bg-gray-50 border-transparent"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                                    <span className="text-xs text-gray-600">
                                        {new Date(l.ts * 1000).toLocaleTimeString()}
                                    </span>
                                </div>
                                {l.status === "timeout" ? (
                                    <span className="text-xs font-medium text-orange-500 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block shrink-0" />
                                        Timeout
                                    </span>
                                ) : (
                                    <span className={`text-xs font-semibold ${l.total_count > 0 ? "text-gray-900" : "text-gray-400"}`}>
                                        {l.total_count} {l.total_count === 1 ? "person" : "persons"}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && log?.image_url && (
                <div
                    className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
                    onClick={() => setLightbox(false)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/35"
                        onClick={() => setLightbox(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>
                    <img
                        src={log.image_url}
                        alt="Headcount capture"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
