import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <Dashboard />
    </ProtectedRoute>
  );
}
