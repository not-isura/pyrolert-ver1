"use client";

import { useState } from "react";
import { LogOut, Settings, ChevronDown, X } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

export const Header = ({ userName = "User", onLogout, onSettings }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleSettingsClick = () => {
    setIsMobileMenuOpen(false);
    onSettings?.();
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout?.();
  };

  return (
    <>
      <header className="h-16 bg-primary text-primary-foreground px-4 sm:px-6 flex items-center justify-between border-b border-border shadow-sm">
        {/* Mobile Layout */}
        <div className="flex items-center justify-between w-full lg:hidden">
          <h1 className="text-xl font-bold">Pyrolert</h1>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-accent hover:text-primary"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between w-full">
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
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Navy Blue Overlay */}
          <div className="absolute inset-0 bg-[#002147] flex flex-col">
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-8 px-6">
              {/* Logo and Branding */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-[#F1C94E] rounded-full flex items-center justify-center font-bold text-[#002147] text-3xl mx-auto">
                  P
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Pyrolert</h1>
                  <p className="text-sm text-[#F1C94E] mt-2">Smart Safety. Smart Detection.</p>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-white">Hi, {userName}!</p>
                <p className="text-sm text-white/80">{timeString}</p>
                <p className="text-sm text-white/80">{dateString}</p>
              </div>

              {/* Menu Options */}
              <div className="w-full max-w-xs space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleLogoutClick}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
