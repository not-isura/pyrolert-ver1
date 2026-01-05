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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function CreateAccount() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    autoVerify: true,
    password: "pyrolert_2025!",
    employeeNumber: "",
    role: "",
  });

  const handleRegister = () => {
    const fullName = `${formData.firstName} ${formData.middleName} ${formData.surname}`.trim();
    toast({
      title: "Account Created",
      description: `Account for ${fullName} has been successfully created.`,
    });
    
    // Reset form
    setFormData({
      firstName: "",
      middleName: "",
      surname: "",
      email: "",
      autoVerify: true,
      password: "pyrolert_2025!",
      employeeNumber: "",
      role: "",
    });
  };

  const allFieldsFilled = formData.firstName && formData.surname && formData.email && 
                          formData.password && formData.employeeNumber && formData.role;

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
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
                <CardTitle className="text-2xl font-bold text-brand-blue">Create New Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-brand-blue border-b border-brand-yellow pb-2">
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        placeholder="Santos"
                        value={formData.middleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="surname">Surname *</Label>
                      <Input
                        id="surname"
                        placeholder="Dela Cruz"
                        value={formData.surname}
                        onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                        className="placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan.delacruz@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Default: pyrolert_2025!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="autoVerify" className="block">Email Verification</Label>
                    <div className="flex items-center gap-3 h-10">
                      <Switch
                        id="autoVerify"
                        checked={formData.autoVerify}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoVerify: checked }))}
                      />
                      <Label htmlFor="autoVerify" className="text-sm font-normal cursor-pointer">
                        {formData.autoVerify ? "Auto Verify" : "Manual Verify"}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* User Role Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-brand-blue border-b border-brand-yellow pb-2">
                    User Role
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeNumber">Employee Number *</Label>
                      <Input
                        id="employeeNumber"
                        placeholder="EMP-2025-001"
                        value={formData.employeeNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                        className="placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security">Security Officer</SelectItem>
                          <SelectItem value="admin">Pyrolert Admin</SelectItem>
                          <SelectItem value="dean">Dean</SelectItem>
                          <SelectItem value="facility">Facility Management Officer</SelectItem>
                          <SelectItem value="director">School Director</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/settings")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRegister}
                    disabled={!allFieldsFilled}
                    className="bg-brand-blue hover:bg-brand-blue/90"
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
