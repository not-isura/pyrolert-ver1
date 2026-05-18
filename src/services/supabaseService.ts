import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export type UserRole = 'security' | 'admin' | 'dean' | 'facility' | 'director';
export type UserStatus = 'active' | 'inactive';
export type RoomStatus = 'normal' | 'warning' | 'alert' | 'error';
export type SensorStatus = 'normal' | 'warning' | 'critical';
export type SensorType = 'temperature' | 'co' | 'no2' | 'o2' | 'pm25' | 'pm10';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  last_updated: string;
  occupants: number;
  occupant_change: number;
  created_at: string;
}

export interface Sensor {
  id: string;
  room_id: string;
  name: string;
  type: SensorType;
  value: number;
  unit: string;
  status: SensorStatus;
  connected: boolean;
  last_reading: string;
  created_at: string;
}

export interface EventLog {
  id: string;
  timestamp: string;
  location: string;
  event_type: RoomStatus;
  room_id: string | null;
  created_at: string;
}

export interface CameraSnapshot {
  id: string;
  room_id: string;
  image_url: string;
  captured_at: string;
  created_at: string;
}

// =====================================================
// USER OPERATIONS
// =====================================================

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await (supabase
    .from('users') as any)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getUserById = async (id: string): Promise<User> => {
  const { data, error } = await (supabase
    .from('users') as any)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createUser = async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
  const { data, error } = await (supabase
    .from('users') as any)
    .insert([user])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> => {
  const { data, error } = await (supabase
    .from('users') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  const { error } = await (supabase
    .from('users') as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// =====================================================
// ROOM OPERATIONS
// =====================================================

export const getRooms = async (): Promise<Room[]> => {
  const { data, error } = await (supabase
    .from('rooms') as any)
    .select('*')
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const getRoomById = async (roomId: string): Promise<Room | null> => {
  console.log('getRoomById called with:', roomId);
  
  const { data, error } = await (supabase
    .from('rooms') as any)
    .select('*')
    .eq('id', roomId)
    .single();
  
  if (error) {
    console.error('getRoomById error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    
    if (error.code === 'PGRST116') {
      // No rows returned
      console.log('No room found with ID:', roomId);
      return null;
    }
    throw error;
  }
  
  console.log('getRoomById returned:', data);
  return data;
};

export const createRoom = async (room: Omit<Room, 'id' | 'created_at'>): Promise<Room> => {
  const { data, error } = await (supabase
    .from('rooms') as any)
    .insert([room])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateRoom = async (id: string, updates: Partial<Omit<Room, 'id' | 'created_at'>>): Promise<Room> => {
  const { data, error } = await (supabase
    .from('rooms') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  const { error } = await (supabase
    .from('rooms') as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateRoomStatus = async (
  roomId: string,
  status: RoomStatus,
  occupants?: number,
  occupantChange?: number
): Promise<Room> => {
  const updates: any = {
    status,
    last_updated: new Date().toISOString()
  };
  
  if (occupants !== undefined) updates.occupants = occupants;
  if (occupantChange !== undefined) updates.occupant_change = occupantChange;
  
  const { data, error } = await (supabase
    .from('rooms') as any)
    .update(updates)
    .eq('id', roomId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// =====================================================
// SENSOR OPERATIONS
// =====================================================

export const getSensorsByRoom = async (roomId: string): Promise<Sensor[]> => {
  const { data, error } = await (supabase
    .from('sensors') as any)
    .select('*')
    .eq('room_id', roomId)
    .order('type', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const createSensor = async (sensor: Omit<Sensor, 'id' | 'created_at'>): Promise<Sensor> => {
  const { data, error } = await (supabase
    .from('sensors') as any)
    .insert([sensor])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateSensor = async (id: string, updates: Partial<Omit<Sensor, 'id' | 'created_at'>>): Promise<Sensor> => {
  const { data, error } = await (supabase
    .from('sensors') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteSensor = async (id: string): Promise<void> => {
  const { error } = await (supabase
    .from('sensors') as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateSensorReading = async (
  sensorId: string,
  value: number,
  status: SensorStatus,
  connected: boolean = true
): Promise<Sensor> => {
  const { data, error } = await (supabase
    .from('sensors') as any)
    .update({
      value,
      status,
      connected,
      last_reading: new Date().toISOString()
    })
    .eq('id', sensorId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// =====================================================
// EVENT LOG OPERATIONS
// =====================================================

export const getEventLogs = async (): Promise<EventLog[]> => {
  const { data, error } = await (supabase
    .from('event_logs') as any)
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getEventLogsByDateRange = async (
  startDate?: string,
  endDate?: string
): Promise<EventLog[]> => {
  let query = (supabase
    .from('event_logs') as any)
    .select('*');
  
  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  
  if (endDate) {
    query = query.lte('timestamp', endDate);
  }
  
  const { data, error } = await query.order('timestamp', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createEventLog = async (log: Omit<EventLog, 'created_at'>): Promise<EventLog> => {
  const { data, error } = await (supabase
    .from('event_logs') as any)
    .insert([log])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// =====================================================
// CAMERA SNAPSHOT OPERATIONS
// =====================================================

export const getCameraSnapshotsByRoom = async (roomId: string): Promise<CameraSnapshot[]> => {
  const { data, error } = await (supabase
    .from('camera_snapshots') as any)
    .select('*')
    .eq('room_id', roomId)
    .order('captured_at', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
};

export const getLatestCameraSnapshot = async (roomId: string): Promise<CameraSnapshot | null> => {
  const { data, error } = await (supabase
    .from('camera_snapshots') as any)
    .select('*')
    .eq('room_id', roomId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  return data;
};

export const createCameraSnapshot = async (
  roomId: string,
  imageUrl: string
): Promise<CameraSnapshot> => {
  const { data, error } = await (supabase
    .from('camera_snapshots') as any)
    .insert([{
      room_id: roomId,
      image_url: imageUrl,
      captured_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await (supabase.from('rooms') as any).select('count').single();
    return !error;
  } catch {
    return false;
  }
};

// =====================================================
// AUTHENTICATION FUNCTIONS
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Invalid email or password');

  const { data: profile, error: profileError } = await (supabase
    .from('users') as any)
    .select('id, email, role, status, first_name, last_name')
    .eq('auth_user_id', data.user.id)
    .single();

  if (profileError || !profile) throw new Error('Failed to load user profile.');
  if (profile.status !== 'active') {
    await supabase.auth.signOut();
    throw new Error('Account is inactive. Please contact administrator.');
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
};

export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await (supabase
    .from('users') as any)
    .select('id, email, role, status, first_name, last_name')
    .eq('auth_user_id', session.user.id)
    .single();

  if (!profile || profile.status !== 'active') return null;

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    firstName: profile.first_name,
    lastName: profile.last_name,
  };
};

export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

export const hasRole = (user: AuthUser | null, requiredRole: UserRole | UserRole[]): boolean => {
  if (!user) return false;
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role);
};

