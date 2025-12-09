import { cn } from "@/lib/utils";

export type SensorStatusType = "normal" | "warning" | "critical";

interface SensorStatusBadgeProps {
  status: SensorStatusType;
  className?: string;
}

const sensorStatusConfig = {
  normal: {
    label: "NORMAL",
    bg: "#D5F5DA",
    color: "#006D33",
  },
  warning: {
    label: "WARNING",
    bg: "#FFF4E5",
    color: "#9E6024",
  },
  critical: {
    label: "CRITICAL",
    bg: "#FFE5E5",
    color: "#9C0006",
  },
};

export const SensorStatusBadge = ({ status, className }: SensorStatusBadgeProps) => {
  const config = sensorStatusConfig[status];
  
  return (
    <div 
      className={cn("px-3 py-0.5 rounded-full inline-flex items-center justify-center", className)}
      style={{
        backgroundColor: config.bg,
      }}
    >
      <span 
        className="text-[10px] font-bold"
        style={{
          color: config.color
        }}
      >
        {config.label}
      </span>
    </div>
  );
};
