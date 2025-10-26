import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState(
    `TERMS AND CONDITIONS

Last Updated: January 15, 2025

1. ACCEPTANCE OF TERMS
By accessing and using Pyrolert's intelligent smoke detection and occupancy monitoring system, you agree to be bound by these Terms and Conditions.

2. SYSTEM USAGE
Users must operate the system in accordance with all applicable laws and regulations regarding fire safety and occupancy monitoring.

3. DATA COLLECTION
The system collects environmental data including but not limited to: temperature readings, air quality measurements, and occupancy counts for safety and monitoring purposes.

4. PRIVACY
All collected data is stored securely and used solely for the purpose of safety monitoring and system optimization.

5. LIABILITY
Pyrolert provides monitoring services but does not replace professional fire safety systems or emergency response protocols.

6. MODIFICATIONS
We reserve the right to modify these terms at any time. Users will be notified of significant changes.

7. CONTACT
For questions regarding these terms, please contact your system administrator.`
  );

  const handleSave = () => {
    toast({
      title: "Terms Updated",
      description: "Terms and conditions have been successfully saved.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => navigate("/")} onSettings={() => navigate("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/settings")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/settings")}
                  >
                    Back to Settings
                  </Button>
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
