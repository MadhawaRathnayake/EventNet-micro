// app/profile/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/');
    },
  });

  if (status === 'loading') {
    return <div className="text-center mt-20 text-gray-500">Loading Session...</div>;
  }

  return (
    <div className="min-h-[90vh] bg-gray-50 p-8 flex justify-center items-start">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center">
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
        <p className="text-gray-500 mt-2">My id is{session?.user?.id}</p>
      </div>
    </div>
  );
}