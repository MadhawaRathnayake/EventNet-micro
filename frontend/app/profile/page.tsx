// app/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/');
    },
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchBookings = async () => {
        try {
          // Fetch all bookings from our new Azure PostgreSQL backend
          const res = await api.get('/bookings');
          if (res.success && res.data) {
            setBookings(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch bookings:", error);
        } finally {
          setLoadingBookings(false);
        }
      };

      fetchBookings();
    }
  }, [status]);

  if (status === 'loading') {
    return <div className="text-center mt-20 text-gray-500">Loading Session...</div>;
  }

  return (
    <div className="min-h-[90vh] bg-gray-50 p-8">
      {/* CSS Grid: 3 columns total (lg screens). Gap defines spacing. */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Profile Card (Takes 1 of 3 columns) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-28 h-28 rounded-full border-4 border-gray-200 shadow-sm mb-4"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-800">{session?.user?.name || "Unknown"}</h1>
            <p className="text-gray-500 mt-2">{session?.user?.email}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Booked Tickets Table (Takes 2 of 3 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Booked Tickets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-600">
                    <th className="py-3 pl-2">Booking ID</th>
                    <th className="py-3">Details</th>
                    <th className="py-3">Date Created</th>
                    <th className="py-3">Total Amount</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingBookings ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Loading your real bookings from Azure...
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 pl-2 font-medium text-gray-800">BKG-{booking.id}</td>
                        <td className="py-4 text-gray-600">
                          {booking.items && booking.items.length > 0 
                            ? booking.items[0].ticket_name 
                            : "N/A"}
                        </td>
                        <td className="py-4 text-gray-600">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 font-medium text-gray-800">${booking.total_amount}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            booking.status === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}