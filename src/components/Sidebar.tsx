"use client";

import { Home, Database, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard" },
  { title: "Room Recent Data", icon: Database, path: "/room-data" },
  { title: "All Event Logs", icon: FileText, path: "/event-logs" },
];

export const Sidebar = () => {
  const pathname = usePathname();
  
  return (
    <aside className="hidden lg:block lg:w-16 xl:w-64 bg-card border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
      <nav className="p-2 lg:p-4 space-y-2">
        {navItems.map((item) => {
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
