'use client'; // Required because useSession uses React Context

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

const NavigationBar = () => {
  // 'data' contains user info if logged in. 'status' is loading, authenticated, or unauthenticated.
  const { data: session, status } = useSession();

  const isLoggedIn = status === 'authenticated';

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
      <Link href="/" className="text-2xl font-bold">
        EventNet
      </Link>

      <div className="flex gap-4 items-center">
        <Link href="/events" className="hover:text-gray-300">
          Events
        </Link>

        {status === 'loading' ? (
          <span className="text-gray-400">Loading...</span>
        ) : !isLoggedIn ? (
          <>
            <Link href="/login" className="hover:text-gray-300">
              Login
            </Link>
          </>
        ) : (
          <>
            <Link href="/bookings" className="hover:text-gray-300">
              My Bookings
            </Link>
            <Link href="/payments" className="hover:text-gray-300">
              My Payments
            </Link>
            <Link href="/profile" className="hover:text-gray-300">
              Profile
            </Link>
            <button onClick={() => signOut()} className="hover:text-gray-300">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavigationBar;