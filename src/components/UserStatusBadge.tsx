import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type UserStatusType = "active" | "inactive";

interface UserStatusBadgeProps {
  status: UserStatusType;
  className?: string;
}

export const UserStatusBadge = ({ status, className }: UserStatusBadgeProps) => {
  return (
    <Badge 
      variant={status === "active" ? "default" : "secondary"}
      className={cn("w-[70px] inline-flex items-center justify-center capitalize", className)}
    >
      {status}
    </Badge>
  );
};
