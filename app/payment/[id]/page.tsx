"use client";

import { fetchEventById, Event } from '@/dummyData/DummyData';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'

function PaymentPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await fetchEventById(eventId);
        if (!data) {
          setError("Event not found");
          return;
        }
        setEvent(data);
      } catch (err) {
        setError("Failed to load event details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  if (loading) {
    return (
      <section className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading event details...</p>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <p className="text-lg text-gray-900 font-semibold">
          {error || "Event not found"}
        </p>
        <Link
          href="/"
          className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition duration-300"
        >
          Back to Events
        </Link>
      </section>
    );
  }

  return (
    <div className="bg-white text-gray-900">
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <Link
          href={`http://localhost:3000/events/${event.id}`}
          className="text-gray-600 hover:text-gray-900 font-medium transition duration-300"
        >
          ← Back to Event
        </Link>
      </div>

      <section className="px-6 pb-20 max-w-4xl mx-auto">
        {/* Event Image */}
        <div className="mb-12">
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-96 object-cover rounded-xl shadow-lg"
          />
        </div>

        {/* Payment Form */}
        <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">Payment Information</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                placeholder="XXXX XXXX XXXX XXXX"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <input
                  type="text"
                  id="expirationDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div>
                <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  placeholder="123"
                  required
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 mb-2">
                  Name on Card
                </label>
                <input
                  type="text"
                  id="nameOnCard"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-300"
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
            >
              Pay Now
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

export default PaymentPage