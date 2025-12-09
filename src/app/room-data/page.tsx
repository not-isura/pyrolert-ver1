import RoomData from "@/pages/RoomData";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function RoomDataPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <RoomData />
    </ProtectedRoute>
  );
}
