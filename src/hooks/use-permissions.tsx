import { useAuth } from "@/app/providers";

export function usePermissions() {
  const { user } = useAuth();

  return {
    isAdmin: user?.role === 'admin',
    canEditProfile: user?.role === 'admin',
    canEditTerms: user?.role === 'admin',
    canAccessUserDatabase: user?.role === 'admin',
    canCreateAccount: user?.role === 'admin',
    canAddRoom: user?.role === 'admin',
    role: user?.role,
  };
}
