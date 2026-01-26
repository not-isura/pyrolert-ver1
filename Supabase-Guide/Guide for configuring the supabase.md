# Guide for Configuring Supabase

This guide explains how the Pyrolert project connects to Supabase and provides step-by-step instructions for configuring your own Supabase instance.

---

## Table of Contents

1. [Project Architecture Overview](#project-architecture-overview)
2. [How the Project Uses Supabase](#how-the-project-uses-supabase)
3. [Database Schema](#database-schema)
4. [Setting Up Supabase](#setting-up-supabase)
5. [Configuration Steps](#configuration-steps)
6. [Available Functions](#available-functions)
7. [Authentication Flow](#authentication-flow)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Project Architecture Overview

The Pyrolert application uses **Supabase** as its backend-as-a-service (BaaS) platform. The architecture consists of:

```
Frontend (Next.js) ←→ Supabase Client ←→ Supabase PostgreSQL Database
                              ↓
                        localStorage (Authentication)
```

### Key Components

- **`src/integrations/supabase/client.ts`** - Supabase client initialization
- **`src/integrations/supabase/types.ts`** - TypeScript type definitions from database
- **`src/services/supabaseService.ts`** - Service layer with CRUD operations
- **`src/app/providers.tsx`** - Authentication context provider

---

## How the Project Uses Supabase

### 1. **Supabase Client Initialization**

Located in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**Features:**
- Type-safe database access using generated TypeScript types
- Automatic session persistence using localStorage
- Auto-refresh tokens for seamless authentication
- Server-side rendering compatible (checks for `window` object)

### 2. **Service Layer Functions**

The `src/services/supabaseService.ts` file provides a complete service layer that abstracts database operations:

#### **User Operations**
- `getUsers()` - Fetch all users
- `getUserById(id)` - Get specific user
- `createUser(user)` - Create new user
- `updateUser(id, updates)` - Update user details
- `deleteUser(id)` - Delete user

#### **Room Operations**
- `getRooms()` - Fetch all rooms
- `getRoomById(roomId)` - Get specific room
- `createRoom(room)` - Register new room
- `updateRoom(id, updates)` - Update room details
- `deleteRoom(id)` - Delete room
- `updateRoomStatus(roomId, status, occupants, occupantChange)` - Update room status

#### **Sensor Operations**
- `getSensorsByRoom(roomId)` - Get all sensors in a room
- `createSensor(sensor)` - Add new sensor
- `updateSensor(id, updates)` - Update sensor details
- `deleteSensor(id)` - Remove sensor
- `updateSensorReading(sensorId, value, status, connected)` - Update sensor data

#### **Event Log Operations**
- `getEventLogs()` - Fetch all event logs
- `getEventLogsByDateRange(startDate, endDate)` - Filter logs by date
- `createEventLog(log)` - Create new event log

#### **Camera Snapshot Operations**
- `getCameraSnapshotsByRoom(roomId)` - Get room snapshots
- `getLatestCameraSnapshot(roomId)` - Get most recent snapshot
- `createCameraSnapshot(roomId, imageUrl)` - Save new snapshot

#### **Authentication Functions**
- `loginUser(email, password)` - User authentication
- `logoutUser()` - Clear user session
- `getCurrentUser()` - Get current logged-in user
- `isAuthenticated()` - Check if user is logged in
- `hasRole(role)` - Check user role permissions
- `isAdmin()` - Check if user is admin

### 3. **Type Safety**

The project uses automatically generated TypeScript types from the Supabase schema:

```typescript
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'security' | 'admin' | 'dean' | 'facility' | 'director';
export type UserStatus = 'active' | 'inactive';
```

---

## Database Schema

The Pyrolert database consists of the following tables:

### **1. users**
```sql
- id: uuid (Primary Key)
- first_name: text
- last_name: text
- email: text (Unique)
- password: text
- role: enum ('security', 'admin', 'dean', 'facility', 'director')
- status: enum ('active', 'inactive')
- created_at: timestamp
- updated_at: timestamp
```

### **2. rooms**
```sql
- id: uuid (Primary Key)
- name: text
- status: enum ('normal', 'warning', 'alert', 'error')
- last_updated: timestamp
- occupants: integer
- occupant_change: integer
- created_at: timestamp
```

### **3. sensors**
```sql
- id: uuid (Primary Key)
- room_id: uuid (Foreign Key → rooms.id)
- name: text
- type: enum ('temperature', 'co', 'no2', 'o2', 'pm25', 'pm10')
- value: numeric
- unit: text
- status: enum ('normal', 'warning', 'critical')
- connected: boolean
- last_reading: timestamp
- created_at: timestamp
```

### **4. event_logs**
```sql
- id: uuid (Primary Key)
- timestamp: timestamp
- location: text
- event_type: enum ('normal', 'warning', 'alert', 'error')
- room_id: uuid (Foreign Key → rooms.id, nullable)
- created_at: timestamp
```

### **5. camera_snapshots**
```sql
- id: uuid (Primary Key)
- room_id: uuid (Foreign Key → rooms.id)
- image_url: text
- captured_at: timestamp
- created_at: timestamp
```

---

## Setting Up Supabase

### Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- Basic understanding of PostgreSQL

### Step 1: Create a New Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name:** Pyrolert (or your preferred name)
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Select Free or Pro based on needs
4. Click **"Create new project"**
5. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Configure Database Tables

1. Navigate to **Table Editor** in the Supabase dashboard
2. Create each table using the SQL Editor (go to **SQL Editor** tab)

#### Create Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('security', 'admin', 'dean', 'facility', 'director')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
```

#### Create Rooms Table

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'alert', 'error')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  occupants INTEGER DEFAULT 0,
  occupant_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster status filtering
CREATE INDEX idx_rooms_status ON rooms(status);
```

#### Create Sensors Table

```sql
CREATE TABLE sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('temperature', 'co', 'no2', 'o2', 'pm25', 'pm10')),
  value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'critical')),
  connected BOOLEAN DEFAULT TRUE,
  last_reading TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for room lookups
CREATE INDEX idx_sensors_room_id ON sensors(room_id);
```

#### Create Event Logs Table

```sql
CREATE TABLE event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('normal', 'warning', 'alert', 'error')),
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for timestamp queries
CREATE INDEX idx_event_logs_timestamp ON event_logs(timestamp DESC);
```

#### Create Camera Snapshots Table

```sql
CREATE TABLE camera_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for room and time lookups
CREATE INDEX idx_camera_snapshots_room_id ON camera_snapshots(room_id, captured_at DESC);
```

### Step 3: Set Up Row Level Security (RLS)

By default, Supabase enables RLS. For development, you can disable it or create policies:

#### Option A: Disable RLS (For Development Only)

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE camera_snapshots DISABLE ROW LEVEL SECURITY;
```

#### Option B: Create RLS Policies (Recommended for Production)

```sql
-- Allow all operations (you can customize this based on your needs)
CREATE POLICY "Enable all access for authenticated users" ON users
  FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON rooms
  FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON sensors
  FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON event_logs
  FOR ALL USING (true);

CREATE POLICY "Enable all access for authenticated users" ON camera_snapshots
  FOR ALL USING (true);
```

### Step 4: Insert Sample Data

#### Create Admin User

```sql
INSERT INTO users (first_name, last_name, email, password, role, status)
VALUES ('Admin', 'User', 'admin@pyrolert.com', 'Admin@123', 'admin', 'active');
```

#### Create Sample Rooms

```sql
INSERT INTO rooms (name, status, occupants, occupant_change)
VALUES 
  ('Room 101', 'normal', 25, 2),
  ('Room 102', 'warning', 30, -3),
  ('Room 103', 'normal', 20, 5);
```

---

## Configuration Steps

### Step 1: Get Supabase Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)

### Step 2: Configure Environment Variables

1. Create a `.env` file in the project root (if it doesn't exist)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Important Notes:**
- Never commit `.env` file to version control
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
- Keep your `service_role` key secret (don't use it in frontend)

### Step 3: Verify Connection

1. Run the development server:
```bash
npm run dev
```

2. Try logging in with your admin credentials
3. Check the browser console for connection logs

---

## Available Functions

### Example Usage

#### Fetching Rooms

```typescript
import { getRooms } from '@/services/supabaseService';

async function loadRooms() {
  try {
    const rooms = await getRooms();
    console.log('Rooms:', rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
  }
}
```

#### Creating a User

```typescript
import { createUser } from '@/services/supabaseService';

async function addNewUser() {
  try {
    const newUser = await createUser({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      role: 'security',
      status: 'active'
    });
    console.log('User created:', newUser);
  } catch (error) {
    console.error('Error creating user:', error);
  }
}
```

#### Updating Sensor Reading

```typescript
import { updateSensorReading } from '@/services/supabaseService';

async function updateTemperature(sensorId: string) {
  try {
    const sensor = await updateSensorReading(
      sensorId,
      25.5,        // value
      'normal',    // status
      true         // connected
    );
    console.log('Sensor updated:', sensor);
  } catch (error) {
    console.error('Error updating sensor:', error);
  }
}
```

---

## Authentication Flow

### How Authentication Works

1. **Login Process:**
   ```typescript
   // User enters credentials
   const user = await loginUser(email, password);
   
   // Service queries Supabase database
   // Validates credentials
   // Stores user data in localStorage
   // Returns AuthUser object
   ```

2. **Session Management:**
   ```typescript
   // Check if user is logged in
   const currentUser = getCurrentUser();
   
   // Retrieves user from localStorage
   // Returns AuthUser or null
   ```

3. **Protected Routes:**
   ```typescript
   // ProtectedRoute component checks authentication
   <ProtectedRoute allowedRoles={['admin', 'security']}>
     <YourComponent />
   </ProtectedRoute>
   ```

4. **Logout:**
   ```typescript
   await logoutUser();
   // Clears localStorage
   // Redirects to login page
   ```

### Authentication Context

The `src/app/providers.tsx` provides global auth state:

```typescript
const { user, isLoading, logout, refreshUser, resetLoading } = useAuth();

// user: Current user object or null
// isLoading: Loading state for auth operations
// logout: Function to logout user
// refreshUser: Function to refresh user data
// resetLoading: Function to reset loading state
```

---

## Best Practices

### 1. **Error Handling**

Always wrap Supabase operations in try-catch blocks:

```typescript
try {
  const data = await getRooms();
  return data;
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly error message
  toast({
    title: "Error",
    description: "Failed to load rooms. Please try again.",
    variant: "destructive"
  });
}
```

### 2. **Type Safety**

Use TypeScript types for all database operations:

```typescript
import { Room, Sensor } from '@/services/supabaseService';

const room: Room = await getRoomById('uuid-here');
const sensors: Sensor[] = await getSensorsByRoom(room.id);
```

### 3. **Data Validation**

Validate data before sending to database:

```typescript
if (!email || !password) {
  throw new Error('Email and password are required');
}

if (password.length < 8) {
  throw new Error('Password must be at least 8 characters');
}
```

### 4. **Query Optimization**

Use indexes and limit results when possible:

```typescript
// Get only recent logs
const recentLogs = await supabase
  .from('event_logs')
  .select('*')
  .order('timestamp', { ascending: false })
  .limit(50);
```

### 5. **Environment Variables**

Never hardcode credentials:

```typescript
// ❌ Bad
const url = 'https://xxxxx.supabase.co';

// ✅ Good
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

---

## Troubleshooting

### Common Issues

#### 1. **Connection Error**

**Problem:** Cannot connect to Supabase

**Solutions:**
- Check if environment variables are set correctly
- Verify project URL and API key in Supabase dashboard
- Check if project is active (not paused)
- Verify internet connection

#### 2. **CORS Error**

**Problem:** CORS policy blocking requests

**Solutions:**
- Ensure you're using the public/anon key (not service_role key)
- Check if your domain is allowed in Supabase dashboard
- Verify `NEXT_PUBLIC_` prefix in environment variables

#### 3. **Permission Denied**

**Problem:** Row Level Security blocking operations

**Solutions:**
- Check RLS policies in Supabase dashboard
- Disable RLS for development (not recommended for production)
- Create appropriate policies for your use case

#### 4. **No Rows Returned**

**Problem:** Queries return empty arrays

**Solutions:**
- Verify data exists in the table
- Check query filters (WHERE clauses)
- Inspect error codes (PGRST116 means no rows found)
- Use `.single()` only when expecting exactly one row

#### 5. **Type Errors**

**Problem:** TypeScript type mismatches

**Solutions:**
- Regenerate types: Run Supabase CLI type generation
- Update `src/integrations/supabase/types.ts`
- Check if database schema matches types

### Debug Mode

Enable logging for troubleshooting:

```typescript
// In supabaseService.ts
console.log('Query:', { roomId, filters });
const { data, error } = await supabase.from('rooms').select('*');
console.log('Result:', { data, error });
```

### Checking Database Status

```typescript
import { testConnection } from '@/services/supabaseService';

const isConnected = await testConnection();
console.log('Database connected:', isConnected);
```

---

## Additional Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Supabase JavaScript Client:** https://supabase.com/docs/reference/javascript
- **Next.js Integration:** https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review Supabase logs in the dashboard
3. Verify your database schema matches the expected structure
4. Ensure all environment variables are properly set

For project-specific issues, contact your development team.
