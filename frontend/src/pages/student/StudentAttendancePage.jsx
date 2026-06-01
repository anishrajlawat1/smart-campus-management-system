import React, { useEffect, useMemo, useState } from 'react';
import {
  Percent,
  ClipboardList,
  Calendar,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock3,
  ShieldCheck,
} from 'lucide-react';
import StudentLayout from './StudentLayout';
import api from '../../api';

const StudentAttendancePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const [attendance, setAttendance] = useState(null);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    try {
      const summaryRes = await api.get(
        `/student-attendance/student-dashboard/${user?.id}`
      );

      const subjectRes = await api.get(
        `/student-attendance/student/${user?.id}/subjects`
      );

      setAttendance(summaryRes.data?.attendance || {});
      setSubjectAttendance(Array.isArray(subjectRes.data) ? subjectRes.data : []);
    } catch (error) {
      console.error('Student attendance fetch error:', error);
      setAttendance(null);
      setSubjectAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAttendance();
    }
  }, [user?.id]);

  const percentage = Number(attendance?.attendance_percentage || 0);

  const riskSubjects = useMemo(() => {
    return subjectAttendance.filter(
      (item) => Number(item.attendance_percentage || 0) < 75
    );
  }, [subjectAttendance]);

  const safeSubjects = useMemo(() => {
    return subjectAttendance.filter(
      (item) => Number(item.attendance_percentage || 0) >= 75
    );
  }, [subjectAttendance]);

  const getPercentageColor = (value) => {
    if (value >= 75) return 'text-emerald-600 bg-emerald-100';
    if (value >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };

  const getBarColor = (value) => {
    if (value >= 75) return 'bg-emerald-500';
    if (value >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const cards = [
    {
      label: 'Overall Attendance',
      value: `${percentage}%`,
      icon: Percent,
      bg: percentage >= 75 ? 'bg-emerald-100' : 'bg-rose-100',
      color: percentage >= 75 ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      label: 'Total Classes',
      value: attendance?.total_classes || 0,
      icon: ClipboardList,
      bg: 'bg-indigo-100',
      color: 'text-indigo-600',
    },
    {
      label: 'Present + Late',
      value:
        Number(attendance?.present_count || 0) +
        Number(attendance?.late_count || 0),
      icon: CheckCircle2,
      bg: 'bg-emerald-100',
      color: 'text-emerald-600',
    },
    {
      label: 'Absent',
      value: attendance?.absent_count || 0,
      icon: XCircle,
      bg: 'bg-rose-100',
      color: 'text-rose-600',
    },
  ];

  if (loading) {
    return (
      <StudentLayout
        pageLabel="Student Module"
        title="My Attendance"
        subtitle="Loading attendance details..."
      >
        <div className="bg-white rounded-3xl p-8 text-slate-500 font-bold">
          Loading attendance...
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="My Attendance"
      subtitle="Overall and subject-wise attendance risk analysis."
    >
      {percentage > 0 && percentage < 75 && (
        <section className="mb-8 bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h2 className="font-black text-rose-700">
              Low Attendance Warning
            </h2>

            <p className="text-sm text-rose-600 font-medium mt-1">
              Your overall attendance is {percentage}%. Please improve your attendance to stay above the required 75% threshold.
            </p>
          </div>
        </section>
      )}

      {percentage >= 75 && (
        <section className="mb-8 bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-black text-emerald-700">
              Attendance Status Safe
            </h2>

            <p className="text-sm text-emerald-600 font-medium mt-1">
              Your overall attendance is currently above the required threshold.
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm"
            >
              <div
                className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}
              >
                <Icon size={24} />
              </div>

              <p className="text-slate-500 text-sm font-bold">
                {card.label}
              </p>

              <h2 className="text-3xl font-black text-slate-800 mt-1">
                {card.value}
              </h2>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800">
              Subject-wise Attendance
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Subjects below 75% are marked as at risk.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-220">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Subject
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Total
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Present
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Late
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Absent
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Percentage
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {subjectAttendance.length > 0 ? (
                  subjectAttendance.map((row) => {
                    const subjectPercentage = Number(
                      row.attendance_percentage || 0
                    );

                    return (
                      <tr
                        key={row.subject_id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            {row.subject_name}
                          </div>
                        </td>

                        <td className="p-4 text-slate-600 font-medium">
                          {row.total_classes}
                        </td>

                        <td className="p-4 text-emerald-600 font-bold">
                          {row.present_count}
                        </td>

                        <td className="p-4 text-amber-600 font-bold">
                          {row.late_count}
                        </td>

                        <td className="p-4 text-rose-600 font-bold">
                          {row.absent_count}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-2 rounded-2xl font-black ${getPercentageColor(
                                subjectPercentage
                              )}`}
                            >
                              {subjectPercentage}%
                            </span>

                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getBarColor(
                                  subjectPercentage
                                )}`}
                                style={{
                                  width: `${Math.min(subjectPercentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          {subjectPercentage < 75 ? (
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-black uppercase">
                              At Risk
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black uppercase">
                              Safe
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-slate-500 font-medium"
                    >
                      No subject attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-800 mb-1">
            Risk Summary
          </h2>

          <p className="text-sm text-slate-500 font-medium mb-5">
            Quick attendance decision support.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-rose-600" size={20} />
                <div>
                  <p className="text-sm text-rose-600 font-bold">
                    At-risk subjects
                  </p>
                  <h3 className="text-2xl font-black text-rose-700">
                    {riskSubjects.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-emerald-600" size={20} />
                <div>
                  <p className="text-sm text-emerald-600 font-bold">
                    Safe subjects
                  </p>
                  <h3 className="text-2xl font-black text-emerald-700">
                    {safeSubjects.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <Clock3 className="text-slate-500" size={20} />
                <div>
                  <p className="text-sm text-slate-500 font-bold">
                    Late count
                  </p>
                  <h3 className="text-2xl font-black text-slate-800">
                    {attendance?.late_count || 0}
                  </h3>
                </div>
              </div>
            </div>

            {riskSubjects.length > 0 && (
              <div className="pt-2">
                <h3 className="font-black text-slate-800 mb-3">
                  Improve these subjects
                </h3>

                <div className="space-y-2">
                  {riskSubjects.map((subject) => (
                    <div
                      key={subject.subject_id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <p className="font-bold text-slate-800">
                        {subject.subject_name}
                      </p>

                      <p className="text-sm text-rose-600 font-black mt-1">
                        {subject.attendance_percentage || 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </StudentLayout>
  );
};

export default StudentAttendancePage;