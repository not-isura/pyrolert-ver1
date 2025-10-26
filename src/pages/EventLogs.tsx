"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge, StatusType } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, ChevronLeft, ChevronRight } from "lucide-react";

interface EventLog {
  id: string;
  timestamp: string;
  location: string;
  eventType: StatusType;
  eventId: string;
}

const mockLogs: EventLog[] = [
  { id: "1", timestamp: "2025-01-15 14:30:22", location: "Conference Room A", eventType: "normal", eventId: "2025-01-15_CONF_A" },
  { id: "2", timestamp: "2025-01-15 13:15:45", location: "Laboratory B", eventType: "warning", eventId: "2025-01-15_LAB_B" },
  { id: "3", timestamp: "2025-01-15 11:42:10", location: "Storage Room C", eventType: "alert", eventId: "2025-01-15_STOR_C" },
  { id: "4", timestamp: "2025-01-15 09:20:33", location: "Conference Room A", eventType: "normal", eventId: "2025-01-15_CONF_A_2" },
  { id: "5", timestamp: "2025-01-14 16:55:18", location: "Laboratory B", eventType: "error", eventId: "2025-01-14_LAB_B" },
];

export default function EventLogs() {
  const router = useRouter();
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = mockLogs.filter(log =>
    log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.eventId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">All Event Logs</h2>

            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Search by location or event ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Entries per page:</span>
                <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                  <SelectTrigger className="w-20 sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setSearchTerm("")} className="hidden sm:inline-flex">
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.timestamp}</TableCell>
                      <TableCell>{log.location}</TableCell>
                      <TableCell>
                        <StatusBadge status={log.eventType} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.eventId}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
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
                Showing {filteredLogs.length} of {mockLogs.length} entries
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
    </div>
  );
}
