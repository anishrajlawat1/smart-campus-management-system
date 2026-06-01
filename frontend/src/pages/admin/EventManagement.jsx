import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  Clock3,
  MapPin,
  Users,
  RefreshCw,
  CalendarClock,
  UserCheck,
  Search,
  Filter,
  X,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  const [form, setForm] = useState({
    title: '',
    description: '',
    event_type: '',
    venue: '',
    organizer_id: '',
    audience_type: 'all',
    event_date: '',
    start_time: '',
    end_time: '',
  });

  const timeSlots = [
    { label: '7:00 AM - 8:00 AM', start: '07:00', end: '08:00' },
    { label: '8:00 AM - 9:00 AM', start: '08:00', end: '09:00' },
    { label: '9:00 AM - 10:00 AM', start: '09:00', end: '10:00' },
    { label: '10:00 AM - 11:00 AM', start: '10:00', end: '11:00' },
    { label: '11:00 AM - 12:00 PM', start: '11:00', end: '12:00' },
    { label: '12:00 PM - 1:00 PM', start: '12:00', end: '13:00' },
    { label: '1:00 PM - 2:00 PM', start: '13:00', end: '14:00' },
    { label: '2:00 PM - 3:00 PM', start: '14:00', end: '15:00' },
    { label: '3:00 PM - 4:00 PM', start: '15:00', end: '16:00' },
  ];

  const fetchEvents = async () => {
    setLoading(true);

    try {
      const res = await api.get('/events');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/users');
      const users = Array.isArray(res.data) ? res.data : [];

      setFaculty(
        users.filter((u) => u.role === 'faculty' || u.role === 'admin')
      );
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch coordinators');
      setFaculty([]);
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
      audience_type: 'all',
      event_date: '',
      start_time: '',
      end_time: '',
    });

    setEditing(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAudienceFilter('all');
    setVenueFilter('all');
  };

  const buildDateTime = (date, time) => {
    if (!date || !time) return '';
    return `${date}T${time}`;
  };

  const splitDateTime = (dateTimeValue) => {
    if (!dateTimeValue) {
      return {
        date: '',
        time: '',
      };
    }

    const value = String(dateTimeValue);

    if (value.includes('T')) {
      const [date, timePart] = value.split('T');

      return {
        date,
        time: timePart.slice(0, 5),
      };
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return {
        date: '',
        time: '',
      };
    }

    const date = parsed.toISOString().slice(0, 10);
    const time = parsed.toTimeString().slice(0, 5);

    return {
      date,
      time,
    };
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Date not set';

    try {
      return new Date(dateValue).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateValue;
    }
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return 'Time not set';

    try {
      return new Date(dateValue).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateValue;
    }
  };

  const formatDateTimeRange = (event) => {
    return `${formatTime(event.start_datetime)} - ${formatTime(
      event.end_datetime
    )}`;
  };

  const formatAudience = (audienceType) => {
    if (audienceType === 'students') return 'Students Only';
    if (audienceType === 'faculty') return 'Faculty Only';
    return 'All Campus';
  };

  const getEventStatus = (event) => {
    return new Date(event.start_datetime) > new Date() ? 'upcoming' : 'past';
  };

  const applyTimeSlot = (slot) => {
    setForm((prev) => ({
      ...prev,
      start_time: slot.start,
      end_time: slot.end,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start_datetime = buildDateTime(form.event_date, form.start_time);
    const end_datetime = buildDateTime(form.event_date, form.end_time);

    if (!start_datetime || !end_datetime) {
      alert('Please select event date, start time, and end time');
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      event_type: form.event_type,
      venue: form.venue,
      organizer_id: form.organizer_id,
      audience_type: form.audience_type,
      start_datetime,
      end_datetime,
    };

    try {
      if (editing) {
        await api.put(`/events/${editing.id}`, payload);
      } else {
        await api.post('/events', payload);
      }

      resetForm();
      fetchEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (event) => {
    const start = splitDateTime(event.start_datetime);
    const end = splitDateTime(event.end_datetime);

    setEditing(event);

    setForm({
      title: event.title || '',
      description: event.description || '',
      event_type: event.event_type || '',
      venue: event.venue || '',
      organizer_id: String(event.organizer_id || ''),
      audience_type: event.audience_type || 'all',
      event_date: start.date,
      start_time: start.time,
      end_time: end.time,
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
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

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)
    );
  }, [events]);

  const venueOptions = useMemo(() => {
    return [...new Set(events.map((event) => event.venue).filter(Boolean))].sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return sortedEvents.filter((event) => {
      const status = getEventStatus(event);

      const searchableText = `
        ${event.title || ''}
        ${event.description || ''}
        ${event.event_type || ''}
        ${event.venue || ''}
        ${event.audience_type || ''}
        ${event.organizer_name || ''}
        ${event.organizer_email || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      const matchesAudience =
        audienceFilter === 'all' ||
        String(event.audience_type || 'all') === audienceFilter;

      const matchesVenue =
        venueFilter === 'all' || String(event.venue || '') === venueFilter;

      return matchesSearch && matchesStatus && matchesAudience && matchesVenue;
    });
  }, [sortedEvents, searchTerm, statusFilter, audienceFilter, venueFilter]);

  const upcomingEvents = filteredEvents.filter(
    (event) => getEventStatus(event) === 'upcoming'
  );

  const pastEvents = filteredEvents.filter(
    (event) => getEventStatus(event) === 'past'
  );

  const allUpcomingEvents = sortedEvents.filter(
    (event) => getEventStatus(event) === 'upcoming'
  );

  const allPastEvents = sortedEvents.filter(
    (event) => getEventStatus(event) === 'past'
  );

  const venuesUsed = new Set(events.map((e) => e.venue).filter(Boolean)).size;

  const summaryCards = [
    {
      label: 'Total Events',
      value: events.length,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      filter: 'all',
    },
    {
      label: 'Upcoming Events',
      value: allUpcomingEvents.length,
      icon: Clock3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      filter: 'upcoming',
    },
    {
      label: 'Past Events',
      value: allPastEvents.length,
      icon: CalendarClock,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      filter: 'past',
    },
    {
      label: 'Venues Used',
      value: venuesUsed,
      icon: MapPin,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      filter: 'all',
    },
  ];

  const selectedCoordinator = faculty.find(
    (person) => String(person.id) === String(form.organizer_id)
  );

  const hasActiveFilters =
    searchTerm || statusFilter !== 'all' || audienceFilter !== 'all' || venueFilter !== 'all';

  const renderEventCard = (event, isPast = false) => (
    <div
      key={event.id}
      className={`bg-white rounded-3xl border border-slate-100 shadow-sm p-6 ${
        isPast
          ? 'opacity-80'
          : 'hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                isPast
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              {isPast ? 'Past Event' : event.event_type}
            </span>

            <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-black">
              {formatAudience(event.audience_type)}
            </span>
          </div>

          <h4 className="text-lg font-black text-slate-900 wrap-break-word">
            {event.title}
          </h4>

          <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-2">
            {event.description || 'No description added.'}
          </p>
        </div>

        {!isPast && (
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarDays size={22} />
          </div>
        )}
      </div>

      <div className="space-y-3 text-sm text-slate-500 font-medium">
        <p className="flex items-center gap-2">
          <CalendarDays size={16} />
          {formatDate(event.start_datetime)}
        </p>

        <p className="flex items-center gap-2">
          <Clock3 size={16} />
          {formatDateTimeRange(event)}
        </p>

        <p className="flex items-center gap-2">
          <MapPin size={16} />
          {event.venue}
        </p>

        <p className="flex items-center gap-2">
          <UserCheck size={16} />
          {event.organizer_name || 'Coordinator not set'}
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
        <button
          type="button"
          onClick={() => handleEdit(event)}
          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
        >
          <Pencil size={16} />
        </button>

        <button
          type="button"
          onClick={() => handleDelete(event.id)}
          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Event Scheduler"
      subtitle="Create, manage, search, and filter campus events and venue bookings."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setStatusFilter(card.filter)}
            className={`bg-white p-6 rounded-3xl shadow-sm border text-left hover:shadow-lg hover:-translate-y-1 transition-all ${
              statusFilter === card.filter
                ? 'border-indigo-300 ring-2 ring-indigo-100'
                : 'border-slate-100'
            }`}
          >
            <div
              className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <card.icon size={24} />
            </div>

            <p className="text-slate-500 text-sm font-bold">{card.label}</p>

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {card.value}
            </h3>
          </button>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {editing ? 'Edit Event' : 'Create Event'}
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Assign an internal coordinator and choose who the event is for.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchEvents();
              fetchFaculty();
            }}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition disabled:opacity-60"
          >
            <RefreshCw size={18} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="space-y-4">
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
                rows="5"
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium resize-none"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Event Type e.g. Workshop, Seminar"
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={form.event_type}
                  onChange={(e) =>
                    setForm({ ...form, event_type: e.target.value })
                  }
                  required
                />

                <input
                  type="text"
                  placeholder="Venue e.g. Hall A, Lab 2"
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={form.organizer_id}
                  onChange={(e) =>
                    setForm({ ...form, organizer_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Event Coordinator</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.role})
                    </option>
                  ))}
                </select>

                <select
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  value={form.audience_type}
                  onChange={(e) =>
                    setForm({ ...form, audience_type: e.target.value })
                  }
                  required
                >
                  <option value="all">All Campus</option>
                  <option value="students">Students Only</option>
                  <option value="faculty">Faculty Only</option>
                </select>
              </div>

              {selectedCoordinator && (
                <div className="px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 text-sm font-bold">
                  Coordinator: {selectedCoordinator.name}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <CalendarClock size={21} />
              </div>

              <div>
                <h3 className="font-black text-slate-800">
                  Event Date & Time
                </h3>

                <p className="text-sm text-slate-500 font-medium">
                  Choose date, then pick a quick slot or enter custom time.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">
                  Event Date
                </label>

                <input
                  type="date"
                  className="w-full px-4 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm({ ...form, event_date: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">
                  Start Time
                </label>

                <input
                  type="time"
                  className="w-full px-4 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-500 mb-2">
                  End Time
                </label>

                <input
                  type="time"
                  className="w-full px-4 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-bold text-slate-500 mb-3">
                Quick Time Slots
              </p>

              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => {
                  const selected =
                    form.start_time === slot.start &&
                    form.end_time === slot.end;

                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => applyTimeSlot(slot)}
                      className={`px-4 py-2 rounded-2xl text-sm font-bold transition ${
                        selected
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>
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

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Smart Event Filters
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full xl:w-auto">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="past">Past Only</option>
            </select>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Audiences</option>
              <option value="students">Students Only</option>
              <option value="faculty">Faculty Only</option>
            </select>

            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Venues</option>
              {venueOptions.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={15} />
            Clear Filters
          </button>
        )}
      </section>

      <section className="space-y-8">
        {upcomingEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4">
              Upcoming Events
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => renderEventCard(event, false))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4">
              Past Events
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {pastEvents.map((event) => renderEventCard(event, true))}
            </div>
          </div>
        )}

        {filteredEvents.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
              <CalendarDays size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              {hasActiveFilters
                ? 'No matching events found.'
                : 'No events scheduled yet.'}
            </h3>

            <p className="text-slate-500 font-medium mt-2">
              {hasActiveFilters
                ? 'Try changing the search term, status, audience, or venue filter.'
                : 'Create your first campus event using the form above.'}
            </p>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default EventManagement;