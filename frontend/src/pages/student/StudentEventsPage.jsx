import React, { useEffect, useState } from 'react';
import StudentLayout from './StudentLayout';
import api from '../../api';
import { CalendarDays, MapPin, Clock } from 'lucide-react';

const StudentEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(Array.isArray(res.data) ? res.data : []);
      } catch {
        setEvents([]);
      } finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  if (loading) return <StudentLayout title="Loading Events">Loading...</StudentLayout>;

  return (
    <StudentLayout pageLabel="Student Module" title="Campus Events" subtitle="Upcoming campus activities">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.length ? events.map(e => (
          <div key={e.id} className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
              <CalendarDays size={26} />
            </div>
            <h2 className="text-xl font-black text-gray-900">{e.title}</h2>
            <p className="text-gray-500 mt-2 text-sm">{e.description || 'No description available.'}</p>
            <div className="mt-5 space-y-2 text-gray-600 text-sm">
              <p className="flex items-center gap-2"><CalendarDays size={16} />{new Date(e.event_date || e.date).toLocaleDateString()}</p>
              {e.event_time && <p className="flex items-center gap-2"><Clock size={16} />{e.event_time}</p>}
              <p className="flex items-center gap-2"><MapPin size={16} />{e.location || 'Campus'}</p>
            </div>
          </div>
        )) : (
          <div className="col-span-full text-center text-gray-500">No events available.</div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentEventsPage;