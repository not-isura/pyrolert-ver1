import EventLogs from "@/pages/EventLogs";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function EventLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <EventLogs />
    </ProtectedRoute>
  );
}
