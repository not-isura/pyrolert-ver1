import { getRooms, getUsers, testConnection } from './supabaseService';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Connection
    const isConnected = await testConnection();
    console.log('✅ Connection test:', isConnected ? 'SUCCESS' : 'FAILED');
    
    // Test 2: Fetch rooms
    const rooms = await getRooms();
    console.log('✅ Rooms fetched:', rooms.length, 'rooms');
    console.log('   Sample room:', rooms[0]);
    
    // Test 3: Fetch users
    const users = await getUsers();
    console.log('✅ Users fetched:', users.length, 'users');
    console.log('   Sample user:', users[0]);
    
    console.log('🎉 All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}
