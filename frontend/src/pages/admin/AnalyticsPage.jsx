import React, { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  CheckSquare,
  XCircle,
  Clock3,
  Bell,
  CalendarDays,
  Package,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setSummary(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <AdminLayout
        pageLabel="Admin Module"
        title="Analytics Dashboard"
        subtitle="Monitor campus-wide data and system performance."
      >
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-500 font-medium shadow-sm">
          Loading analytics...
        </div>
      </AdminLayout>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: summary?.users?.total || 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Students',
      value: summary?.users?.students || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Faculty',
      value: summary?.users?.faculty || 0,
      icon: Users,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Admins',
      value: summary?.users?.admins || 0,
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Attendance Records',
      value: summary?.attendance?.total || 0,
      icon: CheckSquare,
      color: 'text-sky-600',
      bg: 'bg-sky-100',
    },
    {
      label: 'Present',
      value: summary?.attendance?.present || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Absent',
      value: summary?.attendance?.absent || 0,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
    {
      label: 'Late',
      value: summary?.attendance?.late || 0,
      icon: Clock3,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Notices',
      value: summary?.notices?.total || 0,
      icon: Bell,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Events',
      value: summary?.events?.total || 0,
      icon: CalendarDays,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Lost & Found Items',
      value: summary?.lostFound?.total || 0,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Resolved Items',
      value: summary?.lostFound?.resolved || 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  const attendanceTotal = summary?.attendance?.total || 0;
  const present = summary?.attendance?.present || 0;
  const absent = summary?.attendance?.absent || 0;
  const late = summary?.attendance?.late || 0;

  const presentPercent =
    attendanceTotal > 0 ? Math.round((present / attendanceTotal) * 100) : 0;
  const absentPercent =
    attendanceTotal > 0 ? Math.round((absent / attendanceTotal) * 100) : 0;
  const latePercent =
    attendanceTotal > 0 ? Math.round((late / attendanceTotal) * 100) : 0;

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Analytics Dashboard"
      subtitle="Monitor campus-wide data and system performance."
    >
      {/* Summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {cards.map((card) => (
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

      {/* Attendance overview */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Attendance Overview
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Summary of present, absent, and late records.
          </p>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700">Present</span>
                <span className="text-sm text-slate-500 font-bold">
                  {present} ({presentPercent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${presentPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700">Absent</span>
                <span className="text-sm text-slate-500 font-bold">
                  {absent} ({absentPercent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{ width: `${absentPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-700">Late</span>
                <span className="text-sm text-slate-500 font-bold">
                  {late} ({latePercent}%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${latePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            System Activity Snapshot
          </h2>
          <p className="text-sm text-slate-500 font-medium mb-6">
            Quick overview of module usage across the campus platform.
          </p>

          <div className="space-y-4">
            {[
              {
                label: 'Total notices published',
                value: summary?.notices?.total || 0,
              },
              {
                label: 'Total events scheduled',
                value: summary?.events?.total || 0,
              },
              {
                label: 'Total lost & found records',
                value: summary?.lostFound?.total || 0,
              },
              {
                label: 'Resolved lost & found records',
                value: summary?.lostFound?.resolved || 0,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <span className="text-slate-700 font-bold">{item.label}</span>
                <span className="text-xl font-black text-slate-800">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role distribution */}
      <section className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-2">
          User Distribution
        </h2>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Breakdown of registered users by system role.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              role: 'Students',
              value: summary?.users?.students || 0,
              color: 'bg-blue-500',
            },
            {
              role: 'Faculty',
              value: summary?.users?.faculty || 0,
              color: 'bg-violet-500',
            },
            {
              role: 'Admins',
              value: summary?.users?.admins || 0,
              color: 'bg-indigo-500',
            },
          ].map((item) => (
            <div
              key={item.role}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-700">{item.role}</span>
                <span
                  className={`w-4 h-4 rounded-full ${item.color}`}
                />
              </div>
              <h3 className="text-3xl font-black text-slate-800">{item.value}</h3>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AnalyticsPage;