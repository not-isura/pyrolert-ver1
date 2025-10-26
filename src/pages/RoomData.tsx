"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Pause, RotateCcw, AlertTriangle, Download, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";

export default function RoomData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") || "1";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState("1");

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
    temperature: { value: 22, connected: true },
    co: { value: 5, connected: true },
    no2: { value: 12, connected: true },
    o2: { value: 20.9, connected: false },
    pm25: { value: 8, connected: true },
    pm10: { value: 15, connected: true },
    timestamp: new Date().toLocaleString(),
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

  // Status configurations
  const statusConfig = {
    normal: { color: "#006D33", bg: "#D5F5DA", label: "Normal" },
    warning: { color: "#9E6024", bg: "#FFF4E5", label: "Warning" },
    alert: { color: "#9C0006", bg: "#FFE5E5", label: "High Alert" }
  };

  const currentStatusConfig = statusConfig[roomData.status];

  // Sensor data array
  const sensors = [
    { name: "Temperature", value: `${roomData.temperature.value}°C`, connected: roomData.temperature.connected },
    { name: "CO Level", value: `${roomData.co.value} ppm`, connected: roomData.co.connected },
    { name: "NO₂ Level", value: `${roomData.no2.value} ppb`, connected: roomData.no2.connected },
    { name: "O₂ Level", value: `${roomData.o2.value}%`, connected: roomData.o2.connected },
    { name: "PM2.5 Level", value: `${roomData.pm25.value} μg/m³`, connected: roomData.pm25.connected },
    { name: "PM10 Level", value: `${roomData.pm10.value} μg/m³`, connected: roomData.pm10.connected },
  ];

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
              
              {/* Left Side: Sensor Cards in 3x2 Grid */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  
                  {sensors.map((sensor, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 sm:p-6">
                        {/* Sensor Name and Reading in one row */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base sm:text-lg font-semibold text-[#002147]">
                            {sensor.name}
                          </span>
                          <span className="text-xl sm:text-2xl font-bold text-[#002147]">
                            {sensor.value}
                          </span>
                        </div>
                        
                        {/* Connection Indicator */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-[#002147]"
                          style={{
                            backgroundColor: sensor.connected ? '#002147' : 'transparent',
                          }}
                        >
                          <span 
                            className="text-xs sm:text-sm font-medium"
                            style={{
                              color: sensor.connected ? '#FFFFFF' : '#002147'
                            }}
                          >
                            {sensor.connected ? 'Connected' : 'Disconnected'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                </div>

                {/* Camera Snapshots Carousel */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Camera Snapshots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Main Image Display */}
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">
                          {cameraImages[currentImageIndex].label}
                        </p>
                      </div>
                      
                      {/* Left Arrow */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      
                      {/* Right Arrow */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                      
                      {/* Indicator Dots */}
                      <div className="flex justify-center gap-2 mt-4">
                        {cameraImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
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

              {/* Right Side: Overall Status, Occupant Count, Quick Actions */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Overall Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-[#002147]">Overall Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Status Meter - Three Sections */}
                    <div className="space-y-2">
                      {/* Meter Bar */}
                      <div className="flex h-12 rounded-lg overflow-hidden border-2 border-[#002147]">
                        {/* Normal Section */}
                        <div 
                          className="flex-1 flex items-center justify-center relative transition-all"
                          style={{
                            backgroundColor: roomData.status === 'normal' ? '#006D33' : '#D5F5DA'
                          }}
                        />
                        
                        {/* Warning Section */}
                        <div 
                          className="flex-1 flex items-center justify-center relative border-x-2 border-[#002147] transition-all"
                          style={{
                            backgroundColor: roomData.status === 'warning' ? '#9E6024' : '#FFF4E5'
                          }}
                        />
                        
                        {/* High Alert Section */}
                        <div 
                          className="flex-1 flex items-center justify-center relative transition-all"
                          style={{
                            backgroundColor: roomData.status === 'alert' ? '#9C0006' : '#FFE5E5'
                          }}
                        />
                      </div>
                      
                      {/* Labels */}
                      <div className="flex text-xs sm:text-sm font-semibold text-[#002147]">
                        <div className="flex-1 text-center">Normal</div>
                        <div className="flex-1 text-center">Warning</div>
                        <div className="flex-1 text-center">High Alert</div>
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

                {/* Occupant Count */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-6 w-6 text-[#002147]" />
                      <span className="text-lg sm:text-xl font-bold text-[#002147]">Occupant Count:</span>
                      <span className="text-lg sm:text-xl font-semibold text-[#002147]">≈</span>
                      <span className="text-2xl sm:text-3xl font-bold text-[#002147]">{roomData.occupants}</span>
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
