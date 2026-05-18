"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logoutUser, type AuthUser } from "@/services/supabaseService";
import type { UserRole } from "@/services/supabaseService";

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

async function fetchProfile(authUserId: string): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, role, status, first_name, last_name")
    .eq("auth_user_id", authUserId)
    .single();

  if (!profile || profile.status !== "active") return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });
  };

  useEffect(() => {
    // Resolve initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setIsLoading(false);
    });

    // Keep user in sync with Supabase auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id).then(setUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await logoutUser();
    setUser(null);
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
