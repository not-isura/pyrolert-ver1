import Profile from "@/pages/Profile";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <Profile />
    </ProtectedRoute>
  );
}
