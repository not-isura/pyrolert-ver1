import ProtectedRoute from "@/components/ProtectedRoute";
import SupabaseProvider from "@/components/SupabaseProvider";
import AlertLogsPage from "@/pages/AlertLogsPage";

export default function AlertLogsRoutePage() {
    return (
        <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
            <SupabaseProvider>
                <AlertLogsPage />
            </SupabaseProvider>
        </ProtectedRoute>
    );
}
