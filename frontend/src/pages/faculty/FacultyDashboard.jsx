import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckSquare,
  Bell,
  Calendar,
  Users,
  ClipboardList,
} from 'lucide-react';

const FacultyDashboard = () => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  const modules = [
    {
      title: 'Mark Attendance',
      desc: 'Take student attendance for your classes',
      icon: CheckSquare,
      path: '/faculty/attendance',
    },
    {
      title: 'My Classes',
      desc: 'View assigned groups and subjects',
      icon: BookOpen,
      path: '/faculty/classes',
    },
    {
      title: 'Create Notice',
      desc: 'Send notices to students',
      icon: Bell,
      path: '/faculty/notices',
    },
    {
      title: 'View Events',
      desc: 'Check scheduled campus events',
      icon: Calendar,
      path: '/faculty/events',
    },
    {
      title: 'Student List',
      desc: 'View students in your classes',
      icon: Users,
      path: '/faculty/students',
    },
    {
      title: 'Reports',
      desc: 'View attendance summaries',
      icon: ClipboardList,
      path: '/faculty/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-2xl font-black text-indigo-600 italic">
            SmartCampus
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-widest">
            Faculty Panel
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {modules.map((m) => (
            <div
              key={m.title}
              onClick={() => navigate(m.path)}
              className="flex items-center space-x-3 p-3.5 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl cursor-pointer transition-all font-semibold"
            >
              <m.icon size={20} />
              <span>{m.title}</span>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            className="w-full py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 overflow-y-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Faculty Dashboard
            </h1>
            <p className="text-slate-500 font-medium">
              Welcome back, {user?.name || 'Faculty'}
            </p>
          </div>

          <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">
            {user?.name?.charAt(0) || 'F'}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <p className="text-sm text-slate-500 font-bold">Today's Classes</p>
            <h3 className="text-3xl font-black text-slate-800 mt-2">3</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <p className="text-sm text-slate-500 font-bold">Pending Attendance</p>
            <h3 className="text-3xl font-black text-slate-800 mt-2">2</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <p className="text-sm text-slate-500 font-bold">Notices Sent</p>
            <h3 className="text-3xl font-black text-slate-800 mt-2">5</h3>
          </div>
        </div>

        {/* Modules */}
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              onClick={() => navigate(module.path)}
              className="bg-white p-8 rounded-3xl border hover:border-indigo-200 hover:shadow-xl transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center mb-6">
                <module.icon size={28} />
              </div>

              <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">
                {module.title}
              </h3>

              <p className="text-slate-500 text-sm mt-2">
                {module.desc}
              </p>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default FacultyDashboard;