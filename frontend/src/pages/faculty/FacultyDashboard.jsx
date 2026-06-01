import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckSquare,
  ClipboardList,
  Search,
  Calendar,
  Bell,
  DoorOpen,
  ArrowUpRight,
  Clock,
  MapPin,
  Megaphone,
  ShieldCheck,
  PackageOpen,
  AlertTriangle,
} from 'lucide-react';

import FacultyLayout from './FacultyLayout';
import api from '../../api';

const FacultyDashboard = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [classes, setClasses] = useState([]);
  const [invigilationRooms, setInvigilationRooms] = useState([]);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [lowAttendanceRisk, setLowAttendanceRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const getFallbackImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Faculty'
    )}&background=4f46e5&color=ffffff&size=256`;

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
      const [
        classResult,
        examResult,
        noticeResult,
        eventResult,
        lostFoundResult,
        riskResult,
      ] = await Promise.allSettled([
        api.get('/faculty/classes'),
        api.get('/exams/faculty/my-rooms'),
        api.get('/notices?audience_type=faculty'),
        api.get('/events'),
        api.get('/lost-found'),
        api.get(`/student-attendance/faculty/${user?.id}/low-attendance-risk`),
      ]);

      if (classResult.status === 'fulfilled') {
        setClasses(
          Array.isArray(classResult.value.data)
            ? classResult.value.data
            : []
        );
      }

      if (examResult.status === 'fulfilled') {
        setInvigilationRooms(
          Array.isArray(examResult.value.data)
            ? examResult.value.data
            : []
        );
      }

      if (noticeResult.status === 'fulfilled') {
        setNotices(
          Array.isArray(noticeResult.value.data)
            ? noticeResult.value.data
            : []
        );
      }

      if (eventResult.status === 'fulfilled') {
        setEvents(
          Array.isArray(eventResult.value.data)
            ? eventResult.value.data
            : []
        );
      }

      if (lostFoundResult.status === 'fulfilled') {
        setLostFound(
          Array.isArray(lostFoundResult.value.data)
            ? lostFoundResult.value.data
            : []
        );
      }

      if (riskResult.status === 'fulfilled') {
        setLowAttendanceRisk(
          Array.isArray(riskResult.value.data)
            ? riskResult.value.data
            : []
        );
      }
    } catch (error) {
      console.error('Faculty dashboard error:', error);
      alert(error.response?.data?.message || 'Failed to load faculty dashboard');
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
    return classes.filter((item) => item.day_of_week === today);
  }, [classes, today]);

  const upcomingInvigilation = useMemo(() => {
    return [...invigilationRooms]
      .sort((a, b) => {
        const aDate = `${a.exam_date || ''} ${a.start_time || ''}`;
        const bDate = `${b.exam_date || ''} ${b.start_time || ''}`;

        return new Date(aDate) - new Date(bDate);
      })
      .slice(0, 3);
  }, [invigilationRooms]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((event) => {
        if (!event.start_datetime) return true;
        return new Date(event.start_datetime) >= new Date();
      })
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
      .slice(0, 3);
  }, [events]);

  const recentNotices = useMemo(() => {
    return notices.slice(0, 3);
  }, [notices]);

  const openLostFound = useMemo(() => {
    return lostFound
      .filter((item) => item.status !== 'resolved')
      .slice(0, 3);
  }, [lostFound]);

  const cards = [
    {
      title: 'Assigned Classes',
      value: classes.length,
      desc: 'Total assigned subjects/groups',
      icon: BookOpen,
      path: '/faculty/classes',
      bg: 'bg-indigo-100',
      color: 'text-indigo-600',
    },
    {
      title: "Today's Classes",
      value: todayClasses.length,
      desc: today,
      icon: Calendar,
      path: '/faculty/classes',
      bg: 'bg-violet-100',
      color: 'text-violet-600',
    },
    {
      title: 'Invigilation Rooms',
      value: invigilationRooms.length,
      desc: 'Assigned exam rooms',
      icon: ShieldCheck,
      path: '/faculty/exams',
      bg: 'bg-emerald-100',
      color: 'text-emerald-600',
    },
    {
      title: 'At Risk Students',
      value: lowAttendanceRisk.length,
      desc: 'Below 75% in your classes',
      icon: AlertTriangle,
      path: '/faculty/reports',
      bg: 'bg-rose-100',
      color: 'text-rose-600',
    },
    {
      title: 'Notices',
      value: notices.length,
      desc: 'Faculty notices',
      icon: Bell,
      path: '/faculty/notices',
      bg: 'bg-orange-100',
      color: 'text-orange-600',
    },
  ];

  const modules = [
    {
      title: 'Mark Attendance',
      desc: 'Take student attendance for assigned classes.',
      icon: CheckSquare,
      path: '/faculty/attendance',
    },
    {
      title: 'My Classes',
      desc: 'View assigned groups, subjects and weekly schedule.',
      icon: BookOpen,
      path: '/faculty/classes',
    },
    {
      title: 'Exam Invigilation',
      desc: 'View assigned rooms and export exam attendance sheets.',
      icon: DoorOpen,
      path: '/faculty/exams',
    },
    {
      title: 'Reports',
      desc: 'View and export attendance summaries.',
      icon: ClipboardList,
      path: '/faculty/reports',
    },
    {
      title: 'Notices',
      desc: 'Read faculty and campus notices.',
      icon: Bell,
      path: '/faculty/notices',
    },
    {
      title: 'Lost & Found',
      desc: 'Report and view lost items.',
      icon: Search,
      path: '/faculty/lost-found',
    },
  ];

  if (loading) {
    return (
      <FacultyLayout
        pageLabel="Faculty Module"
        title="Faculty Dashboard"
        subtitle="Loading personalized overview..."
      >
        <div className="bg-white rounded-3xl p-8 text-slate-500 font-bold">
          Loading dashboard...
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Faculty Dashboard"
      subtitle={`Welcome back, ${
        user?.name || 'Faculty'
      }. Here is your academic overview.`}
    >
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.profile_image || getFallbackImage(user?.name)}
              alt={user?.name || 'Faculty'}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-slate-100"
              onError={(e) => {
                e.currentTarget.src = getFallbackImage(user?.name);
              }}
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-800">
                  {user?.name || 'Faculty User'}
                </h2>

                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                  Faculty
                </span>
              </div>

              <p className="text-slate-500 font-medium mt-1">
                {user?.email || 'faculty@email.com'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/faculty/attendance')}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <CheckSquare size={18} />
            Mark Attendance
          </button>
        </div>
      </section>

      {upcomingInvigilation.length > 0 && (
        <section className="mb-8 bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h2 className="font-black text-emerald-700">
              Exam Invigilation Assigned
            </h2>

            <p className="text-sm text-emerald-600 font-medium mt-1">
              You have {invigilationRooms.length} assigned exam room
              {invigilationRooms.length !== 1 ? 's' : ''}. Please check your
              invigilation schedule.
            </p>
          </div>
        </section>
      )}

      {lowAttendanceRisk.length > 0 && (
        <section className="mb-8 bg-rose-50 border border-rose-100 rounded-3xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>

          <div>
            <h2 className="font-black text-rose-700">
              Low Attendance Risk Detected
            </h2>

            <p className="text-sm text-rose-600 font-medium mt-1">
              {lowAttendanceRisk.length} student
              {lowAttendanceRisk.length !== 1 ? 's are' : ' is'} below 75% in
              your assigned subjects.
            </p>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.path)}
              className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
            >
              <div
                className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-inner mb-4`}
              >
                <Icon size={26} />
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
                {card.desc}
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
              onClick={() => navigate('/faculty/classes')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((item) => (
                <div
                  key={`${item.group_id}-${item.subject_id}-${item.start_time}`}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <h3 className="font-black text-slate-800">
                    {item.subject_name}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <Clock size={15} />
                    {item.start_time?.slice(0, 5)} -{' '}
                    {item.end_time?.slice(0, 5)}
                  </p>

                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <MapPin size={15} />
                    {item.room || item.location || 'Room not set'}
                  </p>

                  <p className="text-xs text-slate-400 font-semibold mt-2">
                    {item.course_name} / {item.semester} / {item.section_name}
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
                Exam Invigilation
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Assigned exam rooms
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/faculty/exams')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {upcomingInvigilation.length > 0 ? (
              upcomingInvigilation.map((room) => (
                <div
                  key={room.room_id}
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100"
                >
                  <h3 className="font-black text-slate-800">
                    {room.room_name}
                  </h3>

                  <p className="text-sm text-emerald-700 font-black mt-1">
                    {room.exam_name}
                  </p>

                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {room.subject_name || 'Subject not set'}
                  </p>

                  <p className="text-xs text-slate-400 font-semibold mt-2">
                    {room.exam_date} • {room.start_time?.slice(0, 5)} -{' '}
                    {room.end_time?.slice(0, 5)} •{' '}
                    {room.assigned_students || 0} students
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50">
                <ShieldCheck size={30} className="mx-auto text-slate-300" />

                <p className="font-bold text-slate-600 mt-3">
                  No invigilation assigned.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Recent Notices
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Latest faculty announcements
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/faculty/notices')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
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

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-10">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Students At Attendance Risk
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Students below 75% in your assigned subjects.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/faculty/reports')}
            className="text-sm font-black text-indigo-600"
          >
            View reports
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lowAttendanceRisk.length > 0 ? (
            lowAttendanceRisk.slice(0, 6).map((student) => (
              <div
                key={`${student.student_id}-${student.subject_id}-${student.group_id}`}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-100"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={19}
                    className="text-rose-600 mt-1 shrink-0"
                  />

                  <div className="min-w-0">
                    <h3 className="font-black text-slate-800 truncate">
                      {student.student_name}
                    </h3>

                    <p className="text-xs text-slate-500 font-semibold truncate">
                      {student.student_email}
                    </p>

                    <p className="text-sm text-slate-700 font-bold mt-2">
                      {student.subject_name}
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
            <div className="xl:col-span-3 p-8 text-center rounded-2xl bg-slate-50">
              <ShieldCheck size={30} className="mx-auto text-emerald-500" />

              <p className="font-bold text-slate-600 mt-3">
                No at-risk students in your assigned classes.
              </p>
            </div>
          )}
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
              onClick={() => navigate('/faculty/notices')}
              className="text-sm font-black text-indigo-600"
            >
              View notices
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
                Recently reported open items
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/faculty/lost-found')}
              className="text-sm font-black text-indigo-600"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {openLostFound.length > 0 ? (
              openLostFound.map((item) => (
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
        <h2 className="text-xl font-black text-slate-800 mb-6">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;

            return (
              <button
                key={m.title}
                type="button"
                onClick={() => navigate(m.path)}
                className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner">
                    <Icon size={28} />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-slate-300 group-hover:text-indigo-600 transition-colors"
                  />
                </div>

                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">
                  {m.title}
                </h3>

                <p className="text-slate-500 text-sm mt-2">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </FacultyLayout>
  );
};

export default FacultyDashboard;