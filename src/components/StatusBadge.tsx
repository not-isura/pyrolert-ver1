import { cn } from "@/lib/utils";

export type StatusType = "normal" | "warning" | "alert" | "error";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  normal: {
    label: "Normal",
    className: "bg-[hsl(var(--status-normal))] text-[hsl(var(--status-normal-text))]",
  },
  warning: {
    label: "Warning",
    className: "bg-[hsl(var(--status-warning))] text-[hsl(var(--status-warning-text))]",
  },
  alert: {
    label: "High Alert",
    className: "bg-[hsl(var(--status-alert))] text-[hsl(var(--status-alert-text))]",
  },
  error: {
    label: "Error",
    className: "bg-[hsl(var(--status-error))] text-[hsl(var(--status-error-text))]",
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "px-3 py-1 rounded-md text-sm font-medium inline-block",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
