import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Thermometer, Wind, Activity, Users, Pause, Play, Download, AlertTriangle } from "lucide-react";

export default function RoomData() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id") || "1";

  // Mock data
  const roomData = {
    name: "Conference Room A",
    status: "normal" as const,
    occupants: 12,
    temperature: 22,
    co: 5,
    no2: 12,
    o2: 20.9,
    pm25: 8,
    pm10: 15,
    timestamp: new Date().toLocaleString(),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => navigate("/")} onSettings={() => navigate("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{roomData.name}</h2>
                <p className="text-sm text-muted-foreground">Last updated: {roomData.timestamp}</p>
              </div>
              <StatusBadge status={roomData.status} />
            </div>

            <div className="flex gap-4">
              <Input placeholder="Search sensor data..." className="max-w-md" />
              <Button variant="outline">Filter</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{roomData.temperature}°C</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    CO Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{roomData.co} ppm</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    NO₂ Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{roomData.no2} ppb</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    O₂ Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{roomData.o2}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Occupants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{roomData.occupants}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Camera Snapshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Snapshot {i}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Monitoring
                </Button>
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Restart System
                </Button>
                <Button variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mark as False Alarm
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Event Log
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
