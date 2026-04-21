import React from 'react';
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
  ShieldCheck,
  ArrowUpRight,
  Clock3,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Total Students',
      value: '1,284',
      subtext: '+24 this month',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Faculty Members',
      value: '86',
      subtext: '12 departments',
      icon: GraduationCap,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Attendance Today',
      value: '94%',
      subtext: 'Updated 10 mins ago',
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Active Notices',
      value: '18',
      subtext: '4 posted today',
      icon: Bell,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
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
      title: 'Attendance Tracker',
      icon: CheckSquare,
      desc: 'Track attendance records and class presence.',
      path: '/admin/attendance',
    },
    {
      title: 'Smart Notices',
      icon: MessageSquare,
      desc: 'Publish campus-wide, departmental, or class notices.',
      path: '/admin/notices',
    },
    {
      title: 'Event Scheduler',
      icon: Calendar,
      desc: 'Organize events and book institutional resources.',
      path: '/admin/events',
    },
    {
      title: 'Lost & Found',
      icon: Search,
      desc: 'Monitor reported items and claim requests.',
      path: '/admin/lost-found',
    },
    {
      title: 'Data Analytics',
      icon: BarChart3,
      desc: 'View campus performance and activity insights.',
      path: '/admin/analytics',
    },
  ];

  const recentNotices = [
    {
      title: 'Semester Examination Schedule Published',
      audience: 'Campus-wide',
      time: '20 min ago',
    },
    {
      title: 'BSc CS Presentation Submission Reminder',
      audience: 'Computer Science Department',
      time: '1 hour ago',
    },
    {
      title: 'Library Maintenance Notice',
      audience: 'All Students',
      time: 'Today',
    },
  ];

  const todaysEvents = [
    {
      title: 'Faculty Coordination Meeting',
      place: 'Seminar Hall A',
      time: '10:00 AM',
    },
    {
      title: 'Project Defense Orientation',
      place: 'Lab 3',
      time: '12:30 PM',
    },
    {
      title: 'Innovation Club Workshop',
      place: 'Auditorium',
      time: '3:00 PM',
    },
  ];

  const quickActions = [
    { label: 'Add New Student', icon: Users, path: '/admin/users' },
    { label: 'Create Notice', icon: MessageSquare, path: '/admin/notices' },
    { label: 'Schedule Event', icon: Calendar, path: '/admin/events' },
    { label: 'View Reports', icon: ClipboardList, path: '/admin/analytics' },
  ];

  const activities = [
    { text: 'Attendance marked for BSc CS - Semester 5', time: '15 mins ago' },
    { text: 'New faculty account created for Science Department', time: '40 mins ago' },
    { text: 'Lost item claim submitted for verification', time: '1 hour ago' },
    { text: 'New campus-wide notice published', time: '2 hours ago' },
  ];

  return (
    <AdminLayout
      pageLabel="Dashboard"
      title="System Overview"
      subtitle="Welcome back, Administrator. Here’s what’s happening across campus today."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
          >
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-5`}>
              <s.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{s.value}</h3>
            <p className="text-xs text-slate-400 font-semibold mt-2">{s.subtext}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-800">Recent Notices</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Latest announcements published across the campus
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/notices')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentNotices.map((notice, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{notice.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{notice.audience}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                  {notice.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">Quick Actions</h2>
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
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">Today’s Schedule</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Upcoming campus events and sessions
            </p>
          </div>

          <div className="space-y-4">
            {todaysEvents.map((event, i) => (
              <div key={i} className="flex gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                  <Clock3 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{event.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{event.place}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">{event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">Recent Activity</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Latest actions performed in the system
            </p>
          </div>

          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">{activity.text}</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-800">Admin Summary</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Snapshot of overall campus operations
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Pending user approvals', value: '07', icon: ShieldCheck },
              { label: 'Lost item claim requests', value: '04', icon: Search },
              { label: 'New event requests', value: '06', icon: Calendar },
              { label: 'Reports generated', value: '13', icon: BookOpen },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-500">
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{item.label}</span>
                </div>
                <span className="text-lg font-black text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6 px-1">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Management Modules</h2>
            <p className="text-slate-500 font-medium mt-1">
              Access and manage every major campus operation from one place
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              onClick={() => navigate(module.path)}
              className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner">
                  <module.icon size={28} />
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
      </section>
    </AdminLayout>
  );
};

export default AdminDashboard;