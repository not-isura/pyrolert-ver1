import { LogOut, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

export const Header = ({ userName = "User", onLogout, onSettings }: HeaderProps) => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-16 bg-primary text-primary-foreground px-6 flex items-center justify-between border-b border-border shadow-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-primary">
            P
          </div>
          <div>
            <h1 className="text-xl font-bold">Pyrolert</h1>
            <p className="text-xs opacity-80">Smart Safety. Smart Detection.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-medium">Hi, {userName}!</p>
          <p className="text-xs opacity-80">{timeString} • {dateString}</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-accent hover:text-primary"
            onClick={onSettings}
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-accent hover:text-primary"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
