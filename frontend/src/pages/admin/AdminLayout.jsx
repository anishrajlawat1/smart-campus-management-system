import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  MessageSquare,
  Calendar,
  Search,
  BarChart3,
  Bell,
  LogOut,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';

const adminModules = [
  {
    title: 'User Management',
    icon: Users,
    path: '/admin/users',
  },
  {
    title: 'Student Attendance',
    icon: CheckSquare,
    path: '/admin/attendance',
  },
  {
    title: 'Faculty Attendance',
    icon: UserCheck,
    path: '/admin/faculty-attendance',
  },
  {
    title: 'Smart Notices',
    icon: MessageSquare,
    path: '/admin/notices',
  },
  {
    title: 'Event Scheduler',
    icon: Calendar,
    path: '/admin/events',
  },
  {
    title: 'Lost & Found',
    icon: Search,
    path: '/admin/lost-found',
  },
  {
    title: 'Data Analytics',
    icon: BarChart3,
    path: '/admin/analytics',
  },
];

const AdminLayout = ({
  pageLabel = 'Admin Module',
  title = 'Admin Page',
  subtitle = 'Manage the system from one place.',
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-indigo-600 tracking-tighter italic">
            SmartCampus
          </h2>
          <p className="text-xs text-slate-400 font-bold tracking-[0.2em] uppercase mt-2">
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
            Main
          </p>

          <div className="space-y-2">
            {adminModules.map((m) => {
              const isActive = location.pathname === m.path;

              return (
                <div
                  key={m.title}
                  onClick={() => navigate(m.path)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <m.icon size={20} />
                    <span className="font-semibold">{m.title}</span>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className={`transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 mb-3">
            <p className="text-sm font-bold text-slate-800">Administrator</p>
            <p className="text-xs text-slate-500 mt-1">System control and monitoring</p>
          </div>

          <div
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3.5 text-rose-500 hover:bg-rose-50 rounded-2xl cursor-pointer font-bold transition-all"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-start mb-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
              {pageLabel}
            </p>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">
              {title}
            </h1>
            <p className="text-slate-500 font-medium mt-2">{subtitle}</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
            </button>

            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">
                AD
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Admin User</p>
                <p className="text-xs text-slate-500">Super Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
};

export default AdminLayout;