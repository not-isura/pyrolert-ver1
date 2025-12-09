import Settings from "@/pages/Settings";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <Settings />
    </ProtectedRoute>
  );
}
