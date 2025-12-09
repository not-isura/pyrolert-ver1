'use client';

import { useEffect, useState } from 'react';
import { getRooms, getUsers, testConnection } from '@/services/supabaseService';

export default function TestSupabasePage() {
  const [status, setStatus] = useState<string>('Testing...');
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runTests() {
      try {
        setStatus('🔍 Testing Supabase connection...');
        console.log('Starting Supabase tests...');

        // Test 1: Connection
        console.log('Test 1: Testing connection...');
        const isConnected = await testConnection();
        console.log('Connection result:', isConnected);
        
        if (!isConnected) {
          setError('❌ Connection test failed');
          setStatus('❌ Connection test failed');
          return;
        }
        setStatus('✅ Connection successful!');

        // Test 2: Fetch rooms
        console.log('Test 2: Fetching rooms...');
        setStatus('📦 Fetching rooms...');
        const roomsData = await getRooms();
        console.log('Rooms fetched:', roomsData);
        setRooms(roomsData);
        setStatus(`✅ Fetched ${roomsData.length} rooms`);

        // Test 3: Fetch users
        console.log('Test 3: Fetching users...');
        setStatus('👥 Fetching users...');
        const usersData = await getUsers();
        console.log('Users fetched:', usersData);
        setUsers(usersData);
        setStatus(`✅ Fetched ${usersData.length} users`);

        setStatus('🎉 All tests passed!');
        console.log('All tests completed successfully!');
      } catch (err: any) {
        console.error('Test error:', err);
        console.error('Error message:', err.message);
        console.error('Error details:', err.details);
        console.error('Error hint:', err.hint);
        console.error('Full error object:', JSON.stringify(err, null, 2));
        setError(`❌ Error: ${err.message}\n\nDetails: ${err.details || 'No details'}\n\nHint: ${err.hint || 'No hint'}\n\nFull: ${JSON.stringify(err, null, 2)}`);
        setStatus('❌ Tests failed');
      }
    }

    // Add timeout
    const timeout = setTimeout(() => {
      setError('⏱️ Test timeout - Connection is taking too long. Check your internet connection and Supabase project URL.');
      setStatus('❌ Timeout');
    }, 10000); // 10 second timeout

    runTests().finally(() => clearTimeout(timeout));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔧 Supabase Connection Test</h1>

        {/* Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-lg">{status}</p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              <pre className="whitespace-pre-wrap text-xs">{error}</pre>
            </div>
          )}
        </div>

        {/* Rooms */}
        {rooms.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📦 Rooms ({rooms.length})</h2>
            <div className="space-y-2">
              {rooms.map((room) => (
                <div key={room.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-semibold">{room.name}</div>
                  <div className="text-sm text-gray-600">
                    ID: {room.id} | Status: {room.status} | Occupants: {room.occupants}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {users.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">👥 Users ({users.length})</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded">
                  <div className="font-semibold">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.email} | Role: {user.role} | Status: {user.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {status === '🎉 All tests passed!' && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">✅ Supabase is Connected!</h3>
            <p>Your database is working correctly. You can now integrate it into your pages.</p>
            <p className="mt-2">
              <a href="/dashboard" className="underline">Go to Dashboard →</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
