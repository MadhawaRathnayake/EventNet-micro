"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Event, fetchEventsByPage, fetchTotalPages } from "../../../dummyData/DummyData";

const EventsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentPage]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const events = await fetchEventsByPage(currentPage);
      const pages = await fetchTotalPages();
      setCurrentEvents(events);
      setTotalPages(pages);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasNextPage = currentPage < totalPages;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <section className="px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-12 text-gray-950 flex items-center justify-center">Available Events</h2>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Loading events...</p>
            </div>
          ) : currentEvents.length > 0 ? (
            currentEvents.map((event) => (
              <div
                key={event.id}
                className="group rounded-lg overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg transition duration-300"
              >
                {/* Event Image */}
                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <img
                    src={event.imageUrl}
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
                  </div>

                  {/* Price and Button */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      ${event.price.toFixed(2)}
                    </span>
                    <Link
                      href={`http://localhost:3000/events/${event.id}`}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition duration-300 text-sm"
                    >
                      Buy Ticket
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

        {/* Pagination */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            &lt;
          </button>

          <span className="text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="p-2 rounded-lg border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
          >
            &gt;
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
