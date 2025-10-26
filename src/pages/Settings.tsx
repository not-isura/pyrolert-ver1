import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, FileText, UserPlus, Database } from "lucide-react";

const settingsOptions = [
  {
    title: "My Profile",
    description: "Manage your personal information and password",
    icon: User,
    path: "/settings/profile",
  },
  {
    title: "Terms & Conditions",
    description: "View and edit terms and conditions",
    icon: FileText,
    path: "/settings/terms",
  },
  {
    title: "Account Creation",
    description: "Register new user accounts",
    icon: UserPlus,
    path: "/settings/create-account",
  },
  {
    title: "User Database",
    description: "Manage existing user accounts",
    icon: Database,
    path: "/settings/users",
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => navigate("/")} onSettings={() => navigate("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {settingsOptions.map((option) => (
                <Card 
                  key={option.path}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(option.path)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <option.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
