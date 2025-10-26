"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { RoomCard } from "@/components/RoomCard";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

// Mock data - will be replaced with actual data from backend
const mockRooms = [
  {
    id: "1",
    roomName: "Conference Room A",
    status: "normal" as const,
    occupants: 12,
    temperature: 22,
    sensors: { co: true, no2: true, o2: true, pm25: true, pm10: true },
  },
  {
    id: "2",
    roomName: "Laboratory B",
    status: "warning" as const,
    occupants: 5,
    temperature: 26,
    sensors: { co: true, no2: true, o2: true, pm25: false, pm10: false },
  },
  {
    id: "3",
    roomName: "Storage Room C",
    status: "alert" as const,
    occupants: 2,
    temperature: 31,
    sensors: { co: true, no2: false, o2: true, pm25: true, pm10: true },
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [rooms] = useState(mockRooms);

  const handleLogout = () => {
    router.push("/");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleAddRoom = () => {
    router.push("/register-room");
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/room-data?id=${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Admin User" onLogout={handleLogout} onSettings={handleSettings} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-[1920px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Room Overview</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  roomName={room.roomName}
                  status={room.status}
                  occupants={room.occupants}
                  temperature={room.temperature}
                  sensors={room.sensors}
                  onClick={() => handleRoomClick(room.id)}
                />
              ))}
              
              {/* Add New Room Button */}
              <div 
                onClick={handleAddRoom}
                className="relative w-full bg-white rounded-xl shadow-sm border-2 border-dashed border-[#CBD5E1] hover:shadow-md hover:border-[#002147] transition-all duration-200 cursor-pointer overflow-hidden flex items-center justify-center min-h-[280px]"
                style={{ fontFamily: 'Inter, Poppins, sans-serif' }}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <Plus className="h-12 w-12 text-[#002147]" />
                  <p className="text-[16px] font-semibold text-[#002147]">Add New Room</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
