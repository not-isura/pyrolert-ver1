"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import PaginationControls from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Search, Settings2, ArrowLeft, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { SensorStatusBadge } from '@/components/SensorStatusBadge';
import { ConnectionStatusBadge } from '@/components/ConnectionStatusBadge';
import {
  getRooms,
  updateRoom,
  deleteRoom,
  getSensorsByRoom,
  updateSensor,
  deleteSensor,
  createSensor,
} from '@/services/supabaseService';

interface Room {
  id: string;
  name: string;
  status: string;
  occupants: number;
  occupant_change: number;
  last_updated: string;
  created_at: string;
}

interface Sensor {
  id: string;
  room_id: string;
  name: string;
  type: string;
  value: number;
  unit: string;
  status: string;
  connected: boolean;
  last_reading: string;
  created_at: string;
}

export default function RoomManagement() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Edit Room Dialog
  const [editRoomDialog, setEditRoomDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomSensorsForEdit, setRoomSensorsForEdit] = useState<Sensor[]>([]);
  const [editRoomForm, setEditRoomForm] = useState({
    name: '',
  });

  // Delete Room Dialog
  const [deleteRoomDialog, setDeleteRoomDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Manage Sensors Dialog
  const [sensorsDialog, setSensorsDialog] = useState(false);
  const [selectedRoomForSensors, setSelectedRoomForSensors] = useState<Room | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);

  // Edit Sensor Dialog
  const [editSensorDialog, setEditSensorDialog] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [editSensorForm, setEditSensorForm] = useState({
    name: '',
    type: '',
    value: 0,
    unit: '',
    status: 'normal',
    connected: true,
  });

  // Add Sensor Dialog
  const [addSensorDialog, setAddSensorDialog] = useState(false);
  const [newSensorForm, setNewSensorForm] = useState({
    name: '',
    type: 'temperature',
    value: 0,
    unit: '',
    status: 'normal',
    connected: true,
  });

  // Delete Sensor Dialog
  const [deleteSensorDialog, setDeleteSensorDialog] = useState(false);
  const [sensorToDelete, setSensorToDelete] = useState<Sensor | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [searchTerm, rooms]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRooms.length / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const endIndex = startIndex + parseInt(entriesPerPage);
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entriesPerPage]);

  async function loadRooms() {
    try {
      setLoading(true);
      const data = await getRooms();
      setRooms(data || []);
      setFilteredRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  function filterRooms() {
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const filtered = rooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRooms(filtered);
  }

  async function handleEditRoom(room: Room) {
    setSelectedRoom(room);
    setEditRoomForm({
      name: room.name,
    });
    
    // Load sensors for this room
    try {
      const roomSensors = await getSensorsByRoom(room.id);
      setRoomSensorsForEdit(roomSensors || []);
    } catch (error) {
      console.error('Error loading sensors for edit:', error);
      toast.error('Failed to load room sensors');
    }
    
    setEditRoomDialog(true);
  }

  async function handleUpdateRoom() {
    if (!selectedRoom) return;

    try {
      // Update room name only
      await updateRoom(selectedRoom.id, {
        name: editRoomForm.name,
        last_updated: new Date().toISOString(),
      });

      toast.success('Room updated successfully');
      setEditRoomDialog(false);
      loadRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
    }
  }

  function handleDeleteRoomClick(room: Room) {
    setRoomToDelete(room);
    setDeletePassword('');
    setShowDeletePassword(false);
    setDeleteRoomDialog(true);
  }

  async function handleDeleteRoom() {
    if (!roomToDelete) return;

    // Validate password
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion.');
      return;
    }

    try {
      await deleteRoom(roomToDelete.id);
      toast.success('Room deleted successfully');
      setDeleteRoomDialog(false);
      setRoomToDelete(null);
      setDeletePassword('');
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  }

  async function handleManageSensors(room: Room) {
    setSelectedRoomForSensors(room);
    setSensorsDialog(true);
    await loadSensors(room.id);
  }

  async function loadSensors(roomId: string) {
    try {
      setLoadingSensors(true);
      const data = await getSensorsByRoom(roomId);
      setSensors(data || []);
    } catch (error) {
      console.error('Error loading sensors:', error);
      toast.error('Failed to load sensors');
    } finally {
      setLoadingSensors(false);
    }
  }

  function handleEditSensor(sensor: Sensor) {
    setSelectedSensor(sensor);
    setEditSensorForm({
      name: sensor.name,
      type: sensor.type,
      value: sensor.value || 0,
      unit: sensor.unit,
      status: sensor.status,
      connected: sensor.connected,
    });
    setEditSensorDialog(true);
  }

  async function handleUpdateSensor() {
    if (!selectedSensor) return;

    try {
      await updateSensor(selectedSensor.id, {
        name: editSensorForm.name,
        type: editSensorForm.type as any,
        value: editSensorForm.value,
        unit: editSensorForm.unit,
        status: editSensorForm.status as any,
        connected: editSensorForm.connected,
        last_reading: new Date().toISOString(),
      });

      toast.success('Sensor updated successfully');
      setEditSensorDialog(false);
      if (selectedRoomForSensors) {
        await loadSensors(selectedRoomForSensors.id);
      }
    } catch (error) {
      console.error('Error updating sensor:', error);
      toast.error('Failed to update sensor');
    }
  }

  function handleAddSensorClick() {
    setNewSensorForm({
      name: '',
      type: 'temperature',
      value: 0,
      unit: '',
      status: 'normal',
      connected: true,
    });
    setAddSensorDialog(true);
  }

  async function handleAddSensor() {
    if (!selectedRoomForSensors) return;

    try {
      await createSensor({
        room_id: selectedRoomForSensors.id,
        name: newSensorForm.name,
        type: newSensorForm.type as any,
        value: newSensorForm.value,
        unit: newSensorForm.unit,
        status: newSensorForm.status as any,
        connected: newSensorForm.connected,
        last_reading: new Date().toISOString(),
      });

      toast.success('Sensor added successfully');
      setAddSensorDialog(false);
      await loadSensors(selectedRoomForSensors.id);
    } catch (error) {
      console.error('Error adding sensor:', error);
      toast.error('Failed to add sensor');
    }
  }

  function handleDeleteSensorClick(sensor: Sensor) {
    setSensorToDelete(sensor);
    setDeleteSensorDialog(true);
  }

  async function handleDeleteSensor() {
    if (!sensorToDelete) return;

    try {
      await deleteSensor(sensorToDelete.id);
      toast.success('Sensor deleted successfully');
      setDeleteSensorDialog(false);
      setSensorToDelete(null);
      if (selectedRoomForSensors) {
        await loadSensors(selectedRoomForSensors.id);
      }
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast.error('Failed to delete sensor');
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading rooms...</p>
          </div>
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

        <h2 className="text-2xl font-bold text-[#002147]">Room Management</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by room name or ID..."
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

        {/* Rooms Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center whitespace-nowrap">Room ID</TableHead>
                <TableHead className="text-center whitespace-nowrap">Room Name</TableHead>
                <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                <TableHead className="text-center whitespace-nowrap">Occupants</TableHead>
                <TableHead className="text-center whitespace-nowrap">Last Updated</TableHead>
                <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {searchTerm ? 'No rooms found matching your search' : 'No rooms found'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-mono text-sm text-center whitespace-nowrap">{room.id}</TableCell>
                    <TableCell className="font-medium text-center whitespace-nowrap">{room.name}</TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <StatusBadge status={room.status as any} />
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">{room.occupants || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground text-center whitespace-nowrap">
                      {room.last_updated
                        ? new Date(room.last_updated).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRoomClick(room)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredRooms.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredRooms.length)} of {filteredRooms.length} entries
          </p>
          {filteredRooms.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalItems={rooms.length}
              itemsPerPage={parseInt(entriesPerPage)}
              filteredItems={filteredRooms.length}
              onPageChange={setCurrentPage}
              showItemCount={false}
            />
          )}
        </div>
      </div>

      {/* Edit Room Dialog */}
      <Dialog open={editRoomDialog} onOpenChange={setEditRoomDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room name and sensor IDs. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={editRoomForm.name}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, name: e.target.value })
                }
                placeholder="Enter room name"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Sensor IDs</Label>
              <p className="text-sm text-muted-foreground">
                Sensor IDs are unique identifiers and cannot be modified.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomSensorsForEdit.map((sensor, index) => (
                  <div key={sensor.id} className="space-y-2">
                    <Label htmlFor={`sensor-${index}`}>
                      {sensor.type.toUpperCase()} Sensor ID
                    </Label>
                    <Input
                      id={`sensor-${index}`}
                      value={sensor.id}
                      readOnly
                      className="bg-muted"
                      placeholder={`${sensor.type.toUpperCase()}-XXXX`}
                    />
                  </div>
                ))}
              </div>
              {roomSensorsForEdit.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No sensors found for this room.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoomDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoom}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <AlertDialog open={deleteRoomDialog} onOpenChange={setDeleteRoomDialog}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md overflow-y-auto">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg sm:text-xl font-bold text-[#002147]">
                Delete Room
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm sm:text-base text-left space-y-3 pt-2">
              <div>Are you sure you want to delete this room?</div>
              {roomToDelete && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 border border-gray-200">
                  <div className="font-semibold text-gray-900">
                    {roomToDelete.name}
                  </div>
                  <div className="text-sm text-gray-600">Room ID: {roomToDelete.id}</div>
                  <div className="text-xs text-gray-500">
                    Status: <span className="capitalize">{roomToDelete.status}</span>
                  </div>
                </div>
              )}
              <div className="font-semibold text-red-600">
                Reminder: This action cannot be undone and will also delete all sensors associated with this room.
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
              onClick={handleDeleteRoom}
              className="w-full sm:w-auto h-9 sm:h-10 text-sm bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Sensors Dialog */}
      <Dialog open={sensorsDialog} onOpenChange={setSensorsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Sensors - {selectedRoomForSensors?.name}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove sensors for this room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-end">
              <Button onClick={handleAddSensorClick} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Sensor
              </Button>
            </div>

            {loadingSensors ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sensors...
              </div>
            ) : sensors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sensors found for this room
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connected</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensors.map((sensor) => (
                      <TableRow key={sensor.id}>
                        <TableCell className="font-medium">{sensor.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sensor.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {sensor.value} {sensor.unit}
                        </TableCell>
                        <TableCell>
                          <SensorStatusBadge status={sensor.status as any} />
                        </TableCell>
                        <TableCell>
                          <ConnectionStatusBadge connected={sensor.connected} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSensor(sensor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSensorClick(sensor)}
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSensorsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sensor Dialog */}
      <Dialog open={editSensorDialog} onOpenChange={setEditSensorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sensor</DialogTitle>
            <DialogDescription>
              Update sensor details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sensor-name">Sensor Name</Label>
              <Input
                id="sensor-name"
                value={editSensorForm.name}
                onChange={(e) =>
                  setEditSensorForm({ ...editSensorForm, name: e.target.value })
                }
                placeholder="Enter sensor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensor-type">Type</Label>
              <Select
                value={editSensorForm.type}
                onValueChange={(value) =>
                  setEditSensorForm({ ...editSensorForm, type: value })
                }
              >
                <SelectTrigger id="sensor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="co">CO (Carbon Monoxide)</SelectItem>
                  <SelectItem value="no2">NO2 (Nitrogen Dioxide)</SelectItem>
                  <SelectItem value="o2">O2 (Oxygen)</SelectItem>
                  <SelectItem value="pm2.5">PM2.5</SelectItem>
                  <SelectItem value="pm10">PM10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sensor-value">Value</Label>
                <Input
                  id="sensor-value"
                  type="number"
                  step="0.01"
                  value={editSensorForm.value}
                  onChange={(e) =>
                    setEditSensorForm({
                      ...editSensorForm,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sensor-unit">Unit</Label>
                <Input
                  id="sensor-unit"
                  value={editSensorForm.unit}
                  onChange={(e) =>
                    setEditSensorForm({ ...editSensorForm, unit: e.target.value })
                  }
                  placeholder="e.g., °C, ppm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensor-status">Status</Label>
              <Select
                value={editSensorForm.status}
                onValueChange={(value) =>
                  setEditSensorForm({ ...editSensorForm, status: value })
                }
              >
                <SelectTrigger id="sensor-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="sensor-connected"
                checked={editSensorForm.connected}
                onChange={(e) =>
                  setEditSensorForm({
                    ...editSensorForm,
                    connected: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="sensor-connected">Sensor Connected</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSensorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSensor}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sensor Dialog */}
      <Dialog open={addSensorDialog} onOpenChange={setAddSensorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sensor</DialogTitle>
            <DialogDescription>
              Create a new sensor for {selectedRoomForSensors?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-sensor-name">Sensor Name</Label>
              <Input
                id="new-sensor-name"
                value={newSensorForm.name}
                onChange={(e) =>
                  setNewSensorForm({ ...newSensorForm, name: e.target.value })
                }
                placeholder="Enter sensor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-sensor-type">Type</Label>
              <Select
                value={newSensorForm.type}
                onValueChange={(value) =>
                  setNewSensorForm({ ...newSensorForm, type: value })
                }
              >
                <SelectTrigger id="new-sensor-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperature</SelectItem>
                  <SelectItem value="co">CO (Carbon Monoxide)</SelectItem>
                  <SelectItem value="no2">NO2 (Nitrogen Dioxide)</SelectItem>
                  <SelectItem value="o2">O2 (Oxygen)</SelectItem>
                  <SelectItem value="pm2.5">PM2.5</SelectItem>
                  <SelectItem value="pm10">PM10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-sensor-value">Initial Value</Label>
                <Input
                  id="new-sensor-value"
                  type="number"
                  step="0.01"
                  value={newSensorForm.value}
                  onChange={(e) =>
                    setNewSensorForm({
                      ...newSensorForm,
                      value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sensor-unit">Unit</Label>
                <Input
                  id="new-sensor-unit"
                  value={newSensorForm.unit}
                  onChange={(e) =>
                    setNewSensorForm({ ...newSensorForm, unit: e.target.value })
                  }
                  placeholder="e.g., °C, ppm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-sensor-status">Status</Label>
              <Select
                value={newSensorForm.status}
                onValueChange={(value) =>
                  setNewSensorForm({ ...newSensorForm, status: value })
                }
              >
                <SelectTrigger id="new-sensor-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="new-sensor-connected"
                checked={newSensorForm.connected}
                onChange={(e) =>
                  setNewSensorForm({
                    ...newSensorForm,
                    connected: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="new-sensor-connected">Sensor Connected</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSensorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSensor}>Add Sensor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sensor Dialog */}
      <AlertDialog open={deleteSensorDialog} onOpenChange={setDeleteSensorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sensor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sensorToDelete?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSensor}
              className="bg-destructive"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
