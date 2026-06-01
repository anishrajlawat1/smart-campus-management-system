import React, { useEffect, useState } from 'react';
import StudentLayout from './StudentLayout';
import api from '../../api';
import {
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  User,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';

const StudentRoutinePage = () => {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = async () => {
    setLoading(true);

    try {
      const res = await api.get('/routines/student/my-routines');
      setRoutine(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load student routine:', error);
      alert(error.response?.data?.message || 'Failed to load routine');
      setRoutine([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, []);

  const formatTime = (time) => {
    if (!time) return 'Time not set';

    try {
      return String(time).slice(0, 5);
    } catch {
      return time;
    }
  };

  const dayOrder = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const groupedRoutine = dayOrder
    .map((day) => ({
      day,
      classes: routine.filter((item) => item.day_of_week === day),
    }))
    .filter((group) => group.classes.length > 0);

  if (loading) {
    return (
      <StudentLayout
        pageLabel="Student Module"
        title="My Classes"
        subtitle="Weekly Routine"
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center text-slate-500 font-bold">
          Loading routine...
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="My Classes"
      subtitle="Your assigned weekly class routine."
    >
      <div className="w-full max-w-300 space-y-8">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">
                Assigned Routine
              </p>

              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
                Weekly Timetable
              </h2>

              <p className="text-slate-500 font-medium mt-2">
                Showing only routines assigned to your course level.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRoutine}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </section>

        {groupedRoutine.length > 0 ? (
          groupedRoutine.map((group) => (
            <section key={group.day} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar size={22} />
                </div>

                <h3 className="text-xl font-black text-slate-900">
                  {group.day}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {group.classes.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 min-h-52.5 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                  >
                    <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner mb-5">
                      <BookOpen size={24} />
                    </div>

                    <h4 className="text-lg font-black text-slate-900 wrap-break-word">
                      {item.subject_name || item.subject || 'Subject not set'}
                    </h4>

                    <div className="mt-5 space-y-3 text-sm font-medium text-slate-500">
                      <p className="flex items-center gap-2">
                        <Clock size={16} />
                        {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {item.location || item.room || 'Room not set'}
                      </p>

                      <p className="flex items-center gap-2">
                        <User size={16} />
                        {item.faculty_name || 'Faculty not assigned'}
                      </p>

                      <p className="flex items-center gap-2">
                        <GraduationCap size={16} />
                        {item.course_name || 'Course'} / {item.level_name || 'Level'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
              <Calendar size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              No routines assigned.
            </h3>

            <p className="text-slate-500 font-medium mt-2">
              Your admin has not assigned a routine to your group yet.
            </p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentRoutinePage;