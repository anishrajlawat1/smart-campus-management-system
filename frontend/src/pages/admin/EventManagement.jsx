import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Clock3,
  MapPin,
  Users
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: '',
    venue: '',
    organizer_id: '',
    start_datetime: '',
    end_datetime: '',
  });

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch events');
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/users');
      setFaculty(res.data.filter((u) => u.role === 'faculty' || u.role === 'admin'));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch organizers');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchFaculty();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      event_type: '',
      venue: '',
      organizer_id: '',
      start_datetime: '',
      end_datetime: '',
    });
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/events/${editing.id}`, form);
      } else {
        await api.post('/events', form);
      }

      resetForm();
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (event) => {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      venue: event.venue,
      organizer_id: String(event.organizer_id),
      start_datetime: event.start_datetime.slice(0, 16),
      end_datetime: event.end_datetime.slice(0, 16),
    });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this event?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const totalEvents = events.length;
  const upcomingEvents = events.filter(
    (e) => new Date(e.start_datetime) > new Date()
  ).length;
  const venuesUsed = new Set(events.map((e) => e.venue)).size;

  const summaryCards = [
    {
      label: 'Total Events',
      value: totalEvents,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents,
      icon: Clock3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Venues Used',
      value: venuesUsed,
      icon: MapPin,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Event Scheduler"
      subtitle="Create, manage, and organize campus events and venue bookings."
    >
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}>
              <card.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{card.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            {editing ? 'Edit Event' : 'Create Event'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Schedule campus events and prevent double booking of venues.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Event Title"
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            placeholder="Event Description"
            rows="4"
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium resize-none"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Event Type (Workshop, Seminar, Meeting...)"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.event_type}
              onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Venue"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              required
            />

            <select
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.organizer_id}
              onChange={(e) => setForm({ ...form, organizer_id: e.target.value })}
              required
            >
              <option value="">Select Organizer</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.role})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="datetime-local"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.start_datetime}
              onChange={(e) => setForm({ ...form, start_datetime: e.target.value })}
              required
            />

            <input
              type="datetime-local"
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={form.end_datetime}
              onChange={(e) => setForm({ ...form, end_datetime: e.target.value })}
              required
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <Plus size={18} />
              {editing ? 'Update Event' : 'Create Event'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Scheduled Events</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {events.length} event{events.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-2875">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Event
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Type
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Venue
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Organizer
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Schedule
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {events.map((event, index) => (
                <tr
                  key={event.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-800">{event.title}</p>
                      <p className="text-sm text-slate-500 font-medium mt-1 max-w-md truncate">
                        {event.description || 'No description'}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-flex px-3 py-2 rounded-2xl text-sm font-bold bg-indigo-100 text-indigo-600">
                      {event.event_type}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-slate-700 font-medium">{event.venue}</td>

                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-800">{event.organizer_name}</p>
                      <p className="text-sm text-slate-500">{event.organizer_email}</p>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-slate-500 font-medium">
                    <div>{new Date(event.start_datetime).toLocaleString()}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      to {new Date(event.end_datetime).toLocaleString()}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(event.id)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {events.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No events scheduled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
};

export default EventManagement;