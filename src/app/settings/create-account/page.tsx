import CreateAccount from "@/pages/CreateAccount";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function CreateAccountPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <CreateAccount />
    </ProtectedRoute>
  );
}
