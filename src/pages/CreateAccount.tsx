"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function CreateAccount() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    employeeNumber: "",
    password: "",
    autoVerify: true,
  });

  const handleRegister = () => {
    toast({
      title: "Account Created",
      description: `Account for ${formData.name} has been successfully created.`,
    });
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      role: "",
      employeeNumber: "",
      password: "",
      autoVerify: true,
    });
  };

  const allFieldsFilled = formData.name && formData.email && formData.role && 
                          formData.employeeNumber && formData.password;

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/settings")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Create New Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Switch
                          checked={formData.autoVerify}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoVerify: checked }))}
                        />
                        <Label className="text-xs">Auto Verify</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee Number</Label>
                    <Input
                      id="employeeNumber"
                      placeholder="EMP-XXXX"
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/settings")}
                  >
                    Back to Settings
                  </Button>
                  <Button 
                    onClick={handleRegister}
                    disabled={!allFieldsFilled}
                  >
                    Register Account
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
