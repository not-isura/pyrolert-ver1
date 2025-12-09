-- Update Room IDs to use Room_XXX format
-- Run this in your Supabase SQL Editor

-- SOLUTION: Temporarily disable foreign key constraints, update all tables, then re-enable

BEGIN;

-- Disable foreign key constraints temporarily
ALTER TABLE sensors DROP CONSTRAINT IF EXISTS sensors_room_id_fkey;
ALTER TABLE event_logs DROP CONSTRAINT IF EXISTS event_logs_room_id_fkey;
ALTER TABLE camera_snapshots DROP CONSTRAINT IF EXISTS camera_snapshots_room_id_fkey;

-- ========================================
-- Now update all tables (order doesn't matter anymore)
-- ========================================

-- Step 1: Update Conference Room A (CONF_A → Room_440)
UPDATE rooms SET id = 'Room_440' WHERE id = 'CONF_A';
UPDATE sensors SET room_id = 'Room_440' WHERE room_id = 'CONF_A';
UPDATE event_logs SET room_id = 'Room_440' WHERE room_id = 'CONF_A';
UPDATE camera_snapshots SET room_id = 'Room_440' WHERE room_id = 'CONF_A';

-- Step 2: Update Laboratory 101 (LAB_101 → Room_435)
UPDATE rooms SET id = 'Room_435' WHERE id = 'LAB_101';
UPDATE sensors SET room_id = 'Room_435' WHERE room_id = 'LAB_101';
UPDATE event_logs SET room_id = 'Room_435' WHERE room_id = 'LAB_101';
UPDATE camera_snapshots SET room_id = 'Room_435' WHERE room_id = 'LAB_101';

-- Step 3: Update Office B (OFF_B → Room_301)
UPDATE rooms SET id = 'Room_301' WHERE id = 'OFF_B';
UPDATE sensors SET room_id = 'Room_301' WHERE room_id = 'OFF_B';
UPDATE event_logs SET room_id = 'Room_301' WHERE room_id = 'OFF_B';
UPDATE camera_snapshots SET room_id = 'Room_301' WHERE room_id = 'OFF_B';

-- Step 4: Update Storage Room 1 (STOR_1 → Room_102)
UPDATE rooms SET id = 'Room_102' WHERE id = 'STOR_1';
UPDATE sensors SET room_id = 'Room_102' WHERE room_id = 'STOR_1';
UPDATE event_logs SET room_id = 'Room_102' WHERE room_id = 'STOR_1';
UPDATE camera_snapshots SET room_id = 'Room_102' WHERE room_id = 'STOR_1';

-- Re-enable foreign key constraints
ALTER TABLE sensors 
ADD CONSTRAINT sensors_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE event_logs 
ADD CONSTRAINT event_logs_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE camera_snapshots 
ADD CONSTRAINT camera_snapshots_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

COMMIT;

-- ========================================
-- Verify the changes
-- ========================================
SELECT 'Rooms:' as table_name;
SELECT * FROM rooms ORDER BY id;

SELECT 'Sensor counts per room:' as info;
SELECT room_id, COUNT(*) as sensor_count FROM sensors GROUP BY room_id ORDER BY room_id;

SELECT 'Event log counts per room:' as info;
SELECT room_id, COUNT(*) as event_count FROM event_logs GROUP BY room_id ORDER BY room_id;
