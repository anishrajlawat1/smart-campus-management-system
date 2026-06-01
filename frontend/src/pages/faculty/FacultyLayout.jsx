import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Search,
  Bell,
  LogOut,
  CheckCircle2,
  RefreshCw,
  FileText,
  User,
} from 'lucide-react';
import api from '../../api';

const FacultyLayout = ({
  pageLabel = 'Faculty Module',
  title = 'Faculty Page',
  subtitle = 'Manage your academic tasks.',
  children,
}) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => Number(n.is_read) === 0).length;

  const getFallbackImage = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'Faculty'
    )}&background=4f46e5&color=ffffff&size=256`;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menu = [
    { title: 'Dashboard', path: '/faculty-dashboard', icon: LayoutDashboard },
    { title: 'Profile', path: '/faculty/profile', icon: User },
    { title: 'My Classes', path: '/faculty/classes', icon: BookOpen },
    { title: 'Attendance', path: '/faculty/attendance', icon: ClipboardCheck },
    { title: 'Exam Invigilation', path: '/faculty/exams', icon: FileText },
    { title: 'Reports', path: '/faculty/reports', icon: BarChart3 },
    { title: 'Notices', path: '/faculty/notices', icon: Bell },
    { title: 'Lost & Found', path: '/faculty/lost-found', icon: Search },
  ];

  const fetchNotifications = async () => {
    setLoadingNotifications(true);

    try {
      const res = await api.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                is_read: 1,
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => Number(n.is_read) === 0);

    try {
      await Promise.all(
        unreadItems.map((item) => api.put(`/notifications/${item.id}/read`))
      );

      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: 1,
        }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const formatNotificationDate = (date) => {
    if (!date) return '';

    try {
      return new Date(date).toLocaleString();
    } catch {
      return date;
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col">
        <h2 className="text-2xl font-black text-indigo-600 mb-8">
          SmartCampus
        </h2>

        <nav className="space-y-2 flex-1">
          {menu.map((item) => {
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
                {item.title}
              </NavLink>
            );
          })}
        </nav>

        <div className="bg-slate-50 rounded-2xl p-4 mb-3 flex items-center gap-3">
          <img
            src={user?.profile_image || getFallbackImage(user?.name)}
            alt={user?.name || 'Faculty'}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            onError={(e) => {
              e.currentTarget.src = getFallbackImage(user?.name);
            }}
          />

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.name || 'Faculty'}
            </p>
            <p className="text-xs text-slate-500">Faculty Member</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-rose-600 hover:bg-rose-50 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-400 font-bold">
              {pageLabel}
            </p>

            <h1 className="text-3xl lg:text-4xl font-black text-slate-800 mt-2">
              {title}
            </h1>

            <p className="text-slate-500 font-medium mt-2">{subtitle}</p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen((prev) => !prev)}
              className="relative w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition flex items-center justify-center"
              title="Notifications"
            >
              <Bell size={21} />

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/70 z-50 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">
                      Notifications
                    </h3>

                    <p className="text-sm text-slate-500 font-medium mt-1">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchNotifications}
                    disabled={loadingNotifications}
                    className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition flex items-center justify-center disabled:opacity-60"
                    title="Refresh notifications"
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((item) => {
                      const unread = Number(item.is_read) === 0;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => markNotificationAsRead(item.id)}
                          className={`w-full text-left p-5 border-b border-slate-100 hover:bg-slate-50 transition ${
                            unread ? 'bg-indigo-50/50' : 'bg-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-800 wrap-break-word">
                                {item.title || 'Notification'}
                              </p>

                              {unread && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                              )}
                            </div>

                            <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed wrap-break-word">
                              {item.message || 'No message available.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                                {item.type || 'general'}
                              </span>

                              <span className="text-xs text-slate-400 font-semibold">
                                {formatNotificationDate(item.created_at)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                        <Bell size={24} />
                      </div>

                      <p className="font-bold text-slate-700">
                        No notifications yet.
                      </p>

                      <p className="text-sm text-slate-500 font-medium mt-1">
                        Faculty updates will appear here.
                      </p>
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-4 bg-slate-50 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-slate-600 font-bold hover:text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <CheckCircle2 size={16} />
                      Mark all read
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotificationOpen(false)}
                      className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
};

export default FacultyLayout;