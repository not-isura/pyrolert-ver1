import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { StatusBadge, StatusType } from "./StatusBadge";
import { Users, Thermometer } from "lucide-react";

interface RoomCardProps {
  roomName: string;
  status: StatusType;
  occupants: number;
  temperature: number;
  sensors: {
    co: boolean;
    no2: boolean;
    o2: boolean;
    pm25: boolean;
    pm10: boolean;
  };
  onClick?: () => void;
}

export const RoomCard = ({ 
  roomName, 
  status, 
  occupants, 
  temperature, 
  sensors,
  onClick 
}: RoomCardProps) => {
  const activeSensors = Object.entries(sensors)
    .filter(([_, active]) => active)
    .map(([sensor]) => sensor.toUpperCase())
    .join(", ");

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
      style={{
        borderLeftColor: status === "normal" ? "hsl(var(--status-normal-text))" :
                         status === "warning" ? "hsl(var(--status-warning-text))" :
                         status === "alert" ? "hsl(var(--status-alert-text))" :
                         "hsl(var(--status-error-text))"
      }}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{roomName}</span>
          <StatusBadge status={status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{occupants}</span>
          <span className="text-muted-foreground">occupants</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{temperature}°C</span>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Active Sensors:</p>
          <p className="text-xs font-medium mt-1">{activeSensors || "None"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
