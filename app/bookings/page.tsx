// app/bookings/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../utils/apiClient';

type BookingItem = {
  ticket_name: string;
};

type Booking = {
  id: string | number;
  items?: BookingItem[];
  created_at: string;
  total_amount: string | number;
  status: string;
};

export default function BookingsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/');
    },
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchBookings = async () => {
        try {
          const rawUserId = session?.user?.id;
          const userId = Number(rawUserId);
          if (!Number.isInteger(userId) || userId <= 0) {
            setBookings([]);
            return;
          }

          const res = await api.get(`/bookings/user/${String(userId)}`, {
            headers: session?.backendToken
              ? { Authorization: `Bearer ${session.backendToken}` }
              : {},
          });
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
  }, [status, session?.user?.id, session?.backendToken]);

  if (status === 'loading') {
    return <div className="text-center mt-20 text-gray-500">Loading Session...</div>;
  }

  return (
    <div className="min-h-[90vh] bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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
                      Loading your bookings...
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
  );
}