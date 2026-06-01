import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ClipboardList,
} from 'lucide-react';
import api from '../../api';
import FacultyLayout from './FacultyLayout';

const FacultyClasses = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [routines, setRoutines] = useState([]);

  const fetchMyClasses = async () => {
    try {
      const res = await api.get('/routines', {
        params: { faculty_id: user?.id },
      });

      setRoutines(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load classes');
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const sortedRoutines = [...routines].sort((a, b) => {
    const dayA = days.indexOf(a.day_of_week);
    const dayB = days.indexOf(b.day_of_week);

    if (dayA !== dayB) return dayA - dayB;

    return String(a.start_time).localeCompare(String(b.start_time));
  });

  const totalSections = new Set(routines.map((r) => r.group_id)).size;
  const totalSubjects = new Set(routines.map((r) => r.subject_id)).size;

  const summaryCards = [
    {
      label: 'Weekly Classes',
      value: routines.length,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Sections',
      value: totalSections,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Subjects',
      value: totalSubjects,
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="My Classes"
      subtitle="View your assigned weekly routine and teaching schedule."
    >
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
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
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">
            Weekly Teaching Schedule
          </h2>

          <p className="text-sm text-slate-500 font-medium mt-1">
            Only classes assigned to you are shown here.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-250">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Day
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Section
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Room
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">
                  Type
                </th>
              </tr>
            </thead>

            <tbody>
              {sortedRoutines.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {r.day_of_week}
                  </td>

                  <td className="px-6 py-5 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-slate-800 font-bold">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      {r.subject_name}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-slate-600 font-medium">
                    {r.course_name} - {r.semester} - {r.section_name}
                  </td>

                  <td className="px-6 py-5 text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      {r.room}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="px-3 py-2 rounded-2xl bg-indigo-100 text-indigo-600 font-bold text-sm">
                      {r.class_type || 'Lecture'}
                    </span>
                  </td>
                </tr>
              ))}

              {sortedRoutines.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No classes assigned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </FacultyLayout>
  );
};

export default FacultyClasses;