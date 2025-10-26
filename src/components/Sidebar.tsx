import { Home, Database, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", icon: Home, path: "/dashboard" },
  { title: "Room Recent Data", icon: Database, path: "/room-data" },
  { title: "All Event Logs", icon: FileText, path: "/event-logs" },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-card border-r border-border h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
