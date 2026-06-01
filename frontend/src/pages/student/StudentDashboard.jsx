import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentLayout from './StudentLayout';
import {
  ClipboardList,
  Calendar,
  User,
  BookOpen,
  Bell,
  Percent,
  ArrowUpRight,
  DoorOpen,
  Hash,
  Megaphone,
  PackageOpen,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import api from '../../api';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [summary, setSummary] = useState(null);
  const [examSeats, setExamSeats] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const todayDate = new Date().toISOString().slice(0, 10);

  const formatDate = (value) => {
    if (!value) return 'Not scheduled';

    try {
      return new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

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

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const dashboardRes = await api.get(
        `/student-attendance/student-dashboard/${user?.id}`
      );

      const dashboardData = dashboardRes.data;
      setSummary(dashboardData);

      const groupId = dashboardData?.group?.group_id;

      const noticeUrl = groupId
        ? `/notices?audience_type=student&group_id=${groupId}`
        : '/notices?audience_type=student';

      const [examResult, noticeResult, eventResult, lostFoundResult] =
        await Promise.allSettled([
          api.get('/exams/student/my-seats'),
          api.get(noticeUrl),
          api.get('/events'),
          api.get('/lost-found'),
        ]);

      if (examResult.status === 'fulfilled') {
        setExamSeats(
          Array.isArray(examResult.value.data) ? examResult.value.data : []
        );
      }

      if (noticeResult.status === 'fulfilled') {
        setNotices(
          Array.isArray(noticeResult.value.data) ? noticeResult.value.data : []
        );
      }

      if (eventResult.status === 'fulfilled') {
        setEvents(
          Array.isArray(eventResult.value.data) ? eventResult.value.data : []
        );
      }

      if (lostFoundResult.status === 'fulfilled') {
        setLostFound(
          Array.isArray(lostFoundResult.value.data)
            ? lostFoundResult.value.data
            : []
        );
      }
    } catch (error) {
      console.error('Student dashboard error:', error);
      alert(error.response?.data?.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboard();
    }
  }, [user?.id]);

  const todayClasses = useMemo(() => {
    return (summary?.routines || []).filter(
      (routine) => routine?.day_of_week === today
    );
  }, [summary, today]);

  const upcomingExam = useMemo(() => {
    const sorted = [...examSeats].sort((a, b) => {
      const aDate = `${a.exam_date || ''} ${a.start_time || ''}`;
      const bDate = `${b.exam_date || ''} ${b.start_time || ''}`;
      return new Date(aDate) - new Date(bDate);
    });

    return sorted.find((exam) => exam.exam_date >= todayDate) || sorted[0] || null;
  }, [examSeats, todayDate]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        if (!event.start_datetime) return true;
        return new Date(event.start_datetime) >= new Date();
      })
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
      .slice(0, 3);
  }, [events]);

  const recentLostFound = useMemo(() => {
    return [...lostFound]
      .filter((item) => item.status !== 'resolved')
      .slice(0, 3);
  }, [lostFound]);

  const latestNotices = useMemo(() => {
    return notices.slice(0, 3);
  }, [notices]);

  const attendancePercentage =
    summary?.attendance?.attendance_percentage || 0;

  const dashboardCards = [
    {
      title: 'Attendance %',
      icon: Percent,
      value: `${attendancePercentage}%`,
      path: '/student/attendance',
      bg: 'bg-sky-100',
      iconColor: 'text-sky-600',
      subtext: 'Overall attendance',
    },
    {
      title: 'Total Classes',
      icon: ClipboardList,
      value: summary?.attendance?.total_classes || 0,
      path: '/student/attendance',
      bg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      subtext: 'Attendance records',
    },
    {
      title: "Today's Classes",
      icon: Calendar,
      value: todayClasses.length,
      path: '/student/routines',
      bg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      subtext: today,
    },
    {
      title: 'Exam Seats',
      icon: DoorOpen,
      value: examSeats.length,
      path: '/student/exams',
      bg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      subtext: 'Assigned exams',
    },
  ];

  const quickModules = [
    {
      title: 'Profile',
      icon: User,
      desc: 'View student profile',
      path: '/student/profile',
    },
    {
      title: 'Attendance',
      icon: ClipboardList,
      desc: 'View attendance summary',
      path: '/student/attendance',
    },
    {
      title: 'Routines',
      icon: BookOpen,
      desc: 'View weekly classes',
      path: '/student/routines',
    },
    {
      title: 'Exam Seats',
      icon: DoorOpen,
      desc: 'View exam room and seat',
      path: '/student/exams',
    },
    {
      title: 'Notices',
      icon: Bell,
      desc: 'Campus announcements',
      path: '/student/notices',
    },
    {
      title: 'Events',
      icon: Calendar,
      desc: 'Upcoming campus events',
      path: '/student/events',
    },
    {
      title: 'Lost & Found',
      icon: PackageOpen,
      desc: 'Find or report items',
      path: '/student/lost-found',
    },
  ];

  if (loading) {
    return (
      <StudentLayout
        pageLabel="Student Module"
        title="Dashboard"
        subtitle="Loading personalized overview..."
      >
        <div className="bg-white rounded-3xl p-8 text-slate-500 font-bold">
          Loading dashboard...
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Student'}. Here is your personalized campus overview.`}
    >
      {attendancePercentage > 0 && attendancePercentage < 75 && (
        <section className="mb-8 bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h2 className="font-black text-rose-700">
              Low Attendance Warning
            </h2>

            <p className="text-sm text-rose-600 font-medium mt-1">
              Your attendance is currently {attendancePercentage}%. Please attend classes regularly to stay above the required threshold.
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.path)}
              className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
            >
              <div
                className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center shadow-inner mb-4`}
              >
                <Icon className={card.iconColor} size={28} />
              </div>

              <p className="font-bold text-slate-500 text-sm">
                {card.title}
              </p>

              <div className="flex items-end justify-between gap-3 mt-1">
                <h3 className="text-3xl font-black text-slate-900">
                  {card.value}
                </h3>

                <ArrowUpRight
                  size={18}
                  className="text-slate-300 group-hover:text-indigo-600 transition-colors"
                />
              </div>

              <p className="text-xs text-slate-400 font-semibold mt-2">
                {card.subtext}
              </p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Today's Classes
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Your schedule for {today}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/routines')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((routine) => (
                <div
                  key={routine.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <h3 className="font-black text-slate-800">
                    {routine.subject_name}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <Clock size={15} />
                    {routine.start_time?.slice(0, 5)} -{' '}
                    {routine.end_time?.slice(0, 5)}
                  </p>

                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <MapPin size={15} />
                    {routine.room || routine.location || 'Room not set'}
                  </p>

                  <p className="text-xs text-slate-400 font-semibold mt-2">
                    {routine.faculty_name || 'Faculty not assigned'}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <Calendar size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No classes today.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Exam Seat
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Your assigned exam room
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/exams')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          {upcomingExam ? (
            <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100">
              <h3 className="text-lg font-black text-slate-800">
                {upcomingExam.exam_name}
              </h3>

              <p className="text-sm text-indigo-600 font-black mt-1">
                {upcomingExam.subject_name}
              </p>

              <div className="space-y-2 mt-4 text-sm text-slate-600 font-medium">
                <p className="flex items-center gap-2">
                  <Calendar size={15} />
                  {formatDate(upcomingExam.exam_date)}
                </p>

                <p className="flex items-center gap-2">
                  <Clock size={15} />
                  {upcomingExam.start_time?.slice(0, 5)} -{' '}
                  {upcomingExam.end_time?.slice(0, 5)}
                </p>

                <p className="flex items-center gap-2">
                  <DoorOpen size={15} />
                  Room: {upcomingExam.room_name}
                </p>

                <p className="flex items-center gap-2">
                  <Hash size={15} />
                  Seat No: {upcomingExam.seat_number}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-50">
              <DoorOpen size={30} className="mx-auto text-slate-300" />

              <p className="font-bold text-slate-600 mt-3">
                No exam seat assigned.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Latest Notices
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Recent announcements
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/notices')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {latestNotices.length > 0 ? (
              latestNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-start gap-3">
                    <Megaphone
                      size={18}
                      className="text-indigo-600 shrink-0 mt-1"
                    />

                    <div>
                      <h3 className="font-black text-slate-800 line-clamp-1">
                        {notice.title}
                      </h3>

                      <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-2">
                        {notice.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <Bell size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No notices available.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Upcoming Events
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Campus activities
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/events')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <h3 className="font-black text-slate-800">
                    {event.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {event.venue || 'Venue not set'} •{' '}
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

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Lost & Found
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Recently reported items
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/student/lost-found')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recentLostFound.length > 0 ? (
              recentLostFound.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        item.item_type === 'lost'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {item.item_type}
                    </span>

                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-600 uppercase">
                      {item.status === 'resolved' ? 'returned' : 'open'}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-800">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {item.location || 'Location not provided'}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <PackageOpen size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No open lost/found items.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-black text-slate-900 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {quickModules.map((mod) => {
            const Icon = mod.icon;

            return (
              <button
                key={mod.title}
                type="button"
                onClick={() => navigate(mod.path)}
                className="bg-white p-7 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner">
                    <Icon size={26} />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-slate-300 group-hover:text-indigo-600 transition-colors"
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {mod.title}
                </h3>

                <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
                  {mod.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </StudentLayout>
  );
};

export default StudentDashboard;