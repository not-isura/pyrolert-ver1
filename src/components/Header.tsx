"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { LogOut, Settings, Menu, X, Home, BarChart3, FileText } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { LoadingOverlay } from "./LoadingOverlay";

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
  onSettings?: () => void;
}

export const Header = ({ onSettings }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const scrollPosition = useRef(0);
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateString = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Small delay to show the logout indicator
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
    { title: "Room Recent Data", icon: BarChart3, path: "/room-data" },
    { title: "All Event Logs", icon: FileText, path: "/event-logs" },
  ];

  const openMobileMenu = () => {
    // Capture scroll BEFORE state change
    scrollPosition.current = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Lock/unlock scroll when mobile menu opens/closes
  useEffect(() => {
    if (isMobileMenuOpen) {
      // Use the scroll position that was captured BEFORE state change
      const currentScroll = scrollPosition.current;
      
      // Apply styles to lock scroll and maintain visual position
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScroll}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      // Get the stored position
      const savedPosition = scrollPosition.current;
      
      // Remove fixed positioning
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      
      // Restore scroll position immediately
      window.scrollTo(0, savedPosition);
    }
  }, [isMobileMenuOpen]);

  // Prevent touch scroll when menu is open (iOS compatible)
  useEffect(() => {
    if (isMobileMenuOpen) {
      const preventScroll = (e: TouchEvent) => {
        // Only prevent if not touching the menu content
        const target = e.target as HTMLElement;
        const isMenuContent = target.closest('[data-menu-content="true"]');
        
        if (!isMenuContent) {
          e.preventDefault();
        }
      };
      
      const preventGesture = (e: Event) => {
        e.preventDefault();
      };
      
      // Add event listeners to prevent scrolling and gestures
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('gesturestart', preventGesture, { passive: false });
      document.addEventListener('gesturechange', preventGesture, { passive: false });
      document.addEventListener('gestureend', preventGesture, { passive: false });
      
      return () => {
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('gesturestart', preventGesture);
        document.removeEventListener('gesturechange', preventGesture);
        document.removeEventListener('gestureend', preventGesture);
      };
    }
  }, [isMobileMenuOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, []);

  const handleSettingsClick = () => {
    closeMobileMenu();
    if (onSettings) {
      onSettings();
    } else {
      router.push('/settings');
    }
  };

  const handleLogoutClick = () => {
    closeMobileMenu();
    handleLogout();
  };

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Logging Out" isLoggingOut={true} />}
      
      <header className="sticky top-0 z-40 h-16 bg-primary text-primary-foreground px-4 sm:px-6 flex items-center justify-between border-b border-border shadow-sm">
        {/* Mobile Layout */}
        <div className="flex items-center justify-between w-full lg:hidden">
          <Image
            src="/pyrolert_light.svg"
            alt="Pyrolert"
            width={140}
            height={45}
            priority
            className="h-10 w-auto"
          />
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-accent hover:text-primary"
            onClick={openMobileMenu}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <Image
              src="/pyrolert_light.svg"
              alt="Pyrolert"
              width={200}
              height={60}
              priority
              className="h-12 w-auto"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium">Hi, {user ? `${user.firstName} ${user.lastName}` : 'User'}!</p>
              <p className="text-xs opacity-80">{timeString} • {dateString}</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary-foreground hover:bg-accent hover:text-primary"
                onClick={handleSettingsClick}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary-foreground hover:bg-accent hover:text-primary"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar - Below Header */}
      <nav className="sticky top-16 z-30 bg-white shadow-md lg:hidden">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-brand-blue"
                    : "text-gray-300 hover:text-gray-400"
                }`}
                title={item.title}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Burger Menu Overlay - 3/4 Screen Width */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Overlay Background */}
          <div 
            className="absolute inset-0 bg-black/60"
            style={{ 
              touchAction: 'none',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'none'
            }}
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel - 3/4 Width from Right */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-3/4 bg-brand-blue flex flex-col shadow-2xl"
            data-menu-content="true"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h1 className="text-xl font-bold text-white">Menu</h1>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={closeMobileMenu}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
              {/* Logo */}
              <div className="text-center space-y-3 pb-6 border-b border-white/10">
                <div className="flex items-center justify-center mx-auto">
                  <Image
                    src="/pyrolert_logo.svg"
                    alt="Pyrolert Logo"
                    width={96}
                    height={96}
                    priority
                    className="w-24 h-24"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="text-center space-y-1 pb-6 border-b border-white/10">
                <p className="text-lg font-semibold text-white">Hi, {user ? `${user.firstName} ${user.lastName}` : 'User'}!</p>
                <p className="text-sm text-white/80">{timeString}</p>
                <p className="text-sm text-white/80">{dateString}</p>
              </div>

              {/* Settings and Logout Buttons */}
              <div className="space-y-3 mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 justify-start"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-base font-semibold bg-[#FFFFF0] border-white/30 text-brand-blue hover:bg-white justify-start"
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
