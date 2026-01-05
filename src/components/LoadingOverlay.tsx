"use client";

import { Loader2, LogOut } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  isLoggingOut?: boolean;
}

export const LoadingOverlay = ({ 
  message = "Loading...", 
  isLoggingOut = false 
}: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 border border-border">
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className="relative">
            {isLoggingOut ? (
              <div className="w-16 h-16 bg-brand-blue/10 rounded-lg flex items-center justify-center">
                <LogOut className="h-8 w-8 text-brand-blue" />
              </div>
            ) : (
              <Loader2 className="h-12 w-12 text-brand-blue animate-spin" />
            )}
          </div>
          
          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {message}
            </h3>
            {isLoggingOut && (
              <p className="text-sm text-muted-foreground">
                Securely ending your session...
              </p>
            )}
          </div>
          
          {/* Loading dots animation */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-brand-blue rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
