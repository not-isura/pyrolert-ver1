import { redirect } from "next/navigation";

// import Dashboard from "@/pages/Dashboard";
// import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  // Original dashboard implementation kept for reference.
  // return (
  //   <ProtectedRoute allowedRoles={['admin', 'security', 'dean', 'facility', 'director']}>
  //     <Dashboard />
  //   </ProtectedRoute>
  // );

  redirect("/dashboard-1");
}
