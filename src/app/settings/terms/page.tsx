import Terms from "@/pages/Terms";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TermsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
      <Terms />
    </ProtectedRoute>
  );
}
