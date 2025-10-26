import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [rooms] = useState(mockRooms);

  const handleLogout = () => {
    navigate("/");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleAddRoom = () => {
    navigate("/register-room");
  };

  const handleRoomClick = (roomId: string) => {
    navigate(`/room-data?id=${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Admin User" onLogout={handleLogout} onSettings={handleSettings} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Room Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-muted-foreground/30 flex items-center justify-center min-h-[200px]"
                onClick={handleAddRoom}
              >
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-lg font-medium text-muted-foreground">Add New Room</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
