"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type TicketType = {
  id: number;
  type_name: string;
  price: string;
  available_quantity: number;
};

type Event = {
  id: number;
  name: string;
  description: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  organizer: string;
  imageUrl: string;
};

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);

        const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || '/api'}/events/${eventId}`
        );

        if (!res.ok) {
          setError("Event not found");
          return;
        }

        const data = await res.json();

        // 🔥 Map backend → frontend
        const e = data.event;

        setEvent({
          id: e.id,
          name: e.title,
          description: e.description,
          venue: e.venue,
          eventDate: e.event_date,
          eventTime: e.event_time,
          organizer: e.organizer_name,
          imageUrl: e.image_url,
        });

        setTicketTypes(data.ticketTypes);

        // default select first ticket
        if (data.ticketTypes.length > 0) {
          setSelectedTicket(data.ticketTypes[0]);
        }

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
      <section className="min-h-screen flex items-center justify-center">
        <p>Loading event details...</p>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p>{error || "Event not found"}</p>
        <Link href="/events">Back to Events</Link>
      </section>
    );
  }

  return (
    <div className="bg-white text-gray-900">
      {/* Back */}
      <div className="px-6 py-6 max-w-4xl mx-auto">
        <Link href="/events">← Back to Events</Link>
      </div>

      <section className="px-6 pb-20 max-w-4xl mx-auto">
        {/* Placeholder Image */}
        <div className="mb-12">
          <img
            src={event.imageUrl || "https://via.placeholder.com/800x400"}
            alt={event.name}
            className="w-full h-96 object-cover rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold mb-4">{event.name}</h1>

            <p className="text-gray-600 mb-4">
              📍 {event.venue}
            </p>

            <p className="text-gray-600 mb-4">
              📅 {new Date(event.eventDate).toDateString()} • {event.eventTime}
            </p>

            <p className="text-gray-600 mb-6">
              👤 Organized by {event.organizer}
            </p>

            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-gray-700">{event.description}</p>
          </div>

          {/* RIGHT */}
          <div>
            <div className="bg-gray-50 p-6 rounded-xl border">
              
              {/* Ticket Selector */}
              <div className="mb-4">
                <label className="block mb-2 font-medium">Ticket Type</label>

                <select
                  className="w-full border p-2 rounded"
                  onChange={(e) => {
                    const ticket = ticketTypes.find(
                      (t) => t.id === Number(e.target.value)
                    );
                    setSelectedTicket(ticket || null);
                  }}
                >
                  {ticketTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type_name} (Rs. {t.price})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-gray-600">Price</p>
                <p className="text-2xl font-bold">
                  Rs. {selectedTicket?.price || "0"}
                </p>
              </div>

              {/* Buy Button */}
              <Link href={`/payment/${event.id}?ticketTypeId=${selectedTicket?.id || ''}&price=${selectedTicket?.price || '0'}&ticketName=${encodeURIComponent(selectedTicket?.type_name || 'Standard')}`}>
                <button className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors duration-300">
                  Buy Ticket
                </button>
              </Link>

              <p className="text-center text-sm mt-2">
                Secure checkout
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
