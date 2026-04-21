"use client";

import Link from "next/link";
import EventsSection from "../events/events";
import { useSession } from "next-auth/react";

const LandingPage = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <div className="bg-white text-gray-900">

      {/* Hero Section */}
      <section className="h-full flex flex-col items-center justify-center text-center px-6 py-32 bg-white">
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight text-gray-950 tracking-tight">
            Discover & Book Events
          </h1>

          <p className="text-xl text-gray-500 mb-12 font-light leading-relaxed">
            Find extraordinary events, book with ease, and never miss a moment that matters.
          </p>
          {!isLoggedIn? (
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition duration-300 shadow-sm"
          >
            Get Started Free
          </Link>
          ):(
          <Link
            href="/events"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition duration-300 shadow-sm"
          >
            Discover all events
          </Link>
          )}
        </div>
      </section>

      <EventsSection />

      {/* CTA Section */}
      {!isLoggedIn ?
        (<section className="px-6 py-24 bg-gray-50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-950">
              Ready to start exploring?
            </h2>
            <p className="text-lg text-gray-500 mb-10 font-light">
              Join thousands of users discovering their next favorite event.
            </p>

            <Link
              href="/signup"
              className="inline-block bg-gray-900 text-white px-10 py-4 rounded-lg font-medium hover:bg-gray-800 transition duration-300 shadow-sm"
            >
              Create Your Account
            </Link>
          </div>
        </section>
        ) : (
          <>
            <div className="py-4"></div>
          </>
        )}
    </div>
  )
};

export default LandingPage;