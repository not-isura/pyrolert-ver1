"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft } from "lucide-react";

export default function RegisterRoom() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    roomName: "",
    deviceId: "",
    coSensorId: "",
    no2SensorId: "",
    o2SensorId: "",
    pmSensorId: "",
    tempSensorId: "",
    cameraId: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Check if all fields are filled
    const allFieldsFilled = Object.values(formData).every(value => value.trim() !== "");
    
    if (!allFieldsFilled) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all fields before saving.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Room Registered",
      description: `${formData.roomName} has been successfully registered.`,
    });
    router.push("/dashboard");
  };

  const allFieldsFilled = Object.values(formData).every(value => value.trim() !== "");

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Register New Room</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    placeholder="e.g., Conference Room A"
                    value={formData.roomName}
                    onChange={(e) => handleChange("roomName", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="deviceId"
                      placeholder="Enter device ID"
                      value={formData.deviceId}
                      onChange={(e) => handleChange("deviceId", e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <ScanLine className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coSensorId">CO Sensor ID</Label>
                    <Input
                      id="coSensorId"
                      placeholder="CO-XXXX"
                      value={formData.coSensorId}
                      onChange={(e) => handleChange("coSensorId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="no2SensorId">NO₂ Sensor ID</Label>
                    <Input
                      id="no2SensorId"
                      placeholder="NO2-XXXX"
                      value={formData.no2SensorId}
                      onChange={(e) => handleChange("no2SensorId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="o2SensorId">O₂ Sensor ID</Label>
                    <Input
                      id="o2SensorId"
                      placeholder="O2-XXXX"
                      value={formData.o2SensorId}
                      onChange={(e) => handleChange("o2SensorId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pmSensorId">PM Sensor ID</Label>
                    <Input
                      id="pmSensorId"
                      placeholder="PM-XXXX"
                      value={formData.pmSensorId}
                      onChange={(e) => handleChange("pmSensorId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tempSensorId">Temperature Sensor ID</Label>
                    <Input
                      id="tempSensorId"
                      placeholder="TEMP-XXXX"
                      value={formData.tempSensorId}
                      onChange={(e) => handleChange("tempSensorId", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cameraId">Camera ID</Label>
                    <Input
                      id="cameraId"
                      placeholder="CAM-XXXX"
                      value={formData.cameraId}
                      onChange={(e) => handleChange("cameraId", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/dashboard")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!allFieldsFilled}
                  >
                    Save Room
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
