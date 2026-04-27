"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Event = {
  id: number;
  name: string;
  description: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  imageUrl: string;
};

type ApiEvent = {
  id: number;
  title: string;
  description: string;
  venue: string;
  event_date: string;
  event_time: string;
  image_url: string;
};

const EVENTS_API_URL =
  process.env.NEXT_PUBLIC_EVENTS_API_URL || "http://event-service/api";

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${EVENTS_API_URL}/events`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await res.json();

      const formatted = (data as ApiEvent[]).map((e) => ({
        id: e.id,
        name: e.title,
        description: e.description,
        venue: e.venue,
        eventDate: e.event_date,
        eventTime: e.event_time,
        imageUrl: e.image_url,
      }));

      setEvents(formatted);
    } catch {
      // Keep UI stable if events service is unavailable in local development.
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <section className="px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-gray-950 flex items-center justify-center">
          Available Events
        </h2>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="group rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition duration-300"
              >
                {/* Placeholder Image */}
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src={event.imageUrl || "https://via.placeholder.com/800x400"}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Event Info */}
                <div className="p-4 flex flex-col justify-between h-auto">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                      {event.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {event.description}
                    </p>

                    {/* Extra info from backend */}
                    <p className="text-sm text-gray-500">
                      📍 {event.venue}
                    </p>
                    <p className="text-sm text-gray-500">
                      📅 {new Date(event.eventDate).toDateString()} • {event.eventTime}
                    </p>
                  </div>

                  {/* Button */}
                  <div className="mt-4">
                    <Link
                      href={`/events/${event.id}`}
                      className="block text-center bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition duration-300 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No events found</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
