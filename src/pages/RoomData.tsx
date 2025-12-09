"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { SensorStatusBadge, SensorStatusType } from "@/components/SensorStatusBadge";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import TrendBadge from "@/components/TrendBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Pause, RotateCcw, AlertTriangle, Download, ChevronLeft, ChevronRight, TriangleAlert, X } from "lucide-react";
import { 
  getRooms, 
  getRoomById, 
  getSensorsByRoom, 
  getCameraSnapshotsByRoom,
  type Room, 
  type Sensor 
} from "@/services/supabaseService";

export default function RoomData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState(roomId || "");
  const [timestamp, setTimestamp] = useState("Loading...");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  // Supabase state
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [roomData, setRoomData] = useState<any>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [cameraImages, setCameraImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load rooms list on mount
  useEffect(() => {
    loadRooms();
  }, []);

  // Load room data when selected room changes
  useEffect(() => {
    if (selectedRoom) {
      loadRoomData(selectedRoom);
    }
  }, [selectedRoom]);

  // Update room ID from URL params or set first room as default
  useEffect(() => {
    if (roomId && roomId !== selectedRoom) {
      setSelectedRoom(roomId);
    } else if (!roomId && rooms.length > 0 && !selectedRoom) {
      // If no room ID in URL, select the first room
      setSelectedRoom(rooms[0].id);
      router.push(`/room-data?id=${rooms[0].id}`);
    }
  }, [roomId, rooms]);

  const loadRooms = async () => {
    try {
      console.log('Loading rooms list...');
      const roomsData = await getRooms();
      console.log('Rooms loaded:', roomsData);
      
      const roomsList = roomsData.map(room => ({
        id: room.id,
        name: room.name
      }));
      setRooms(roomsList);
      console.log('Rooms list set:', roomsList);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadRoomData = async (roomIdToLoad: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading room data for ID:', roomIdToLoad);
      console.log('Available rooms:', rooms.map(r => r.id).join(', '));
      
      // Fetch room details
      const room = await getRoomById(roomIdToLoad);
      console.log('Room data:', room);
      
      if (!room) {
        const availableRooms = rooms.length > 0 
          ? `Available rooms: ${rooms.map(r => `${r.name} (${r.id})`).join(', ')}`
          : 'No rooms available. Please check your database.';
        setError(`Room "${roomIdToLoad}" not found. ${availableRooms}`);
        setLoading(false);
        return;
      }
      
      // Fetch sensors for the room
      const sensorsData = await getSensorsByRoom(roomIdToLoad);
      console.log('Sensors data:', sensorsData);
      
      // Fetch camera snapshots
      const snapshots = await getCameraSnapshotsByRoom(roomIdToLoad);
      console.log('Camera snapshots:', snapshots);
      
      // Update timestamp
      const now = new Date().toLocaleString();
      setTimestamp(now);
      
      setRoomData(room);
      setSensors(sensorsData);
      setCameraImages(snapshots.map((snap, index) => ({
        id: snap.id,
        label: `Snapshot ${index + 1}`,
        url: snap.image_url,
        captured_at: snap.captured_at
      })));
      
    } catch (err) {
      console.error('Error loading room data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorDetails = JSON.stringify(err, null, 2);
      console.log('Error details:', errorDetails);
      setError(`Failed to load room data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Update timestamp periodically
  useEffect(() => {
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

  const currentStatusConfig = statusConfig[roomData?.status || 'normal'];

  // Helper function to get sensor by type
  const getSensor = (type: string) => {
    return sensors.find(s => s.type === type);
  };

  // Transform sensor data for display
  const sensorDisplayData = [
    { 
      name: "Temperature", 
      value: `${getSensor('temperature')?.value || 0}°C`, 
      connected: getSensor('temperature')?.connected || false,
      status: (getSensor('temperature')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('temperature')?.status === 'normal' ? 'Normal' : 
                   getSensor('temperature')?.status === 'warning' ? 'Warning' : 'Critical'
    },
    { 
      name: "CO Level", 
      value: `${getSensor('co')?.value || 0} ppm`, 
      connected: getSensor('co')?.connected || false,
      status: (getSensor('co')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('co')?.status === 'normal' ? 'Normal' : 
                   getSensor('co')?.status === 'warning' ? 'Warning' : 'Critical'
    },
    { 
      name: "NO₂ Level", 
      value: `${getSensor('no2')?.value || 0} ppb`, 
      connected: getSensor('no2')?.connected || false,
      status: (getSensor('no2')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('no2')?.status === 'normal' ? 'Normal' : 
                   getSensor('no2')?.status === 'warning' ? 'Warning' : 'Critical'
    },
    { 
      name: "O₂ Level", 
      value: `${getSensor('o2')?.value || 0}%`, 
      connected: getSensor('o2')?.connected || false,
      status: (getSensor('o2')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('o2')?.status === 'normal' ? 'Normal' : 
                   getSensor('o2')?.status === 'warning' ? 'Warning' : 'Critical'
    },
    { 
      name: "PM2.5 Level", 
      value: `${getSensor('pm25')?.value || 0} μg/m³`, 
      connected: getSensor('pm25')?.connected || false,
      status: (getSensor('pm25')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('pm25')?.status === 'normal' ? 'Normal' : 
                   getSensor('pm25')?.status === 'warning' ? 'Warning' : 'Critical'
    },
    { 
      name: "PM10 Level", 
      value: `${getSensor('pm10')?.value || 0} μg/m³`, 
      connected: getSensor('pm10')?.connected || false,
      status: (getSensor('pm10')?.status || 'normal') as SensorStatusType,
      statusLabel: getSensor('pm10')?.status === 'normal' ? 'Normal' : 
                   getSensor('pm10')?.status === 'warning' ? 'Warning' : 'Critical'
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading room data...</p>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error || !roomData) {
    return (
      <PageLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Room not found'}</p>
          <button 
            onClick={() => loadRoomData(selectedRoom)}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-[1920px] mx-auto space-y-6">
            
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
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Last updated: {timestamp}</p>
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
                      As of <span className="font-semibold">{timestamp}</span>, the <span className="font-semibold">{roomData.name}</span>'s condition is in{" "}
                      <span className="font-bold" style={{ color: currentStatusConfig.color }}>
                        {currentStatusConfig.label}
                      </span>{" "}
                      state.
                    </p>
                  </CardContent>
                </Card>

                {/* Occupant Count - Hidden on mobile, shows in right sidebar on lg+ */}
                <Card className="hidden lg:block">
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
                      <TrendBadge value={roomData.occupant_change || 0} />
                    </div>
                    
                    {/* Context Information */}
                    <div className="text-center space-y-1">
                      <p className="text-sm text-[#6B7280]">
                        vs. 30 minutes ago
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Last updated: {timestamp}
                      </p>
                    </div>
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
                  
                  {sensorDisplayData.map((sensor, index) => {
                    return (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-3">
                          {/* Header Row: Sensor Name + Connection Status */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-semibold text-[#002147]">
                              {sensor.name}
                            </h3>
                            <ConnectionStatusBadge connected={sensor.connected} />
                          </div>
                          
                          {/* Large Centered Value */}
                          <div className="text-center py-2">
                            <span className="text-2xl sm:text-3xl font-bold text-[#002147]">
                              {sensor.value}
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex justify-center">
                            <SensorStatusBadge status={sensor.status} />
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
                      <TrendBadge value={roomData.occupant_change || 0} />
                    </div>
                    
                    {/* Context Information */}
                    <div className="text-center space-y-1">
                      <p className="text-sm text-[#6B7280]">
                        vs. 30 minutes ago
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Last updated: {timestamp}
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
                          {cameraImages.length > 0 && cameraImages[currentImageIndex] 
                            ? cameraImages[currentImageIndex].label 
                            : 'No camera snapshots available'}
                        </p>
                      </div>
                      
                      {/* Left Arrow */}
                      {cameraImages.length > 1 && (
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
                      )}
                      
                      {/* Right Arrow */}
                      {cameraImages.length > 1 && (
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
                      )}
                      
                      {/* Indicator Dots */}
                      {cameraImages.length > 1 && (
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
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
    </PageLayout>
  );
}
