import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
}

const mockUsers: User[] = [
  { id: "1", employeeId: "EMP001", name: "Admin User", email: "admin@pyrolert.com", role: "Administrator", status: "active" },
  { id: "2", employeeId: "EMP002", name: "John Doe", email: "john.doe@pyrolert.com", role: "Manager", status: "active" },
  { id: "3", employeeId: "EMP003", name: "Jane Smith", email: "jane.smith@pyrolert.com", role: "Operator", status: "active" },
  { id: "4", employeeId: "EMP004", name: "Bob Johnson", email: "bob.j@pyrolert.com", role: "Viewer", status: "inactive" },
];

export default function UserDatabase() {
  const navigate = useNavigate();
  const [users] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => navigate("/")} onSettings={() => navigate("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/settings")}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <h2 className="text-2xl font-bold text-foreground">User Database</h2>

            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Search by name, email, or employee ID..."
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

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.employeeId}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
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

              <Button onClick={() => navigate("/settings")}>
                Back to Settings
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
