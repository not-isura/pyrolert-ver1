import { cn } from "@/lib/utils";

interface ConnectionStatusBadgeProps {
  connected: boolean;
  className?: string;
}

export const ConnectionStatusBadge = ({ connected, className }: ConnectionStatusBadgeProps) => {
  return (
    <div
      className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-brand-blue", className)}
      style={{
        backgroundColor: connected ? 'hsl(var(--brand-blue))' : 'transparent',
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: connected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--brand-blue))'
        }}
      />
      <span
        className="text-xs font-medium"
        style={{
          color: connected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--brand-blue))'
        }}
      >
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};
