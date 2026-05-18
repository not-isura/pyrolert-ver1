"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/app/providers";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type UserRow = Tables<"users">;

export default function Profile() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    role: "",
    employeeNumber: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const originalData = useRef({ firstName: "", middleName: "", surname: "" });

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data, error } = await (supabase as any)
        .from("users")
        .select("first_name, middle_name, last_name, email, role, employee_number")
        .eq("id", user.id)
        .single() as { data: Pick<UserRow, "first_name" | "middle_name" | "last_name" | "email" | "role" | "employee_number"> | null; error: unknown };

      if (!error && data) {
        const loaded = {
          firstName: data.first_name ?? "",
          middleName: data.middle_name ?? "",
          surname: data.last_name ?? "",
        };
        originalData.current = loaded;
        setFormData(prev => ({
          ...prev,
          ...loaded,
          email: data.email ?? "",
          role: data.role ?? "",
          employeeNumber: data.employee_number ?? "",
        }));
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user?.id]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await (supabase as any)
      .from("users")
      .update({
        first_name: formData.firstName.trim(),
        middle_name: formData.middleName.trim() || null,
        last_name: formData.surname.trim(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", user.id);

    setSavingProfile(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      originalData.current = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        surname: formData.surname.trim(),
      };
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
    }
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) return;
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (formData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);

    // Verify old password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: formData.newPassword });
    setSavingPassword(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Updated", description: "Your password has been changed successfully." });
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
        <div className="flex h-[calc(100vh-4rem)]">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />

      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" onClick={() => router.push("/settings")} className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            {/* Profile Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={formData.middleName}
                      onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surname">Surname</Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={formData.role} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeNumber">Employee ID</Label>
                    <Input id="employeeNumber" value={formData.employeeNumber || "—"} disabled />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || (
                      formData.firstName === originalData.current.firstName &&
                      formData.middleName === originalData.current.middleName &&
                      formData.surname === originalData.current.surname
                    )}
                  >
                    {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  >
                    {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update Password
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
