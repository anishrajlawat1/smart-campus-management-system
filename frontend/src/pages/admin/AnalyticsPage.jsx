import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  BookOpen,
  Layers,
  Percent,
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

  const lowAttendanceStudents = summary?.lowAttendanceStudents || [];
  const lowAttendanceSubjects = summary?.lowAttendanceSubjects || [];
  const lowAttendanceGroups = summary?.lowAttendanceGroups || [];

  const riskLevel = useMemo(() => {
    const totalRisk = Number(summary?.attendance?.lowRiskTotal || 0);

    if (totalRisk >= 10) return 'High';
    if (totalRisk >= 5) return 'Medium';
    if (totalRisk > 0) return 'Low';
    return 'Safe';
  }, [summary]);

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
      label: 'Overall Attendance',
      value: `${summary?.attendance?.percentage || 0}%`,
      icon: Percent,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Low Attendance Risk',
      value: summary?.attendance?.lowRiskTotal || 0,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
    {
      label: 'Risk Level',
      value: riskLevel,
      icon: ShieldCheck,
      color:
        riskLevel === 'Safe'
          ? 'text-emerald-600'
          : riskLevel === 'Low'
          ? 'text-amber-600'
          : 'text-rose-600',
      bg:
        riskLevel === 'Safe'
          ? 'bg-emerald-100'
          : riskLevel === 'Low'
          ? 'bg-amber-100'
          : 'bg-rose-100',
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

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Analytics Dashboard"
      subtitle="Monitor campus-wide performance and identify students at academic risk."
    >
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

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Attendance Overview
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-6">
            Summary of present, absent, and late records.
          </p>

          <div className="space-y-5">
            {[
              {
                label: 'Present',
                value: present,
                percent: presentPercent,
                color: 'bg-emerald-500',
              },
              {
                label: 'Absent',
                value: absent,
                percent: absentPercent,
                color: 'bg-rose-500',
              },
              {
                label: 'Late',
                value: late,
                percent: latePercent,
                color: 'bg-amber-500',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm text-slate-500 font-bold">
                    {item.value} ({item.percent}%)
                  </span>
                </div>

                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-rose-50 rounded-3xl border border-rose-100 p-7 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={26} />
            </div>

            <div>
              <h2 className="text-xl font-black text-rose-700">
                Low Attendance Risk System
              </h2>

              <p className="text-sm text-rose-600 font-medium mt-2">
                This section identifies students, subjects, and sections that are below the 75% attendance threshold.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                <div className="bg-white rounded-2xl p-4 border border-rose-100">
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Risk Students
                  </p>
                  <h3 className="text-3xl font-black text-rose-600 mt-1">
                    {summary?.attendance?.lowRiskTotal || 0}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-rose-100">
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Risk Subjects
                  </p>
                  <h3 className="text-3xl font-black text-rose-600 mt-1">
                    {lowAttendanceSubjects.length}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-rose-100">
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Risk Sections
                  </p>
                  <h3 className="text-3xl font-black text-rose-600 mt-1">
                    {lowAttendanceGroups.length}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-1">
            Students Below 75%
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-6">
            Students requiring immediate attention.
          </p>

          <div className="space-y-3">
            {lowAttendanceStudents.length > 0 ? (
              lowAttendanceStudents.map((student) => (
                <div
                  key={`${student.id}-${student.course_name}-${student.section_name}`}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-100"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={19}
                      className="text-rose-600 mt-1 shrink-0"
                    />

                    <div className="min-w-0">
                      <h3 className="font-black text-slate-800 truncate">
                        {student.name}
                      </h3>

                      <p className="text-xs text-slate-500 font-semibold truncate">
                        {student.email}
                      </p>

                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {student.course_name} / {student.semester} /{' '}
                        {student.section_name}
                      </p>

                      <p className="text-sm text-rose-600 font-black mt-2">
                        {student.attendance_percentage || 0}% attendance
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <ShieldCheck size={30} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-600 mt-3">
                  No low attendance students.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-1">
            Subject-wise Risk
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-6">
            Subjects with students below 75%.
          </p>

          <div className="space-y-3">
            {lowAttendanceSubjects.length > 0 ? (
              lowAttendanceSubjects.map((subject) => (
                <div
                  key={`${subject.subject_id}-${subject.course_name}-${subject.section_name}`}
                  className="p-4 rounded-2xl bg-amber-50 border border-amber-100"
                >
                  <div className="flex items-start gap-3">
                    <BookOpen
                      size={19}
                      className="text-amber-600 mt-1 shrink-0"
                    />

                    <div>
                      <h3 className="font-black text-slate-800">
                        {subject.subject_name}
                      </h3>

                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {subject.course_name} / {subject.semester} /{' '}
                        {subject.section_name}
                      </p>

                      <p className="text-sm text-amber-700 font-black mt-2">
                        {subject.risk_students || 0} at risk • Avg{' '}
                        {subject.average_attendance || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <ShieldCheck size={30} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-600 mt-3">
                  No subject risk found.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-1">
            Section-wise Risk
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-6">
            Sections with low attendance trends.
          </p>

          <div className="space-y-3">
            {lowAttendanceGroups.length > 0 ? (
              lowAttendanceGroups.map((group) => (
                <div
                  key={group.group_id}
                  className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100"
                >
                  <div className="flex items-start gap-3">
                    <Layers
                      size={19}
                      className="text-indigo-600 mt-1 shrink-0"
                    />

                    <div>
                      <h3 className="font-black text-slate-800">
                        {group.course_name}
                      </h3>

                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        {group.semester} / {group.section_name}
                      </p>

                      <p className="text-sm text-indigo-700 font-black mt-2">
                        {group.risk_students || 0} at risk • Avg{' '}
                        {group.average_attendance || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <ShieldCheck size={30} className="mx-auto text-emerald-500" />
                <p className="font-bold text-slate-600 mt-3">
                  No section risk found.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
                <span className={`w-4 h-4 rounded-full ${item.color}`} />
              </div>

              <h3 className="text-3xl font-black text-slate-800">
                {item.value}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
};

export default AnalyticsPage;