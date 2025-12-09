import UserDatabase from "@/pages/UserDatabase";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UserDatabasePage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <UserDatabase />
    </ProtectedRoute>
  );
}
