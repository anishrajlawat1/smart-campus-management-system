import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock3,
  Trash2,
  CalendarDays,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const FacultyAttendanceManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchFaculty = async () => {
    try {
      const res = await api.get('/faculty-attendance/faculty-users');
      setFaculty(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch faculty');
    }
  };

  const fetchRecords = async () => {
    try {
      const res = await api.get('/faculty-attendance', {
        params: { date: selectedDate },
      });
      setRecords(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedDate]);

  const markAttendance = async (facultyId, status) => {
    try {
      await api.post('/faculty-attendance', {
        faculty_id: facultyId,
        date: selectedDate,
        status,
      });

      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attendance');
    }
  };

  const deleteAttendance = async (id) => {
    const confirmDelete = window.confirm('Delete this attendance record?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/faculty-attendance/${id}`);
      fetchRecords();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete attendance');
    }
  };

  const getFacultyStatus = (facultyId) => {
    return records.find((r) => String(r.faculty_id) === String(facultyId));
  };

  const totalFaculty = faculty.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const leaveCount = records.filter((r) => r.status === 'leave').length;

  const summaryCards = [
    {
      label: 'Total Faculty',
      value: totalFaculty,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Present',
      value: presentCount,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Absent',
      value: absentCount,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
    {
      label: 'On Leave',
      value: leaveCount,
      icon: Clock3,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Faculty Attendance"
      subtitle="Track and manage daily attendance records for faculty members."
    >
      {/* Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
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
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      {/* Date selector */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="max-w-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Select Date
          </label>
          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="date"
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Mark faculty attendance */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">Mark Faculty Attendance</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Mark present, absent, or leave for each faculty member on the selected date.
          </p>
        </div>

        <div className="space-y-4">
          {faculty.map((f) => {
            const currentRecord = getFacultyStatus(f.id);

            return (
              <div
                key={f.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div>
                  <p className="font-bold text-slate-800">{f.name}</p>
                  <p className="text-sm text-slate-500 font-medium">{f.email}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Current Status:{' '}
                    <span className="font-bold text-slate-600">
                      {currentRecord ? currentRecord.status : 'Not marked'}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => markAttendance(f.id, 'present')}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600"
                  >
                    Present
                  </button>

                  <button
                    onClick={() => markAttendance(f.id, 'absent')}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600"
                  >
                    Absent
                  </button>

                  <button
                    onClick={() => markAttendance(f.id, 'leave')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                  >
                    Leave
                  </button>
                </div>
              </div>
            );
          })}

          {faculty.length === 0 && (
            <div className="text-center text-slate-500 font-medium py-6">
              No faculty users found.
            </div>
          )}
        </div>
      </section>

      {/* Records table */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Faculty Attendance Records</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Attendance records for {new Date(selectedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Faculty
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {records.map((record, index) => (
                <tr
                  key={record.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {record.faculty_name}
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {record.faculty_email}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold capitalize ${
                        record.status === 'present'
                          ? 'bg-emerald-100 text-emerald-600'
                          : record.status === 'absent'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => deleteAttendance(record.id)}
                      className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {records.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No faculty attendance records found for this date.
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

export default FacultyAttendanceManagement;