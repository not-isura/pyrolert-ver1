"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Pause, RotateCcw, AlertTriangle, Download, ChevronLeft, ChevronRight, TriangleAlert, TrendingUp, TrendingDown, Minus, X } from "lucide-react";

export default function RoomData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") || "1";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState("1");
  const [timestamp, setTimestamp] = useState("11/8/2025, 10:30:00 AM");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Update timestamp on client side only
  useEffect(() => {
    setTimestamp(new Date().toLocaleString());
    
    // Optional: Update timestamp every minute
    const interval = setInterval(() => {
      setTimestamp(new Date().toLocaleString());
    }, 60000); // Update every 60 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Cleanup scroll lock on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.width = '';
      document.documentElement.style.height = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Prevent scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      const preventScroll = (e: TouchEvent) => {
        // Only prevent if not touching the modal's swipeable area
        const target = e.target as HTMLElement;
        const isModalContent = target.closest('[data-swipeable="true"]');
        
        if (!isModalContent) {
          e.preventDefault();
        }
      };
      
      const preventGesture = (e: Event) => {
        e.preventDefault();
      };
      
      // Add event listeners to prevent all touch scrolling and gestures
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('gestureend', preventGesture, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('gesturestart', preventGesture);
        document.removeEventListener('gesturechange', preventGesture);
        document.removeEventListener('gestureend', preventGesture);
      };
    }
  }, [isFullscreen]);

  // Mock rooms list
  const rooms = [
    { id: "1", name: "Conference Room A" },
    { id: "2", name: "Conference Room B" },
    { id: "3", name: "Laboratory 101" },
    { id: "4", name: "Office Space 1" },
  ];

  // Mock data
  const roomData = {
    name: rooms.find(r => r.id === selectedRoom)?.name || "Conference Room A",
    status: "normal" as "normal" | "warning" | "alert",
    occupants: 12,
    occupantChange: 2, // Change in last 30 min (positive = increase, negative = decrease, 0 = no change)
    lastOccupantUpdate: "2 minutes ago",
    temperature: { value: 22, connected: true },
    co: { value: 5, connected: true },
    no2: { value: 12, connected: true },
    o2: { value: 20.9, connected: false },
    pm25: { value: 8, connected: true },
    pm10: { value: 15, connected: true },
    timestamp: timestamp,
  };

  // Camera snapshots
  const cameraImages = [
    { id: 1, label: "Snapshot 1" },
    { id: 2, label: "Snapshot 2" },
    { id: 3, label: "Snapshot 3" },
    { id: 4, label: "Snapshot 4" },
  ];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? cameraImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === cameraImages.length - 1 ? 0 : prev + 1));
  };

  const handleRoomChange = (value: string) => {
    setSelectedRoom(value);
    router.push(`/room-data?id=${value}`);
  };

  // Touch/Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swiped left - next image
      handleNextImage();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      // Swiped right - previous image
      handlePrevImage();
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
    // Store current scroll position
    const scrollY = window.scrollY;
    // Lock body scroll and prevent touch actions - iOS Safari compatible
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    // Get the scroll position
    const scrollY = document.body.style.top;
    // Restore body scroll
    document.documentElement.style.overflow = '';
    document.documentElement.style.position = '';
    document.documentElement.style.width = '';
    document.documentElement.style.height = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.height = '';
    // Restore scroll position
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  };

  // Status configurations
  const statusConfig = {
    normal: { color: "#006D33", bg: "#D5F5DA", label: "Normal" },
    warning: { color: "#9E6024", bg: "#FFF4E5", label: "Warning" },
    alert: { color: "#9C0006", bg: "#FFE5E5", label: "High Alert" }
  };

  const currentStatusConfig = statusConfig[roomData.status];

  // Sensor data array with status
  const sensors = [
    { 
      name: "Temperature", 
      value: `${roomData.temperature.value}°C`, 
      connected: roomData.temperature.connected,
      status: "normal" as "normal" | "warning" | "critical",
      statusLabel: "Normal"
    },
    { 
      name: "CO Level", 
      value: `${roomData.co.value} ppm`, 
      connected: roomData.co.connected,
      status: "normal" as "normal" | "warning" | "critical",
      statusLabel: "Normal"
    },
    { 
      name: "NO₂ Level", 
      value: `${roomData.no2.value} ppb`, 
      connected: roomData.no2.connected,
      status: "normal" as "normal" | "warning" | "critical",
      statusLabel: "Normal"
    },
    { 
      name: "O₂ Level", 
      value: `${roomData.o2.value}%`, 
      connected: roomData.o2.connected,
      status: "warning" as "normal" | "warning" | "critical",
      statusLabel: "Warning"
    },
    { 
      name: "PM2.5 Level", 
      value: `${roomData.pm25.value} μg/m³`, 
      connected: roomData.pm25.connected,
      status: "normal" as "normal" | "warning" | "critical",
      statusLabel: "Normal"
    },
    { 
      name: "PM10 Level", 
      value: `${roomData.pm10.value} μg/m³`, 
      connected: roomData.pm10.connected,
      status: "normal" as "normal" | "warning" | "critical",
      statusLabel: "Normal"
    },
  ];

  // Sensor status color configurations
  const sensorStatusConfig = {
    normal: { bg: "#D5F5DA", color: "#006D33", label: "NORMAL" },
    warning: { bg: "#FFF4E5", color: "#9E6024", label: "WARNING" },
    critical: { bg: "#FFE5E5", color: "#9C0006", label: "CRITICAL" }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1920px] mx-auto">
            
            {/* Room Selector Dropdown */}
            <div className="mb-4 sm:mb-6">
              <Select value={selectedRoom} onValueChange={handleRoomChange}>
                <SelectTrigger className="w-full sm:w-[400px] text-xl sm:text-2xl font-bold h-auto py-3">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="text-lg">
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Last updated: {roomData.timestamp}</p>
            </div>

            {/* Main Layout: Sensor Grid + Right Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Right Side: Overall Status, Occupant Count, Quick Actions - Shows first on mobile */}
              <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
                
                {/* Overall Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#002147]">Overall Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Circular Status Ring */}
                    <div className="flex flex-col items-center">
                      {/* SVG Circle Progress */}
                      <div className="relative w-40 h-40">
                        <svg className="transform -rotate-90 w-40 h-40">
                          {/* Define filter for smooth shadow */}
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
                          
                          {/* Background Circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="#E5E7EB"
                            strokeWidth="12"
                            fill="none"
                          />
                          {/* Progress Circle */}
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke={currentStatusConfig.color}
                            strokeWidth="12"
                            fill="none"
                            strokeDasharray={440}
                            strokeDashoffset={
                              roomData.status === 'normal' ? 293 :
                              roomData.status === 'warning' ? 147 : 0
                            }
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-in-out"
                            filter="url(#glow)"
                          />
                        </svg>
                        
                        {/* Center Status Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div 
                            className="w-3 h-3 rounded-full mb-2 animate-pulse"
                            style={{ backgroundColor: currentStatusConfig.color }}
                          />
                          <span 
                            className="text-xl font-bold text-center px-2"
                            style={{ color: currentStatusConfig.color }}
                          >
                            {currentStatusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Description */}
                    <p className="text-sm text-center text-[#4B5563] leading-relaxed">
                      As of <span className="font-semibold">{roomData.timestamp}</span>, the <span className="font-semibold">{roomData.name}</span>'s condition is in{" "}
                      <span className="font-bold" style={{ color: currentStatusConfig.color }}>
                        {currentStatusConfig.label}
                      </span>{" "}
                      state.
                    </p>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#002147]">Quick Actions</CardTitle>
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

              {/* Left Side: Sensor Cards + Camera - Shows second on mobile */}
              <div className="lg:col-span-8 order-2 lg:order-1">
                {/* Sensor Cards in 3x2 Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  
                  {sensors.map((sensor, index) => {
                    const statusColors = sensorStatusConfig[sensor.status];
                    return (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-3">
                          {/* Header Row: Sensor Name + Connection Status */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-semibold text-[#002147]">
                              {sensor.name}
                            </h3>
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#002147]"
                              style={{
                                backgroundColor: sensor.connected ? '#002147' : 'transparent',
                              }}
                            >
                              <div 
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: sensor.connected ? '#FFFFFF' : '#002147'
                                }}
                              />
                              <span 
                                className="text-xs font-medium"
                                style={{
                                  color: sensor.connected ? '#FFFFFF' : '#002147'
                                }}
                              >
                                {sensor.connected ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Large Centered Value */}
                          <div className="text-center py-2">
                            <span className="text-2xl sm:text-3xl font-bold text-[#002147]">
                              {sensor.value}
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex justify-center">
                            <div 
                              className="px-3 py-0.5 rounded-full"
                              style={{
                                backgroundColor: statusColors.bg,
                              }}
                            >
                              <span 
                                className="text-[10px] font-bold"
                                style={{
                                  color: statusColors.color
                                }}
                              >
                                {statusColors.label}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                </div>

                {/* Occupant Count - Shows after sensors, before camera */}
                <Card className="mt-6 lg:hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#002147]">Occupants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Main Count Display */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Large Occupant Number */}
                      <div className="flex items-baseline gap-2">
                        <Users className="h-8 w-8 text-[#002147]" />
                        <span className="text-5xl font-bold text-[#002147]">{roomData.occupants}</span>
                      </div>
                      
                      {/* Trend Indicator */}
                      {roomData.occupantChange !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                          roomData.occupantChange > 0 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {roomData.occupantChange > 0 ? (
                            <TrendingUp className={`h-5 w-5 ${
                              roomData.occupantChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`text-lg font-bold ${
                            roomData.occupantChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {roomData.occupantChange > 0 ? '+' : ''}{roomData.occupantChange}
                          </span>
                        </div>
                      )}
                      
                      {roomData.occupantChange === 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100">
                          <Minus className="h-5 w-5 text-gray-600" />
                          <span className="text-lg font-bold text-gray-600">0</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Context Information */}
                    <div className="text-center space-y-1">
                      <p className="text-sm text-[#6B7280]">
                        vs. 30 minutes ago
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Last updated: {roomData.lastOccupantUpdate}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Camera Snapshots Carousel */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Camera Snapshots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="relative cursor-pointer"
                      onClick={openFullscreen}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Main Image Display */}
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors">
                        <p className="text-sm text-muted-foreground">
                          {cameraImages[currentImageIndex].label}
                        </p>
                      </div>
                      
                      {/* Left Arrow */}
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
                      
                      {/* Right Arrow */}
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
                      
                      {/* Indicator Dots */}
                      <div className="flex justify-center gap-2 mt-4">
                        {cameraImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(index);
                            }}
                            className="w-2 h-2 rounded-full transition-all"
                            style={{
                              backgroundColor: index === currentImageIndex ? '#002147' : '#CBD5E1'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Occupant Count - Hidden on mobile, shows in right sidebar on lg+ */}
              <div className="hidden lg:block lg:col-span-4 lg:order-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#002147]">Occupants</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Main Count Display */}
                    <div className="flex items-center justify-center gap-4">
                      {/* Large Occupant Number */}
                      <div className="flex items-baseline gap-2">
                        <Users className="h-8 w-8 text-[#002147]" />
                        <span className="text-5xl font-bold text-[#002147]">{roomData.occupants}</span>
                      </div>
                      
                      {/* Trend Indicator */}
                      {roomData.occupantChange !== 0 && (
                        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                          roomData.occupantChange > 0 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          {roomData.occupantChange > 0 ? (
                            <TrendingUp className={`h-5 w-5 ${
                              roomData.occupantChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`text-lg font-bold ${
                            roomData.occupantChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {roomData.occupantChange > 0 ? '+' : ''}{roomData.occupantChange}
                          </span>
                        </div>
                      )}
                      
                      {roomData.occupantChange === 0 && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100">
                          <Minus className="h-5 w-5 text-gray-600" />
                          <span className="text-lg font-bold text-gray-600">0</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Context Information */}
                    <div className="text-center space-y-1">
                      <p className="text-sm text-[#6B7280]">
                        vs. 30 minutes ago
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Last updated: {roomData.lastOccupantUpdate}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Fullscreen Camera Modal - Outside main content */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          style={{ 
            touchAction: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none'
          }}
          onClick={closeFullscreen}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            data-swipeable="true"
            style={{ 
              touchAction: 'pan-x',
              overscrollBehavior: 'none'
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
            {/* Close Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Fullscreen Image Display */}
            <div className="w-full max-w-6xl aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-2xl text-muted-foreground">
                {cameraImages[currentImageIndex].label}
              </p>
            </div>

            {/* Left Arrow - Hidden on mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevImage}
              className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            {/* Right Arrow - Hidden on mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextImage}
              className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white w-12 h-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Indicator Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex justify-center gap-3">
              {cameraImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: index === currentImageIndex ? '#FFFFFF' : '#6B7280'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
