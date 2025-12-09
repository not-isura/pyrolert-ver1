import { cn } from "@/lib/utils";

interface ConnectionStatusBadgeProps {
  connected: boolean;
  className?: string;
}

export const ConnectionStatusBadge = ({ connected, className }: ConnectionStatusBadgeProps) => {
  return (
    <div 
      className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#002147]", className)}
      style={{
        backgroundColor: connected ? '#002147' : 'transparent',
      }}
    >
      <div 
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: connected ? '#FFFFFF' : '#002147'
        }}
      />
      <span 
        className="text-xs font-medium"
        style={{
          color: connected ? '#FFFFFF' : '#002147'
        }}
      >
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};
