"use client";

import { useState, useEffect, useRef } from "react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Eye, EyeOff, AlertTriangle, Search } from "lucide-react";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const dummyInputRef = useRef<HTMLInputElement>(null);

  // Keyboard detection for mobile - lock once keyboard is detected
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let hasDetectedKeyboard = false;
    
    const handleResize = () => {
      // Once dropdown is open and keyboard was detected, keep it locked
      if (isSelectOpen && hasDetectedKeyboard) {
        return;
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (typeof window !== 'undefined') {
          const vh = window.visualViewport?.height || window.innerHeight;
          const windowHeight = window.innerHeight;
          const isOpen = vh < windowHeight * 0.75;
          
          if (isOpen) {
            hasDetectedKeyboard = true;
          }
          
          // Only update if select is not open, or if we're going from closed to open
          if (!isSelectOpen || (isOpen && !isKeyboardOpen)) {
            setIsKeyboardOpen(isOpen);
          }
          
          if (window.visualViewport && isOpen) {
            setViewportOffset(window.visualViewport.offsetTop || 0);
          } else if (!isSelectOpen) {
            setViewportOffset(0);
          }
        }
      }, 50);
    };

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      return () => {
        clearTimeout(timeoutId);
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      };
    }
  }, [isSelectOpen, isKeyboardOpen]);

  // Prevent background scroll when dialog is open (iOS-specific fixes)
  useEffect(() => {
    if (isEditDialogOpen || isDeleteDialogOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Prevent background scrolling with iOS-specific fixes
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      
      // iOS Safari specific: prevent viewport changes
      const metaViewport = document.querySelector('meta[name="viewport"]');
      const originalContent = metaViewport?.getAttribute('content');
      if (metaViewport) {
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
      
      // Prevent touch events on background
      const preventTouch = (e: TouchEvent) => {
        if (!(e.target as HTMLElement).closest('[role="dialog"]')) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventTouch, { passive: false });
      
      return () => {
        // Restore everything
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
        window.scrollTo(0, scrollY);
        
        if (metaViewport && originalContent) {
          metaViewport.setAttribute('content', originalContent);
        }
        
        document.removeEventListener('touchmove', preventTouch);
      };
    }
  }, [isEditDialogOpen, isDeleteDialogOpen]);

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.middleName} ${user.surname}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    const userRole = roleLabels[user.role].toLowerCase();
    return fullName.includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.employeeId && user.employeeId.toLowerCase().includes(search)) ||
      (user.adminId && user.adminId.toLowerCase().includes(search)) ||
      userRole.includes(search);
  });

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
    setShowPassword(false);
    
    // Scroll to top only when first opening
    setTimeout(() => {
      const dialogContent = document.querySelector('[data-radix-dialog-content]');
      if (dialogContent) {
        dialogContent.scrollTop = 0;
      }
      
      const dialogByRole = document.querySelector('[role="dialog"]');
      if (dialogByRole) {
        dialogByRole.scrollTop = 0;
      }
    }, 100);
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

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setDeletePassword("");
    setShowDeletePassword(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      // Validate password (in a real app, you'd verify against the actual user's password)
      if (!deletePassword) {
        toast({
          title: "Password Required",
          description: "Please enter your password to confirm deletion.",
          variant: "destructive",
        });
        return;
      }

      // TODO: In production, verify password against backend
      // For now, just proceed with deletion
      setUsers(users.filter(u => u.id !== deletingUser.id));
      const fullName = `${deletingUser.firstName} ${deletingUser.middleName} ${deletingUser.surname}`.trim();
      toast({
        title: "User Deleted",
        description: `${fullName} has been removed from the system.`,
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      setDeletePassword("");
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
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
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
                          <Badge 
                            variant={user.status === "active" ? "default" : "secondary"}
                            className="w-[70px] inline-flex items-center justify-center"
                          >
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
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                          >
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
        <DialogContent 
          className={`max-w-[90vw] sm:max-w-2xl overflow-y-auto ${isKeyboardOpen ? 'max-h-[60vh] !translate-y-0' : 'max-h-[85vh]'}`}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            ...(isKeyboardOpen && {
              position: 'fixed',
              top: '10px',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              transform: 'translateX(-50%)',
              willChange: 'auto',
            }),
          }}
          onFocus={(e) => {
            // Prevent iOS from scrolling when input is focused
            if (isKeyboardOpen && e.target instanceof HTMLInputElement) {
              e.preventDefault();
              window.scrollTo(0, 0);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-[#002147]">Edit User Information</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#002147] border-b border-[#F1C94E] pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-firstName" className="text-sm">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editingUser.firstName}
                        onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-middleName" className="text-sm">Middle Name</Label>
                      <Input
                        id="edit-middleName"
                        value={editingUser.middleName}
                        onChange={(e) => setEditingUser({ ...editingUser, middleName: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-surname" className="text-sm">Surname</Label>
                      <Input
                        id="edit-surname"
                        value={editingUser.surname}
                        onChange={(e) => setEditingUser({ ...editingUser, surname: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="edit-email" className="text-sm">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="edit-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showPassword ? "text" : "password"}
                        value={editingUser.password || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="pr-10 h-9 sm:h-10"
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
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-adminId" className="text-sm">Admin ID</Label>
                      <Input
                        id="edit-adminId"
                        value={editingUser.adminId || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, adminId: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>
                  )}

                  {/* Hidden input to keep keyboard open */}
                  <input
                    ref={dummyInputRef}
                    type="text"
                    style={{
                      position: 'absolute',
                      opacity: 0,
                      height: 0,
                      width: 0,
                      pointerEvents: 'none',
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                  />

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="edit-status" className="text-sm">Status</Label>
                    <Select 
                      value={editingUser.status} 
                      onValueChange={(value: "active" | "inactive") => setEditingUser({ ...editingUser, status: value })}
                      onOpenChange={(open) => {
                        setIsSelectOpen(open);
                        if (open && dummyInputRef.current) {
                          // Focus hidden input to keep keyboard open
                          setTimeout(() => dummyInputRef.current?.focus(), 10);
                        }
                      }}
                    >
                      <SelectTrigger id="edit-status" className="h-9 sm:h-10">
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
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-[#002147] border-b border-[#F1C94E] pb-2">
                    User Role
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-employeeId" className="text-sm">Employee Number</Label>
                      <Input
                        id="edit-employeeId"
                        value={editingUser.employeeId || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, employeeId: e.target.value })}
                        className="h-9 sm:h-10"
                      />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="edit-role" className="text-sm">Role</Label>
                      <Select 
                        value={editingUser.role} 
                        onValueChange={(value: User["role"]) => setEditingUser({ ...editingUser, role: value })}
                        onOpenChange={(open) => {
                          setIsSelectOpen(open);
                          if (open && dummyInputRef.current) {
                            // Focus hidden input to keep keyboard open
                            setTimeout(() => dummyInputRef.current?.focus(), 10);
                          }
                        }}
                      >
                        <SelectTrigger id="edit-role" className="h-9 sm:h-10">
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

          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              className="w-full sm:w-auto h-9 sm:h-10 text-sm bg-[#002147] hover:bg-[#002147]/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent 
          className={`max-w-[90vw] sm:max-w-md overflow-y-auto ${isKeyboardOpen ? 'max-h-[60vh]' : 'max-h-[85vh]'}`}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg sm:text-xl font-bold text-[#002147]">
                Delete User
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm sm:text-base text-left space-y-3 pt-2">
              <div>Are you sure you want to delete this user?</div>
              {deletingUser && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 border border-gray-200">
                  <div className="font-semibold text-gray-900">
                    {`${deletingUser.firstName} ${deletingUser.middleName} ${deletingUser.surname}`.trim()}
                  </div>
                  <div className="text-sm text-gray-600">{deletingUser.email}</div>
                  <div className="text-xs text-gray-500">
                    {deletingUser.adminId ? `Admin ID: ${deletingUser.adminId}` : 
                     deletingUser.employeeId ? `Employee ID: ${deletingUser.employeeId}` : ''}
                  </div>
                </div>
              )}
              <div className="font-semibold text-red-600">
                Reminder: This action cannot be undone.
              </div>
              
              {/* Password Confirmation Field */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="delete-password" className="text-sm font-semibold text-gray-700">
                  Confirm with Your Password
                </Label>
                <div className="relative">
                  <Input
                    id="delete-password"
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10 h-9 sm:h-10 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-9 sm:h-10 w-9 sm:w-10"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                  >
                    {showDeletePassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto h-9 sm:h-10 text-sm mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
