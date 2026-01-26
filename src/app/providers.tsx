"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect } from "react";
import { getCurrentUser, logoutUser, type AuthUser } from "@/services/supabaseService";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => void;
  resetLoading: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    // Check for authenticated user on mount
    refreshUser();
    setIsLoading(false);
  }, []);

  const logout = async () => {
    setIsLoading(true); // Prevent flashing by setting loading state first
    await logoutUser();
    setUser(null);
    // Keep isLoading true - it will redirect to login page
  };

  const resetLoading = () => {
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, refreshUser, resetLoading }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
