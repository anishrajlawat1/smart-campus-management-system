import React, { useEffect, useState } from 'react';
import StudentLayout from './StudentLayout';
import api from '../../api';
import {
  Bell,
  CalendarDays,
  GraduationCap,
  Megaphone,
  RefreshCw,
  User,
} from 'lucide-react';

const StudentNoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    setLoading(true);

    try {
      const res = await api.get('/notices/student/my-notices');
      setNotices(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load notices:', error);
      alert(error.response?.data?.message || 'Failed to load notices');
      setNotices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'No date';

    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <StudentLayout
        pageLabel="Student Module"
        title="Student Notices"
        subtitle="Announcements for your class and campus."
      >
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center text-slate-500 font-bold">
          Loading notices...
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="Student Notices"
      subtitle="Announcements for your class and campus."
    >
      <div className="w-full max-w-300 space-y-8">
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">
                Notices
              </p>

              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
                My Announcements
              </h2>

              <p className="text-slate-500 font-medium mt-2">
                Showing campus-wide notices and notices assigned to your group.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchNotices}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </section>

        {notices.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white p-6 min-h-62.5 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner mb-5">
                  <Bell size={24} />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      notice.audience_type === 'all'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {notice.audience_type === 'all'
                      ? 'All Campus'
                      : 'Group Notice'}
                  </span>

                  {notice.publish_date && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                      {formatDate(notice.publish_date)}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black text-slate-900 wrap-break-word">
                  {notice.title}
                </h3>

                <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed wrap-break-word">
                  {notice.message}
                </p>

                <div className="mt-5 space-y-3 text-sm font-medium text-slate-500">
                  <p className="flex items-center gap-2">
                    <GraduationCap size={16} />
                    {notice.course_name || 'All Courses'} /{' '}
                    {notice.level_name || notice.section_name || 'All Levels'}
                  </p>

                  {notice.subject_name && (
                    <p className="flex items-center gap-2">
                      <Megaphone size={16} />
                      {notice.subject_name}
                    </p>
                  )}

                  <p className="flex items-center gap-2">
                    <User size={16} />
                    {notice.created_by_name || 'Admin'}
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    {formatDate(notice.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </section>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
              <Bell size={28} />
            </div>

            <h3 className="text-xl font-black text-slate-900">
              No notices available.
            </h3>

            <p className="text-slate-500 font-medium mt-2">
              There are no campus or group notices for you yet.
            </p>
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentNoticePage;