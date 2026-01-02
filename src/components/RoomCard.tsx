"use client";

import { StatusBadge, StatusType } from "./StatusBadge";
import { Thermometer, Activity, Users } from "lucide-react";

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
  // Status color mapping
  const statusColors = {
    normal: { bg: "#D5F5DA", text: "#006D33", highlight: "#006D33" },
    warning: { bg: "#FFF4E5", text: "#9E6024", highlight: "#9E6024" },
    alert: { bg: "#FFE5E5", text: "#9C0006", highlight: "#9C0006" },
    error: { bg: "#F5F5F5", text: "#4D4D4E", highlight: "#4D4D4E" }
  };

  const currentStatus = statusColors[status];

  // All sensors to display in 2x2 grid (always shown)
  const allSensors = [
    { key: 'co', label: 'CO', active: sensors.co },
    { key: 'no2', label: 'NO₂', active: sensors.no2 },
    { key: 'o2', label: 'O₂', active: sensors.o2 },
    { key: 'pm', label: 'PM', active: sensors.pm25 || sensors.pm10 }
  ];

  return (
    <div 
      onClick={onClick}
      className="relative w-full bg-white rounded-xl shadow-sm border border-[#E2E8F0] hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ fontFamily: 'Inter, Poppins, sans-serif' }}
    >
      {/* Status Highlight Bar */}
      <div 
        className="absolute top-0 left-0 right-0 h-[6px] rounded-t-xl"
        style={{ backgroundColor: currentStatus.highlight }}
      />

      {/* Card Content */}
      <div className="p-4 sm:p-5 pt-5 sm:pt-6 flex flex-col gap-2">
        {/* Room Name */}
        <h3 className="text-lg sm:text-[20px] font-bold text-brand-blue truncate">
          {roomName}
        </h3>

        {/* Status Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="h-4 w-4 text-brand-blue flex-shrink-0" />
          <span className="text-xs sm:text-[14px] font-semibold text-brand-blue">Status:</span>
          <StatusBadge status={status} />
        </div>

        {/* Occupants Row */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-blue flex-shrink-0" />
          <span className="text-xs sm:text-[14px] font-semibold text-brand-blue">Occupants:</span>
          <span className="text-xs sm:text-[14px] font-medium">{occupants}</span>
        </div>

        {/* Temperature */}
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-brand-blue" />
          <span className="text-xs sm:text-[14px] font-semibold text-brand-blue">Temperature:</span>
          <span className="text-sm sm:text-[16px] font-medium text-text-primary">{temperature}°C</span>
        </div>

        {/* Divider Line */}
        <div className="border-t border-[#F1C94E] my-2" />

        {/* Active Sensors Section */}
        <div className="mt-1">
          <h4 className="text-xs sm:text-[14px] font-semibold text-brand-blue mb-2">
            Active Sensors
          </h4>
          
          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-2">
            {allSensors.map((sensor) => (
              <div
                key={sensor.key}
                className="flex items-center justify-center px-2 py-2 sm:py-3 border rounded-lg text-xs sm:text-[14px] font-medium transition-all duration-200"
                style={{
                  backgroundColor: sensor.active ? 'hsl(var(--brand-blue))' : 'transparent',
                  borderColor: sensor.active ? 'hsl(var(--brand-blue))' : '#CBD5E1',
                  color: sensor.active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--brand-blue))'
                }}
              >
                {sensor.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
