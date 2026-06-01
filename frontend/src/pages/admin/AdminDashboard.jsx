import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  CheckSquare,
  MessageSquare,
  Calendar,
  Search,
  BarChart3,
  Bell,
  ArrowUpRight,
  ClipboardList,
  UserCheck,
  Link2,
  RefreshCw,
  AlertTriangle,
  PackageOpen,
  Clock3,
  ShieldCheck,
  CalendarDays,
  Megaphone,
  Activity,
  DoorOpen,
  FileText,
  Armchair,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import AdminExportReports from './AdminExportReports';
import api from '../../api';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const getFallbackImage = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Admin'
    )}&background=4f46e5&color=ffffff&size=256`;
  };

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      const res = await api.get('/analytics');
      setSummary(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      alert(error.response?.data?.message || 'Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return 'Not scheduled';

    try {
      return new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  const formatExamDateTime = (date, start, end) => {
    if (!date) return 'Not scheduled';

    return `${date} • ${String(start || '').slice(0, 5)} - ${String(
      end || ''
    ).slice(0, 5)}`;
  };

  const stats = [
    {
      label: 'Total Students',
      value: summary?.users?.students ?? 0,
      subtext: 'Registered students',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      path: '/admin/users',
    },
    {
      label: 'Faculty Members',
      value: summary?.users?.faculty ?? 0,
      subtext: 'Teaching staff',
      icon: GraduationCap,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      path: '/admin/users',
    },
    {
      label: 'Attendance Rate',
      value: `${summary?.attendance?.percentage ?? 0}%`,
      subtext: `${summary?.attendance?.present ?? 0} present records`,
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      path: '/admin/attendance',
    },
    {
      label: 'Open Lost Items',
      value: summary?.lostFound?.open ?? 0,
      subtext: 'Need follow-up',
      icon: PackageOpen,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
      path: '/admin/lost-found',
    },
  ];

  const secondaryStats = [
    {
      label: 'Total Notices',
      value: summary?.notices?.total ?? 0,
      icon: Megaphone,
      path: '/admin/notices',
    },
    {
      label: 'Upcoming Events',
      value: summary?.events?.upcoming ?? 0,
      icon: CalendarDays,
      path: '/admin/events',
    },
    {
      label: "Today's Events",
      value: summary?.events?.today ?? 0,
      icon: Clock3,
      path: '/admin/events',
    },
    {
      label: 'Admin Alerts',
      value: summary?.notifications?.unread ?? 0,
      icon: Bell,
      path: '/admin/analytics',
    },
  ];

  const examStats = [
    {
      label: "Today's Exams",
      value: summary?.exams?.today ?? 0,
      icon: FileText,
      bg: 'bg-indigo-100',
      color: 'text-indigo-600',
      path: '/admin/exams',
    },
    {
      label: 'Upcoming Exams',
      value: summary?.exams?.upcoming ?? 0,
      icon: CalendarDays,
      bg: 'bg-violet-100',
      color: 'text-violet-600',
      path: '/admin/exams',
    },
    {
      label: 'Rooms Assigned',
      value: summary?.exams?.assignedRooms ?? 0,
      icon: DoorOpen,
      bg: 'bg-emerald-100',
      color: 'text-emerald-600',
      path: '/admin/exams',
    },
    {
      label: 'Invigilators',
      value: summary?.exams?.assignedInvigilators ?? 0,
      icon: ShieldCheck,
      bg: 'bg-orange-100',
      color: 'text-orange-600',
      path: '/admin/exams',
    },
  ];

  const modules = [
    {
      title: 'User Management',
      icon: Users,
      desc: 'Manage student, faculty, and admin accounts.',
      path: '/admin/users',
    },
    {
      title: 'Student Attendance',
      icon: CheckSquare,
      desc: 'Track student attendance records and class presence.',
      path: '/admin/attendance',
    },
    {
      title: 'Student Assignment',
      icon: UserCheck,
      desc: 'Assign students to courses, levels, and groups.',
      path: '/admin/student-assignment',
    },
    {
      title: 'Faculty Attendance',
      icon: UserCheck,
      desc: 'Monitor staff attendance and leave records.',
      path: '/admin/faculty-attendance',
    },
    {
      title: 'Faculty Subjects',
      icon: Link2,
      desc: 'Assign faculty members to subjects and groups.',
      path: '/admin/faculty-subjects',
    },
    {
      title: 'Class Routine',
      icon: Calendar,
      desc: 'Create and manage class schedules.',
      path: '/admin/routines',
    },
    {
      title: 'Exam Seating',
      icon: FileText,
      desc: 'Create exams, assign rooms, invigilators, and seating.',
      path: '/admin/exams',
    },
    {
      title: 'Smart Notices',
      icon: MessageSquare,
      desc: 'Publish campus-wide or targeted notices.',
      path: '/admin/notices',
    },
    {
      title: 'Event Scheduler',
      icon: Calendar,
      desc: 'Organize campus events and venue bookings.',
      path: '/admin/events',
    },
    {
      title: 'Lost & Found',
      icon: Search,
      desc: 'Monitor reported items and returned status.',
      path: '/admin/lost-found',
    },
    {
      title: 'Data Analytics',
      icon: BarChart3,
      desc: 'View campus performance and activity insights.',
      path: '/admin/analytics',
    },
  ];

  const quickActions = [
    { label: 'Add New User', icon: Users, path: '/admin/users' },
    { label: 'Create Notice', icon: MessageSquare, path: '/admin/notices' },
    { label: 'Schedule Event', icon: Calendar, path: '/admin/events' },
    { label: 'Create Exam', icon: FileText, path: '/admin/exams' },
    { label: 'View Reports', icon: ClipboardList, path: '/admin/analytics' },
  ];

  return (
    <AdminLayout
      pageLabel="Dashboard"
      title="System Overview"
      subtitle={`Welcome back, ${
        user?.name || 'Administrator'
      }. Here’s what’s happening across campus today.`}
    >
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.profile_image || getFallbackImage(user?.name)}
              alt={user?.name || 'Admin'}
              className="w-16 h-16 rounded-3xl object-cover border border-slate-200 bg-slate-100"
              onError={(e) => {
                e.currentTarget.src = getFallbackImage(user?.name);
              }}
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800">
                  {user?.name || 'Administrator'}
                </h2>

                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                  Admin
                </span>
              </div>

              <p className="text-slate-500 font-medium mt-1">
                {user?.email || 'Admin account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={18} />
            {loading ? 'Refreshing...' : 'Refresh Dashboard'}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => navigate(s.path)}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
          >
            <div
              className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <s.icon size={24} />
            </div>

            <p className="text-slate-500 text-sm font-bold">{s.label}</p>

            <div className="flex items-end justify-between gap-3 mt-1">
              <h3 className="text-3xl font-black text-slate-800">
                {s.value}
              </h3>

              <ArrowUpRight
                size={18}
                className="text-slate-300 group-hover:text-indigo-600 transition"
              />
            </div>

            <p className="text-xs text-slate-400 font-semibold mt-2">
              {s.subtext}
            </p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {secondaryStats.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            className="bg-white rounded-3xl border border-slate-100 p-5 flex items-center justify-between hover:border-indigo-100 hover:shadow-md transition text-left"
          >
            <div>
              <p className="text-sm text-slate-500 font-bold">
                {item.label}
              </p>

              <h3 className="text-2xl font-black text-slate-800 mt-1">
                {item.value}
              </h3>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
              <item.icon size={21} />
            </div>
          </button>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm mb-10">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  Smart Exam Overview
                </h2>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Today’s exams, upcoming exams, room allocation, and invigilator assignments.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/exams')}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            Manage Exams
            <ArrowUpRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {examStats.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="p-5 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition text-left"
            >
              <div
                className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4`}
              >
                <item.icon size={22} />
              </div>

              <p className="text-sm font-bold text-slate-500">
                {item.label}
              </p>

              <h3 className="text-3xl font-black text-slate-800 mt-1">
                {item.value}
              </h3>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Today's Exam Schedule
                </h3>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Exams scheduled for today
                </p>
              </div>

              <CalendarDays size={22} className="text-indigo-600" />
            </div>

            <div className="space-y-3">
              {(summary?.exams?.todayList || []).length > 0 ? (
                summary.exams.todayList.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-800">
                          {exam.exam_name}
                        </h4>

                        <p className="text-sm text-indigo-600 font-black mt-1">
                          {exam.subject_name || 'Subject not set'}
                        </p>

                        <p className="text-sm text-slate-500 font-medium mt-1">
                          {exam.course_name} / {exam.level_name}
                        </p>
                      </div>

                      <p className="text-sm font-bold text-slate-500">
                        {String(exam.start_time || '').slice(0, 5)} -{' '}
                        {String(exam.end_time || '').slice(0, 5)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black">
                        {exam.room_count || 0} Rooms
                      </span>

                      <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-black">
                        {exam.invigilator_count || 0} Invigilators
                      </span>

                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                        {exam.student_count || 0} Students
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-100">
                  <CalendarDays size={30} className="mx-auto text-slate-300" />

                  <p className="font-bold text-slate-600 mt-3">
                    No exams scheduled today.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Upcoming Exam Rooms
                </h3>

                <p className="text-sm text-slate-500 font-medium mt-1">
                  Room and invigilator assignments
                </p>
              </div>

              <DoorOpen size={22} className="text-emerald-600" />
            </div>

            <div className="space-y-3">
              {(summary?.exams?.roomList || []).length > 0 ? (
                summary.exams.roomList.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl bg-white border border-slate-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-800">
                          {room.room_name}
                        </h4>

                        <p className="text-sm text-indigo-600 font-black mt-1">
                          {room.exam_name}
                        </p>

                        <p className="text-sm text-slate-500 font-medium mt-1">
                          {room.subject_name || 'Subject not set'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-500">
                          {formatExamDateTime(
                            room.exam_date,
                            room.start_time,
                            room.end_time
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                      <div className="px-3 py-2 rounded-2xl bg-slate-50 text-slate-600 text-xs font-black flex items-center gap-2">
                        <Armchair size={15} />
                        Capacity {room.capacity || 0}
                      </div>

                      <div className="px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-600 text-xs font-black flex items-center gap-2">
                        <Users size={15} />
                        {room.assigned_students || 0} Students
                      </div>

                      <div className="px-3 py-2 rounded-2xl bg-orange-50 text-orange-600 text-xs font-black flex items-center gap-2">
                        <ShieldCheck size={15} />
                        {room.invigilator_name || 'No invigilator'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white border border-slate-100">
                  <DoorOpen size={30} className="mx-auto text-slate-300" />

                  <p className="font-bold text-slate-600 mt-3">
                    No exam rooms assigned.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <AdminExportReports />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Quick Actions
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Frequently used administrative actions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-indigo-600">
                  <action.icon size={20} />
                </div>

                <span className="font-bold text-slate-700 group-hover:text-indigo-600">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Upcoming Events
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Next scheduled campus activities
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="text-sm font-black text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {(summary?.events?.upcomingList || []).length > 0 ? (
              summary.events.upcomingList.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-800">
                        {event.title}
                      </h3>

                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                        {event.event_type || 'Event'}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {event.venue} •{' '}
                      {event.organizer_name || 'Coordinator not set'}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-slate-500">
                    {formatDateTime(event.start_datetime)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <Calendar size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No upcoming events.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Low Attendance Alerts
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Students below 75%
            </p>
          </div>

          <div className="space-y-3">
            {(summary?.lowAttendanceStudents || []).length > 0 ? (
              summary.lowAttendanceStudents.map((student) => (
                <div
                  key={student.id}
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
                  No low attendance alerts.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Recent Notices
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Latest announcements
            </p>
          </div>

          <div className="space-y-3">
            {(summary?.notices?.recent || []).length > 0 ? (
              summary.notices.recent.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <h3 className="font-black text-slate-800 line-clamp-1">
                    {notice.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">
                    {notice.message}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                      {notice.audience_type || 'all'}
                    </span>

                    <span className="text-xs text-slate-400 font-semibold">
                      {notice.created_by_name || 'Admin'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <Megaphone size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No notices yet.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Recent Lost & Found
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              New item reports
            </p>
          </div>

          <div className="space-y-3">
            {(summary?.lostFound?.recent || []).length > 0 ? (
              summary.lostFound.recent.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-800">
                      {item.title}
                    </h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        item.item_type === 'lost'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {item.item_type}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 font-medium mt-2">
                    {item.location} •{' '}
                    {item.status === 'resolved' ? 'returned' : 'open'}
                  </p>

                  <p className="text-xs text-slate-400 font-semibold mt-2">
                    Reported by {item.reported_by_name || 'Unknown'}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <PackageOpen size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No recent reports.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6 px-1">
            <div>
              <h2 className="text-2xl font-black text-slate-800">
                Management Modules
              </h2>

              <p className="text-slate-500 font-medium mt-1">
                Access and manage every major campus operation from one place
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <div
                key={module.title}
                onClick={() => navigate(module.path)}
                className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner">
                    <module.icon size={26} />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-slate-300 group-hover:text-indigo-600 transition-colors"
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {module.title}
                </h3>

                <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
                  {module.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm h-fit">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">
              Recent Admin Activity
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Based on admin notifications
            </p>
          </div>

          <div className="space-y-3">
            {(summary?.notifications?.recentActivity || []).length > 0 ? (
              summary.notifications.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Activity size={17} />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-800">
                        {activity.title}
                      </h3>

                      <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">
                        {activity.message}
                      </p>

                      <p className="text-xs text-slate-400 font-semibold mt-2">
                        {formatDateTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <Activity size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No recent activity.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;