"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { RoomCard } from "@/components/RoomCard";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getRooms, getSensorsByRoom, type Room, type Sensor } from "@/services/supabaseService";
import { usePermissions } from "@/hooks/use-permissions";

export default function Dashboard() {
  const router = useRouter();
  const { canAddRoom } = usePermissions();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Dashboard: Loading rooms...');
      
      // Fetch rooms from Supabase
      const roomsData = await getRooms();
      console.log('Dashboard: Rooms fetched:', roomsData);
      
      // For each room, fetch its sensors to determine which sensors are active
      const roomsWithSensors = await Promise.all(
        roomsData.map(async (room) => {
          console.log(`Dashboard: Loading sensors for room ${room.id}`);
          const sensors = await getSensorsByRoom(room.id);
          console.log(`Dashboard: Sensors for ${room.id}:`, sensors);
          
          // Map room status to component status
          const statusMap: { [key: string]: 'normal' | 'warning' | 'alert' } = {
            'normal': 'normal',
            'warning': 'warning',
            'alert': 'alert',
            'maintenance': 'warning',
          };
          
          // Get temperature sensor value
          const tempSensor = sensors.find(s => s.type === 'temperature');
          const temperature = tempSensor ? tempSensor.value : 22;
          
          // Determine which sensors are connected/active
          const sensorStatus = {
            co: sensors.some(s => s.type === 'co' && s.connected),
            no2: sensors.some(s => s.type === 'no2' && s.connected),
            o2: sensors.some(s => s.type === 'o2' && s.connected),
            pm25: sensors.some(s => s.type === 'pm25' && s.connected),
            pm10: sensors.some(s => s.type === 'pm10' && s.connected),
          };
          
          return {
            id: room.id,
            roomName: room.name,
            status: statusMap[room.status] || 'normal',
            occupants: room.occupants || 0,
            temperature: Math.round(temperature),
            sensors: sensorStatus,
          };
        })
      );
      
      console.log('Dashboard: Final rooms with sensors:', roomsWithSensors);
      setRooms(roomsWithSensors);
    } catch (err) {
      console.error('Dashboard: Error loading rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            
            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading rooms...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={loadRooms}
                  className="mt-2 text-sm text-red-700 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
            
            {!loading && !error && (
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
                
                {/* Add New Room Button - Only visible for Admin */}
                {canAddRoom && (
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
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
