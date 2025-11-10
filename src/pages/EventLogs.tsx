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
import { Download, Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.eventId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEventType = eventTypeFilter === "all" || log.eventType === eventTypeFilter;
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDate || endDate) {
      const logDate = log.timestamp.split(' ')[0]; // Extract date part (YYYY-MM-DD)
      
      if (startDate && endDate) {
        // Both start and end dates selected
        matchesDateRange = logDate >= startDate && logDate <= endDate;
      } else if (startDate) {
        // Only start date selected - show from start date onwards
        matchesDateRange = logDate >= startDate;
      } else if (endDate) {
        // Only end date selected - show up to end date
        matchesDateRange = logDate <= endDate;
      }
    }
    
    return matchesSearch && matchesEventType && matchesDateRange;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setEventTypeFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Mock function to fetch room data - replace with actual API call
  const fetchRoomData = async (eventId: string) => {
    // In production, this would fetch from your database/API
    return {
      eventId: eventId,
      location: mockLogs.find(l => l.eventId === eventId)?.location || "Conference Room A",
      timestamp: mockLogs.find(l => l.eventId === eventId)?.timestamp || new Date().toLocaleString(),
      eventType: mockLogs.find(l => l.eventId === eventId)?.eventType || "normal",
      status: "Normal Operation",
      occupants: 12,
      occupantChange: 2,
      sensors: {
        temperature: { value: 22, unit: "°C", status: "NORMAL", connected: true },
        co: { value: 5, unit: "ppm", status: "NORMAL", connected: true },
        no2: { value: 12, unit: "ppm", status: "NORMAL", connected: true },
        o2: { value: 20.9, unit: "%", status: "NORMAL", connected: false },
        pm25: { value: 8, unit: "µg/m³", status: "NORMAL", connected: true },
        pm10: { value: 15, unit: "µg/m³", status: "NORMAL", connected: true },
      },
      cameraSnapshot: "/placeholder-camera.jpg", // Replace with actual image URL
    };
  };

  const generatePDF = async (log: EventLog) => {
    try {
      // Fetch room data
      const roomData = await fetchRoomData(log.eventId);

      // Create a hidden div for PDF content
      const reportDiv = document.createElement('div');
      reportDiv.style.position = 'absolute';
      reportDiv.style.left = '-9999px';
      reportDiv.style.width = '210mm'; // A4 width
      reportDiv.style.padding = '20mm';
      reportDiv.style.backgroundColor = 'white';
      reportDiv.style.fontFamily = 'Arial, sans-serif';

      reportDiv.innerHTML = `
        <div style="max-width: 170mm;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #002147; padding-bottom: 20px;">
            <h1 style="color: #002147; margin: 0 0 10px 0; font-size: 28px;">PyroLert Event Report</h1>
            <p style="color: #666; margin: 0; font-size: 14px;">Fire Detection & Monitoring System</p>
          </div>

          <!-- Event Details -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #002147; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #002147; padding-bottom: 8px;">Event Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; width: 35%; font-weight: bold; color: #333;">Event ID:</td>
                <td style="padding: 8px 0; color: #666; font-family: 'Courier New', monospace;">${roomData.eventId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Location:</td>
                <td style="padding: 8px 0; color: #666;">${roomData.location}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Timestamp:</td>
                <td style="padding: 8px 0; color: #666;">${roomData.timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Event Type:</td>
                <td style="padding: 8px 0;"><span style="background: ${getStatusColor(roomData.eventType)}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">${getStatusLabel(roomData.eventType)}</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Occupants:</td>
                <td style="padding: 8px 0; color: #666;">${roomData.occupants} people (${roomData.occupantChange >= 0 ? '+' : ''}${roomData.occupantChange} in last 30 min)</td>
              </tr>
            </table>
          </div>

          <!-- Sensor Readings -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #002147; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #002147; padding-bottom: 8px;">Sensor Readings</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: #002147; color: white;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Sensor</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Value</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Status</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Connection</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(roomData.sensors).map(([name, data]: [string, any], index) => `
                  <tr style="background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; text-transform: capitalize;">${name.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-family: 'Courier New', monospace;">${data.value} ${data.unit}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><span style="background: ${data.status === 'NORMAL' ? '#22c55e' : data.status === 'WARNING' ? '#f59e0b' : '#ef4444'}; color: white; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: bold;">${data.status}</span></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: ${data.connected ? '#22c55e' : '#ef4444'};">${data.connected ? '● Connected' : '○ Disconnected'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Camera Snapshot Placeholder -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #002147; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #002147; padding-bottom: 8px;">Camera Snapshot</h2>
            <div style="border: 2px dashed #ddd; padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
              <p style="color: #999; margin: 0; font-size: 14px;">📷 Camera snapshot will be embedded here</p>
              <p style="color: #bbb; margin: 5px 0 0 0; font-size: 12px;">Image URL: ${roomData.cameraSnapshot}</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p style="margin: 0;">Generated by PyroLert System | ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0 0;">National University - Fire Detection & Monitoring</p>
          </div>
        </div>
      `;

      document.body.appendChild(reportDiv);

      // Generate canvas from HTML
      const canvas = await html2canvas(reportDiv, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Remove the temporary div
      document.body.removeChild(reportDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // If content is longer than one page, add multiple pages
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'alert': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return 'Normal';
      case 'warning': return 'Warning';
      case 'alert': return 'High Alert';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const handlePreview = async (log: EventLog) => {
    try {
      const pdf = await generatePDF(log);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new browser tab - let browser handle the viewer
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
      alert('Failed to generate PDF preview. Please try again.');
    }
  };

  const handleDownload = async (log: EventLog) => {
    try {
      const pdf = await generatePDF(log);
      pdf.save(`PyroLert-Report-${log.eventId}.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={() => router.push("/")} onSettings={() => router.push("/settings")} />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">All Event Logs</h2>

            <div className="flex flex-col gap-4">
              {/* Search and Action Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by location or event ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                </div>
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground min-w-fit">Event Type:</span>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="alert">High Alert</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground min-w-fit">From:</span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-44"
                    placeholder="Start date"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-muted-foreground min-w-fit">To:</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-44"
                    placeholder="End date"
                  />
                </div>

                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full sm:w-auto"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Timestamp</TableHead>
                    <TableHead className="text-center">Location</TableHead>
                    <TableHead className="text-center">Event Type</TableHead>
                    <TableHead className="text-center">Event ID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-center">{log.timestamp}</TableCell>
                      <TableCell className="text-center">{log.location}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={log.eventType} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-center">{log.eventId}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePreview(log)}
                            title="Preview Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDownload(log)}
                            title="Download Report"
                          >
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
