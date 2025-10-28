
import React from 'react';
import { Event } from '../types';

interface EventsPageProps {
  events: Event[];
  onNavigateHome: () => void;
}

const EventsPage = ({ events, onNavigateHome }: EventsPageProps) => {
    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
                    <h1 className="text-3xl font-bold text-unistay-navy">Campus Events</h1>
                    <button onClick={onNavigateHome} className="font-semibold text-unistay-navy hover:text-unistay-yellow transition-colors flex items-center gap-2">
                        <i className="fas fa-arrow-left"></i>
                        Back to Home
                    </button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pt-24">
                 {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event, index) => (
                            <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300" style={{ animation: 'fade-in-up 0.5s ease-out forwards', animationDelay: `${index * 100}ms` }}>
                                <div className="relative">
                                    <img src={event.imageUrl} alt={event.title} className="h-56 w-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-unistay-yellow text-unistay-navy text-center rounded-lg px-4 py-2 shadow-lg">
                                        <p className="font-extrabold text-2xl">{event.day}</p>
                                        <p className="font-bold text-sm leading-tight">{event.month}</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-xl text-unistay-navy mb-2 group-hover:text-unistay-yellow transition-colors">{event.title}</h3>
                                    <p className="text-sm text-gray-600"><i className="fas fa-calendar-alt text-gray-400 mr-2"></i>{event.date}</p>
                                    <p className="text-sm text-gray-600 mt-1"><i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>{event.location}</p>
                                    <button className="mt-4 w-full bg-unistay-navy text-white font-semibold py-2 rounded-lg hover:bg-opacity-80 transition-all transform hover:scale-105">
                                        More Info
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <i className="fas fa-calendar-times text-4xl text-gray-300 mb-4"></i>
                        <h3 className="text-xl font-semibold text-unistay-navy">No Upcoming Events</h3>
                        <p className="text-gray-500 mt-2">Please check back soon for new events!</p>
                    </div>
                 )}
            </main>
        </div>
    );
};

export default EventsPage;