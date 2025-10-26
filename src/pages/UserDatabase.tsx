"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  employeeId?: string;
  firstName: string;
  middleName: string;
  surname: string;
  email: string;
  role: "security_officer" | "school_admin" | "dean" | "facility_mgmt" | "system_admin";
  status: "active" | "inactive";
  password?: string;
  adminId?: string;
}

const roleLabels = {
  security_officer: "Security Officer",
  school_admin: "School Administrator",
  dean: "Dean",
  facility_mgmt: "Facility Management Officer",
  system_admin: "Pyrolert System Admin",
};

const mockUsers: User[] = [
  { id: "1", adminId: "ADMIN001", firstName: "Admin", middleName: "", surname: "User", email: "admin@pyrolert.com", role: "system_admin", status: "active", password: "pyrolert_2025!" },
  { id: "2", employeeId: "SEC001", firstName: "John", middleName: "Michael", surname: "Doe", email: "john.doe@pyrolert.com", role: "security_officer", status: "active", password: "pyrolert_2025!" },
  { id: "3", employeeId: "DEAN001", firstName: "Jane", middleName: "Marie", surname: "Smith", email: "jane.smith@pyrolert.com", role: "dean", status: "active", password: "pyrolert_2025!" },
  { id: "4", employeeId: "SA001", firstName: "Bob", middleName: "", surname: "Johnson", email: "bob.j@pyrolert.com", role: "school_admin", status: "inactive", password: "pyrolert_2025!" },
  { id: "5", employeeId: "FM001", firstName: "Alice", middleName: "Grace", surname: "Williams", email: "alice.w@pyrolert.com", role: "facility_mgmt", status: "active", password: "pyrolert_2025!" },
];

export default function UserDatabase() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.middleName} ${user.surname}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(search)) ||
      (user.adminId && user.adminId.toLowerCase().includes(search));
  });

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
    setShowPassword(false);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      const fullName = `${editingUser.firstName} ${editingUser.middleName} ${editingUser.surname}`.trim();
      toast({
        title: "User Updated",
        description: `User information for ${fullName} has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  const isSystemAdmin = editingUser?.role === "system_admin";

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/settings")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <h2 className="text-2xl font-bold text-[#002147]">User Database</h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Entries per page:</span>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Filter
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">ID</TableHead>
                    <TableHead className="text-center">Name</TableHead>
                    <TableHead className="text-center">Email</TableHead>
                    <TableHead className="text-center">Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm text-center">
                        {user.role === "system_admin" ? user.adminId : user.employeeId}
                      </TableCell>
                      <TableCell className="font-medium text-center">
                        {`${user.firstName} ${user.middleName} ${user.surname}`.replace(/\s+/g, ' ').trim()}
                      </TableCell>
                      <TableCell className="text-center">{user.email}</TableCell>
                      <TableCell className="text-center">{roleLabels[user.role]}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditClick(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} of {users.length} entries
              </p>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <span className="text-sm font-medium px-4">Page {currentPage}</span>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#002147]">Edit User Information</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#002147] border-b border-[#F1C94E] pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editingUser.firstName}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-middleName">Middle Name</Label>
                      <Input
                        id="edit-middleName"
                        value={editingUser.middleName}
                        onChange={(e) => setEditingUser({ ...editingUser, middleName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-surname">Surname</Label>
                      <Input
                        id="edit-surname"
                        value={editingUser.surname}
                        onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        value={editingUser.password || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isSystemAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-adminId">Admin ID</Label>
                      <Input
                        id="edit-adminId"
                        value={editingUser.adminId || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, adminId: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={editingUser.status} 
                      onValueChange={(value: "active" | "inactive") => setEditingUser({ ...editingUser, status: value })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* User Role - Only for non-admin users */}
              {!isSystemAdmin && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#002147] border-b border-[#F1C94E] pb-2">
                    User Role
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-employeeId">Employee Number</Label>
                      <Input
                        id="edit-employeeId"
                        value={editingUser.employeeId || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role</Label>
                      <Select 
                        value={editingUser.role} 
                        onValueChange={(value: User["role"]) => setEditingUser({ ...editingUser, role: value })}
                      >
                        <SelectTrigger id="edit-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security_officer">Security Officer</SelectItem>
                          <SelectItem value="school_admin">School Administrator</SelectItem>
                          <SelectItem value="dean">Dean</SelectItem>
                          <SelectItem value="facility_mgmt">Facility Management Officer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#002147] hover:bg-[#002147]/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
