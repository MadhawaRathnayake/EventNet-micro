"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Event, fetchEventById } from "../../../dummyData/DummyData";

export default function EventDetailPage() {
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
      {/* Back Button */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <Link
          href="/events"
          className="text-gray-600 hover:text-gray-900 font-medium transition duration-300"
        >
          ← Back to Events
        </Link>
      </div>

      {/* Event Detail */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        {/* Event Image */}
        <div className="mb-12">
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-96 object-cover rounded-xl shadow-lg"
          />
        </div>

        {/* Event Info */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="md:col-span-2">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              {event.name}
            </h1>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-950">
                About This Event
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Right Column - Sticky Card */}
          <div className="md:col-span-1">
            <div className="sticky top-6 bg-gray-50 p-8 rounded-xl border border-gray-200">
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold text-gray-950">
                  ${event.price.toFixed(2)}
                </p>
              </div>

              <button
                className="w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition duration-300 mb-4"
              >
                Buy Now
              </button>

              <p className="text-center text-sm text-gray-500">
                Secure checkout powered by EventNet
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
