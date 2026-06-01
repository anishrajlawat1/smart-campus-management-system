import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserPlus,
  UserCheck,
  Link2,
  Calendar,
  MessageSquare,
  Search,
  BarChart3,
  LogOut,
  FileText,
} from 'lucide-react';

const AdminLayout = ({
  pageLabel = 'Admin Module',
  title = 'Dashboard',
  subtitle = 'Manage the system efficiently.',
  children,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const adminModules = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin-dashboard' },
    { title: 'User Management', icon: Users, path: '/admin/users' },
    { title: 'Student Attendance', icon: CheckSquare, path: '/admin/attendance' },
    {
      title: 'Attendance Reports',
      icon: FileText,
      path: '/admin/attendance-reports',
    },
    {
      title: 'Student Assignment',
      icon: UserPlus,
      path: '/admin/student-assignment',
    },
    {
      title: 'Faculty Attendance',
      path: '/admin/faculty-attendance',
      icon: UserCheck,
    },
    {
      title: 'Faculty Subjects',
      path: '/admin/faculty-subjects',
      icon: Link2,
    },
    { title: 'Class Routine', path: '/admin/routines', icon: Calendar },
    { title: 'Exam Seating', path: '/admin/exams', icon: FileText },
    { title: 'Smart Notices', icon: MessageSquare, path: '/admin/notices' },
    { title: 'Event Scheduler', icon: Calendar, path: '/admin/events' },
    { title: 'Lost & Found', icon: Search, path: '/admin/lost-found' },
    { title: 'Data Analytics', icon: BarChart3, path: '/admin/analytics' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col">
        <h2 className="text-2xl font-black text-indigo-600 mb-8">
          SmartCampus
        </h2>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-1">
          {adminModules.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.title}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={18} />
                <span className="truncate">{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">
            {pageLabel}
          </p>

          <h1 className="text-4xl font-black text-slate-800 mt-2">
            {title}
          </h1>

          {subtitle && (
            <p className="text-slate-500 font-medium mt-2">{subtitle}</p>
          )}
        </div>

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;