"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { UserStatusBadge, UserStatusType } from "@/components/UserStatusBadge";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2, ArrowLeft, Eye, EyeOff, AlertTriangle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  type User as SupabaseUser,
  type UserRole,
  type UserStatus
} from "@/services/supabaseService";

interface User {
  id: string;
  employeeId?: string;
  firstName: string;
  middleName: string;
  surname: string;
  email: string;
  role: "security" | "admin" | "dean" | "facility" | "director";
  status: UserStatusType;
  password?: string;
  adminId?: string;
}

const roleLabels = {
  security: "Security Officer",
  admin: "Pyrolert Admin",
  dean: "Dean",
  facility: "Facility Management Officer",
  director: "School Director",
};

export default function UserDatabase() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabaseUsers = await getUsers();
      
      // Transform Supabase users to match component interface
      const transformedUsers: User[] = supabaseUsers.map(user => ({
        id: user.id,
        firstName: user.first_name,
        middleName: "",
        surname: user.last_name,
        email: user.email,
        role: user.role as "security" | "admin" | "dean" | "facility",
        status: user.status as UserStatusType,
        password: user.password,
      }));
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveEdit = async () => {
    if (editingUser) {
      try {
        // Update user in Supabase
        await updateUser(editingUser.id, {
          first_name: editingUser.firstName,
          last_name: editingUser.surname,
          email: editingUser.email,
          role: editingUser.role as UserRole,
          status: editingUser.status as UserStatus,
          password: editingUser.password,
        });
        
        // Update local state
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        const fullName = `${editingUser.firstName} ${editingUser.middleName} ${editingUser.surname}`.trim();
        toast({
          title: "User Updated",
          description: `User information for ${fullName} has been updated successfully.`,
        });
        setIsEditDialogOpen(false);
        setEditingUser(null);
        
        // Reload users to get fresh data
        loadUsers();
      } catch (err) {
        console.error('Error updating user:', err);
        toast({
          title: "Update Failed",
          description: "Failed to update user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setDeletePassword("");
    setShowDeletePassword(false);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingUser) {
      // Validate password
      if (!deletePassword) {
        toast({
          title: "Password Required",
          description: "Please enter your password to confirm deletion.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Delete user from Supabase
        await deleteUser(deletingUser.id);
        
        // Update local state
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
        
        // Reload users to get fresh data
        loadUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        toast({
          title: "Delete Failed",
          description: "Failed to delete user. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const isSystemAdmin = editingUser?.role === "admin";

  // Show loading state
  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </PageLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <PageLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-error">{error}</p>
          <button 
            onClick={loadUsers}
            className="mt-2 text-sm text-error-hover underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/settings")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <h2 className="text-2xl font-bold text-brand-blue">User Database</h2>

            {/* Desktop Layout (lg and above) */}
            <div className="hidden lg:flex items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Entries per page:</span>
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

            {/* Mobile Layout (below lg) */}
            <div className="lg:hidden space-y-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Entries per page:</span>
                  <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                    <SelectTrigger className="flex-1 sm:w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" onClick={() => setSearchTerm("")} className="w-full sm:w-auto">
                  Clear Filter
                </Button>
              </div>
            </div>

            {/* Desktop: Table View */}
            <div className="hidden lg:block border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center whitespace-nowrap">Name</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Email</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Role</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-center whitespace-nowrap">
                        {`${user.firstName} ${user.middleName} ${user.surname}`.replace(/\s+/g, ' ').trim()}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">{user.email}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{roleLabels[user.role]}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <UserStatusBadge status={user.status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
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

            {/* Mobile/Tablet: Card View */}
            <div className="lg:hidden space-y-3">
              {filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-semibold text-brand-blue truncate">
                          {`${user.firstName} ${user.middleName} ${user.surname}`.replace(/\s+/g, ' ').trim()}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">{roleLabels[user.role]}</p>
                      </div>
                      <UserStatusBadge status={user.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(user)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalItems={users.length}
              filteredItems={filteredUsers.length}
              onPageChange={setCurrentPage}
            />
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
            <DialogTitle className="text-xl sm:text-2xl font-bold text-brand-blue">Edit User Information</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-brand-blue border-b border-brand-yellow pb-2">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-icon-secondary hover:text-icon-primary"
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
                  <h3 className="text-base sm:text-lg font-semibold text-brand-blue border-b border-brand-yellow pb-2">
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
              className="w-full sm:w-auto h-9 sm:h-10 text-sm bg-brand-blue hover:bg-brand-blue/90"
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
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-error" />
              </div>
              <AlertDialogTitle className="text-lg sm:text-xl font-bold text-brand-blue">
                Delete User
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm sm:text-base text-left space-y-3 pt-2">
              <div>Are you sure you want to delete this user?</div>
              {deletingUser && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 border border-gray-200">
                  <div className="font-semibold text-text-primary">
                    {`${deletingUser.firstName} ${deletingUser.middleName} ${deletingUser.surname}`.trim()}
                  </div>
                  <div className="text-sm text-text-secondary">{deletingUser.email}</div>
                  <div className="text-xs text-text-tertiary">
                    {deletingUser.adminId ? `Admin ID: ${deletingUser.adminId}` : 
                     deletingUser.employeeId ? `Employee ID: ${deletingUser.employeeId}` : ''}
                  </div>
                </div>
              )}
              <div className="font-semibold text-error">
                Reminder: This action cannot be undone.
              </div>
              
              {/* Password Confirmation Field */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="delete-password" className="text-sm font-semibold text-text-primary">
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
                      <EyeOff className="h-4 w-4 text-icon-secondary" />
                    ) : (
                      <Eye className="h-4 w-4 text-icon-secondary" />
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
    </PageLayout>
  );
}
