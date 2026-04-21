import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  MessageSquare,
  Calendar,
  Search,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Bell
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Attendance Management',
      icon: CheckSquare,
      desc: 'Track class attendance and monitor academic presence in real time.',
    },
    {
      title: 'Smart Notices',
      icon: MessageSquare,
      desc: 'Publish campus-wide, departmental, and class-based notices easily.',
    },
    {
      title: 'Event Scheduling',
      icon: Calendar,
      desc: 'Organize events, schedules, and institutional activities efficiently.',
    },
    {
      title: 'Lost & Found',
      icon: Search,
      desc: 'Manage item reports, claim requests, and verification workflows.',
    },
    {
      title: 'Analytics Dashboard',
      icon: BarChart3,
      desc: 'View performance metrics, attendance trends, and campus insights.',
    },
    {
      title: 'Role-Based Access',
      icon: ShieldCheck,
      desc: 'Secure access for administrators, faculty, and students.',
    },
  ];

  const stats = [
    { label: 'Students Managed', value: '1,284' },
    { label: 'Faculty Members', value: '86' },
    { label: 'Attendance Accuracy', value: '94%' },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900">
      <nav className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-indigo-600 tracking-tight italic">
            SmartCampus
          </h1>
          <p className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
            Management System
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all"
          >
            Register
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Login
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 py-12 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">
            Smart Campus Platform
          </p>
          <h2 className="text-6xl font-black text-slate-800 tracking-tight leading-none mb-6">
            Manage your entire campus from one centralized system
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl mb-8">
            A modern campus management platform for attendance, notices, scheduling,
            lost and found, analytics, and administrative control.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Get Started
            </button>

            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-lg hover:bg-slate-50 transition-all"
            >
              Create Account
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                <p className="text-sm text-slate-500 font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Preview
              </p>
              <h3 className="text-2xl font-black text-slate-800">Platform Highlights</h3>
            </div>
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Bell size={24} />
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                title: 'Unified Administration',
                desc: 'Manage users, attendance, notices, events, and data from one panel.',
                icon: Users,
              },
              {
                title: 'Smart Academic Monitoring',
                desc: 'Improve operational control through real-time attendance tracking.',
                icon: CheckSquare,
              },
              {
                title: 'Efficient Communication',
                desc: 'Deliver structured announcements to the right audience instantly.',
                icon: MessageSquare,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100"
              >
                <div className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0">
                  <item.icon size={22} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Core Modules
          </p>
          <h3 className="text-3xl font-black text-slate-800">Everything needed to run a smart campus</h3>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
                <feature.icon size={26} />
              </div>
              <h4 className="text-xl font-black text-slate-800">{feature.title}</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mt-2">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-white border border-slate-100 rounded-4xl p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
              Ready to Begin
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              Access your campus portal today
            </h3>
            <p className="text-slate-500 font-medium mt-2">
              Sign in or register to start managing your campus operations.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              Login
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all"
            >
              Register
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;