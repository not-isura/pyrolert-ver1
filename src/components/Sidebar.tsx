"use client";

import { Home, BarChart3, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/providers";

const navItems = [
  { 
    title: "Dashboard", 
    icon: Home, 
    path: "/dashboard",
    roles: ['admin', 'security', 'dean', 'facility', 'director'] 
  },
  { 
    title: "Room Recent Data", 
    icon: BarChart3, 
    path: "/room-data",
    roles: ['admin', 'security', 'dean', 'facility', 'director'] 
  },
  { 
    title: "All Event Logs", 
    icon: FileText, 
    path: "/event-logs",
    roles: ['admin', 'security', 'dean', 'facility', 'director'] 
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );
  
  return (
    <aside className="hidden lg:block lg:w-16 xl:w-64 bg-card border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <nav className="p-2 lg:p-4 space-y-2">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-colors justify-center xl:justify-start",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="hidden xl:inline truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
