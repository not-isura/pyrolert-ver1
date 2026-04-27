import ProtectedRoute from "@/components/ProtectedRoute";
import MonitoringDashboard from "@/pages/MonitoringDashboard";

export default function RoomDataPage() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
            <MonitoringDashboard />
        </ProtectedRoute>
    );
}
