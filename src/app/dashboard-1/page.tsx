import ProtectedRoute from "@/components/ProtectedRoute";
import SupabaseProvider from "@/components/SupabaseProvider";
import MonitoringDashboard from "@/pages/MonitoringDashboard";

export default function RoomDataPage() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
            <SupabaseProvider>
                <MonitoringDashboard />
            </SupabaseProvider>
        </ProtectedRoute>
    );
}
