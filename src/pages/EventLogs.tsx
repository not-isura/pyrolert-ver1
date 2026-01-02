"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";
import { StatusBadge, StatusType } from "@/components/StatusBadge";
import PaginationControls from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, Search } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  getEventLogs, 
  getEventLogsByDateRange, 
  getRoomById, 
  getSensorsByRoom,
  type EventLog as SupabaseEventLog 
} from "@/services/supabaseService";

interface EventLog {
  id: string;
  timestamp: string;
  location: string;
  eventType: StatusType;
  eventId: string;
  roomId?: string; // Add roomId to store the original room_id
}

export default function EventLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    loadEventLogs();
  }, [startDate, endDate]);

  const loadEventLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let supabaseLogs: SupabaseEventLog[];
      
      // Use date range filter if dates are provided
      if (startDate || endDate) {
        const start = startDate || '2000-01-01';
        const end = endDate || '2099-12-31';
        supabaseLogs = await getEventLogsByDateRange(start, end);
      } else {
        supabaseLogs = await getEventLogs();
      }
      
      console.log('Raw Supabase event logs:', supabaseLogs);
      console.log('Number of logs fetched:', supabaseLogs.length);
      
      // Create a map to store room names (cache to avoid duplicate queries)
      const roomNameCache: { [key: string]: string } = {};
      
      // Create a counter for each room to generate sequential event IDs
      const roomEventCounters: { [key: string]: number } = {};
      
      // Transform Supabase event logs to match the component's interface
      const transformedLogs: EventLog[] = await Promise.all(
        supabaseLogs.map(async (log, index) => {
          // Get room name from cache or fetch it
          let roomName = log.location; // Default to location field (room_id)
          
          if (log.room_id || log.location.startsWith('Room_')) {
            const roomId = log.room_id || log.location;
            
            // Check cache first
            if (roomNameCache[roomId]) {
              roomName = roomNameCache[roomId];
            } else {
              // Fetch room details
              try {
                const room = await getRoomById(roomId);
                if (room) {
                  roomName = room.name;
                  roomNameCache[roomId] = room.name;
                }
              } catch (error) {
                console.error(`Error fetching room ${roomId}:`, error);
              }
            }
          }
          
          // Generate event ID in format: YYYY-MM-DD_ROOM_XXX_NNN
          const logDate = new Date(log.timestamp);
          const dateStr = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const roomIdPart = (log.room_id || log.location).replace('Room_', '');
          
          // Increment counter for this room
          const roomKey = log.room_id || log.location;
          if (!roomEventCounters[roomKey]) {
            roomEventCounters[roomKey] = 0;
          }
          roomEventCounters[roomKey]++;
          
          const eventIdNumber = String(roomEventCounters[roomKey]).padStart(3, '0');
          const formattedEventId = `${dateStr}_ROOM_${roomIdPart}_${eventIdNumber}`;
          
          return {
            id: log.id,
            timestamp: new Date(log.timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(',', ''),
            location: roomName, // Use the fetched room name
            eventType: log.event_type as StatusType,
            eventId: formattedEventId, // Use the formatted event ID
            roomId: log.room_id || log.location, // Store the original room_id
          };
        })
      );
      
      console.log('Transformed logs:', transformedLogs);
      console.log('First log example:', transformedLogs[0]);
      
      setLogs(transformedLogs);
    } catch (err) {
      console.error('Error loading event logs:', err);
      setError('Failed to load event logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
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

  // Fetch room data for PDF generation
  const fetchRoomData = async (eventId: string) => {
    try {
      // Find the event log
      const log = logs.find(l => l.eventId === eventId);
      if (!log) {
        throw new Error('Event log not found');
      }
      
      // Try to get the room data from Supabase using the stored roomId
      const roomId = log.roomId || log.location;
      const rooms = await getRoomById(roomId);
      
      let roomData = {
        eventId: eventId,
        location: log.location, // This is now the room name
        timestamp: log.timestamp,
        eventType: log.eventType,
        status: log.eventType === 'normal' ? 'Normal Operation' : 
                log.eventType === 'warning' ? 'Warning Status' : 
                log.eventType === 'alert' ? 'High Alert' : 'Error Status',
        occupants: 0,
        occupantChange: 0,
        sensors: {
          temperature: { value: 0, unit: "°C", status: "UNKNOWN", connected: false },
          co: { value: 0, unit: "ppm", status: "UNKNOWN", connected: false },
          no2: { value: 0, unit: "ppm", status: "UNKNOWN", connected: false },
          o2: { value: 0, unit: "%", status: "UNKNOWN", connected: false },
          pm25: { value: 0, unit: "µg/m³", status: "UNKNOWN", connected: false },
          pm10: { value: 0, unit: "µg/m³", status: "UNKNOWN", connected: false },
        },
        cameraSnapshot: "/placeholder-camera.jpg",
      };
      
      // If room exists, get its sensors
      if (rooms) {
        const sensors = await getSensorsByRoom(rooms.id);
        
        roomData.occupants = rooms.occupants || 0;
        roomData.occupantChange = rooms.occupant_change || 0;
        
        // Map sensors to the expected format
        sensors.forEach(sensor => {
          const statusMap: { [key: string]: string } = {
            'normal': 'NORMAL',
            'warning': 'WARNING',
            'critical': 'CRITICAL',
          };
          
          if (sensor.type === 'temperature') {
            roomData.sensors.temperature = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          } else if (sensor.type === 'co') {
            roomData.sensors.co = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          } else if (sensor.type === 'no2') {
            roomData.sensors.no2 = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          } else if (sensor.type === 'o2') {
            roomData.sensors.o2 = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          } else if (sensor.type === 'pm25') {
            roomData.sensors.pm25 = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          } else if (sensor.type === 'pm10') {
            roomData.sensors.pm10 = {
              value: sensor.value,
              unit: sensor.unit,
              status: statusMap[sensor.status] || 'UNKNOWN',
              connected: sensor.connected,
            };
          }
        });
      }
      
      return roomData;
    } catch (error) {
      console.error('Error fetching room data:', error);
      // Return default data if fetch fails
      return {
        eventId: eventId,
        location: logs.find(l => l.eventId === eventId)?.location || "Unknown",
        timestamp: logs.find(l => l.eventId === eventId)?.timestamp || new Date().toLocaleString(),
        eventType: logs.find(l => l.eventId === eventId)?.eventType || "normal",
        status: "Unknown Status",
        occupants: 0,
        occupantChange: 0,
        sensors: {
          temperature: { value: 0, unit: "°C", status: "UNKNOWN", connected: false },
          co: { value: 0, unit: "ppm", status: "UNKNOWN", connected: false },
          no2: { value: 0, unit: "ppm", status: "UNKNOWN", connected: false },
          o2: { value: 0, unit: "%", status: "UNKNOWN", connected: false },
          pm25: { value: 0, unit: "µg/m³", status: "UNKNOWN", connected: false },
          pm10: { value: 0, unit: "µg/m³", status: "UNKNOWN", connected: false },
        },
        cameraSnapshot: "/placeholder-camera.jpg",
      };
    }
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
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid hsl(var(--brand-blue)); padding-bottom: 20px;">
            <h1 style="color: hsl(var(--brand-blue)); margin: 0 0 10px 0; font-size: 28px;">PyroLert Event Report</h1>
            <p style="color: #666; margin: 0; font-size: 14px;">Fire Detection & Monitoring System</p>
          </div>

          <!-- Event Details -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: hsl(var(--brand-blue)); margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid hsl(var(--brand-blue)); padding-bottom: 8px;">Event Details</h2>
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
            <h2 style="color: hsl(var(--brand-blue)); margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid hsl(var(--brand-blue)); padding-bottom: 8px;">Sensor Readings</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background: hsl(var(--brand-blue)); color: white;">
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
            <h2 style="color: hsl(var(--brand-blue)); margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid hsl(var(--brand-blue)); padding-bottom: 8px;">Camera Snapshot</h2>
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
    <PageLayout>
      <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-foreground">All Event Logs</h2>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading event logs...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
                <button 
                  onClick={loadEventLogs}
                  className="mt-2 text-sm text-red-700 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
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
                    <TableHead className="text-center whitespace-nowrap">Timestamp</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Location</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Event Type</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Event ID</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-center whitespace-nowrap">{log.timestamp}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">{log.location}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <StatusBadge status={log.eventType} />
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-center whitespace-nowrap">{log.eventId}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
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
            </div>            <PaginationControls
              currentPage={currentPage}
              totalItems={logs.length}
              filteredItems={filteredLogs.length}
              onPageChange={setCurrentPage}
            />
            </>
            )}
          </div>
    </PageLayout>
  );
}
