import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Megaphone, Globe, Users, CalendarDays } from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    audience_type: 'all',
    group_id: '',
    publish_date: '',
  });

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch notices');
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/attendance/groups');
      setGroups(res.data);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch groups');
    }
  };

  useEffect(() => {
    fetchNotices();
    fetchGroups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editing) {
        await api.put(`/notices/${editing.id}`, form);
      } else {
        await api.post('/notices', form);
      }

      setForm({
        title: '',
        message: '',
        audience_type: 'all',
        group_id: '',
        publish_date: '',
      });

      setEditing(null);
      fetchNotices();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this notice?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleEdit = (notice) => {
    setEditing(notice);
    setForm({
      title: notice.title,
      message: notice.message,
      audience_type: notice.audience_type,
      group_id: notice.group_id || '',
      publish_date: notice.publish_date?.split('T')[0] || notice.publish_date,
    });
  };

  const totalNotices = notices.length;
  const campusWide = notices.filter((n) => n.audience_type === 'all').length;
  const groupNotices = notices.filter((n) => n.audience_type === 'group').length;

  const summaryCards = [
    {
      label: 'Total Notices',
      value: totalNotices,
      icon: Megaphone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Campus-wide',
      value: campusWide,
      icon: Globe,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Group Notices',
      value: groupNotices,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  const formatAudience = (notice) => {
    if (notice.audience_type === 'all') return 'All Campus';
    return `${notice.course_name || ''} ${notice.semester || ''} ${notice.section_name || ''}`.trim();
  };

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Smart Notices"
      subtitle="Create, manage, and publish campus-wide or group-specific announcements."
    >
      {/* Summary */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}>
              <card.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{card.label}</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">{card.value}</h3>
          </div>
        ))}
      </section>

      {/* Notice form */}
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            {editing ? 'Edit Notice' : 'Create Notice'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Publish announcements to the entire campus or to a selected student group.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Notice Title"
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <textarea
            placeholder="Write the full notice message..."
            rows="5"
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium resize-none"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={form.audience_type}
              onChange={(e) =>
                setForm({ ...form, audience_type: e.target.value, group_id: '' })
              }
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            >
              <option value="all">All Campus</option>
              <option value="group">Specific Group</option>
            </select>

            {form.audience_type === 'group' ? (
              <select
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
                required
              >
                <option value="">Select Group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.course_name} - {g.semester} - Section {g.section_name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 font-medium flex items-center">
                No group required
              </div>
            )}

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                value={form.publish_date}
                onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <Plus size={18} />
              {editing ? 'Update Notice' : 'Create Notice'}
            </button>

            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    title: '',
                    message: '',
                    audience_type: 'all',
                    group_id: '',
                    publish_date: '',
                  });
                }}
                className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Notice table */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">Published Notices</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {notices.length} notice{notices.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-275">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Notice
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Audience
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Publish Date
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {notices.map((n, index) => (
                <tr
                  key={n.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-800 text-base">{n.title}</p>
                      <p className="text-sm text-slate-500 font-medium mt-1 max-w-xl truncate">
                        {n.message}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold ${
                        n.audience_type === 'all'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {formatAudience(n)}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-slate-500 font-semibold">
                      {new Date(n.publish_date).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(n)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(n.id)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {notices.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No notices created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
};

export default NoticeManagement;