import RoomManagement from "@/pages/RoomManagement";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RoomManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <RoomManagement />
    </ProtectedRoute>
  );
}
