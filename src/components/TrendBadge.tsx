import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  value: number;
  size?: "sm" | "md" | "lg";
}

export default function TrendBadge({ value, size = "lg" }: TrendBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (value === 0) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100">
        <Minus className={`${sizeClasses[size]} text-gray-600`} />
        <span className={`${textSizeClasses[size]} font-bold text-gray-600`}>0</span>
      </div>
    );
  }

  const isPositive = value > 0;
  const bgColor = isPositive ? "bg-green-100" : "bg-red-100";
  const textColor = isPositive ? "text-green-600" : "text-red-600";
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${bgColor}`}>
      <Icon className={`${sizeClasses[size]} ${textColor}`} />
      <span className={`${textSizeClasses[size]} font-bold ${textColor}`}>
        {isPositive ? '+' : ''}{value}
      </span>
    </div>
  );
}
