import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Pencil,
  Megaphone,
  Globe,
  Users,
  CalendarDays,
  RefreshCw,
  CheckSquare,
  Search,
  X,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    audience_type: 'all',
    group_id: '',
    group_ids: [],
    publish_date: '',
  });

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');

      const noticeData = Array.isArray(res.data)
        ? res.data
        : res.data.notices || [];

      setNotices(noticeData);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      setNotices([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/notices/groups');

      const groupData = Array.isArray(res.data)
        ? res.data
        : res.data.groups || [];

      setGroups(groupData);
    } catch (error) {
      console.error('Failed to fetch notice groups:', error);
      setGroups([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);

    try {
      await Promise.all([fetchNotices(), fetchGroups()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      audience_type: 'all',
      group_id: '',
      group_ids: [],
      publish_date: '',
    });

    setEditing(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setAudienceFilter('all');
    setDateFilter('');
  };

  const toggleGroup = (groupId) => {
    const idString = String(groupId);

    setForm((prev) => {
      const alreadySelected = prev.group_ids.includes(idString);

      return {
        ...prev,
        group_ids: alreadySelected
          ? prev.group_ids.filter((id) => id !== idString)
          : [...prev.group_ids, idString],
      };
    });
  };

  const selectAllGroups = () => {
    setForm((prev) => ({
      ...prev,
      group_ids: groups.map((group) => String(group.id)),
    }));
  };

  const clearGroups = () => {
    setForm((prev) => ({
      ...prev,
      group_ids: [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      form.audience_type === 'group' &&
      !editing &&
      form.group_ids.length === 0
    ) {
      alert('Please select at least one group');
      return;
    }

    if (form.audience_type === 'group' && editing && !form.group_id) {
      alert('Please select group');
      return;
    }

    const noticeData = editing
      ? {
          title: form.title,
          message: form.message,
          audience_type: form.audience_type,
          group_id: form.audience_type === 'group' ? form.group_id : null,
          publish_date: form.publish_date || null,
        }
      : {
          title: form.title,
          message: form.message,
          audience_type: form.audience_type,
          group_id:
            form.audience_type === 'group' ? form.group_ids[0] || null : null,
          group_ids: form.audience_type === 'group' ? form.group_ids : [],
          publish_date: form.publish_date || null,
        };

    try {
      if (editing) {
        await api.put(`/notices/${editing.id}`, noticeData);
      } else {
        await api.post('/notices', noticeData);
      }

      resetForm();
      fetchNotices();
    } catch (error) {
      console.error('Failed to save notice:', error);
      alert(error.response?.data?.message || 'Failed to save notice');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this notice?');
    if (!confirmDelete) return;

    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (error) {
      console.error('Failed to delete notice:', error);
      alert(error.response?.data?.message || 'Failed to delete notice');
    }
  };

  const handleEdit = (notice) => {
    setEditing(notice);

    setForm({
      title: notice.title || '',
      message: notice.message || '',
      audience_type: notice.audience_type || 'all',
      group_id: notice.group_id || '',
      group_ids: notice.group_id ? [String(notice.group_id)] : [],
      publish_date:
        notice.publish_date?.split?.('T')?.[0] || notice.publish_date || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const getGroupName = (groupId) => {
    const group = groups.find((g) => Number(g.id) === Number(groupId));

    if (!group) return 'Specific Group';

    return `${group.course_name} - ${group.level_name || group.semester}`;
  };

  const formatAudience = (notice) => {
    if (notice.audience_type === 'all') return 'All Campus';
    if (notice.audience_type === 'faculty') return 'Faculty Only';
    if (notice.audience_type === 'students') return 'Students Only';

    if (notice.audience_type === 'group') {
      if (notice.course_name || notice.level_name || notice.section_name) {
        return `${notice.course_name || 'Course'} - ${
          notice.level_name || notice.section_name || 'Level'
        }`;
      }

      return getGroupName(notice.group_id);
    }

    return 'All Campus';
  };

  const getAudienceBadgeClass = (audienceType) => {
    if (audienceType === 'all') return 'bg-indigo-100 text-indigo-600';
    if (audienceType === 'faculty') return 'bg-violet-100 text-violet-600';
    if (audienceType === 'students') return 'bg-blue-100 text-blue-600';
    return 'bg-emerald-100 text-emerald-600';
  };

  const getNoticeDate = (notice) => {
    const rawDate = notice.publish_date || notice.created_at;

    if (!rawDate) return '';

    return String(rawDate).split('T')[0];
  };

  const filteredNotices = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return notices.filter((notice) => {
      const audienceText = formatAudience(notice);

      const searchableText = `
        ${notice.title || ''}
        ${notice.message || ''}
        ${notice.audience_type || ''}
        ${audienceText || ''}
        ${notice.course_name || ''}
        ${notice.level_name || ''}
        ${notice.section_name || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesAudience =
        audienceFilter === 'all' ||
        String(notice.audience_type || 'all') === audienceFilter;

      const matchesDate =
        !dateFilter || String(getNoticeDate(notice)) === String(dateFilter);

      return matchesSearch && matchesAudience && matchesDate;
    });
  }, [notices, searchTerm, audienceFilter, dateFilter, groups]);

  const totalNotices = notices.length;
  const campusWide = notices.filter((n) => n.audience_type === 'all').length;
  const facultyNotices = notices.filter(
    (n) => n.audience_type === 'faculty'
  ).length;
  const studentNotices = notices.filter(
    (n) => n.audience_type === 'students'
  ).length;
  const groupNotices = notices.filter((n) => n.audience_type === 'group').length;

  const summaryCards = [
    {
      label: 'Total Notices',
      value: totalNotices,
      icon: Megaphone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
      filter: 'all',
    },
    {
      label: 'Campus-wide',
      value: campusWide,
      icon: Globe,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
      filter: 'all',
    },
    {
      label: 'Faculty Only',
      value: facultyNotices,
      icon: UserCheck,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      filter: 'faculty',
    },
    {
      label: 'Students Only',
      value: studentNotices,
      icon: GraduationCap,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      filter: 'students',
    },
    {
      label: 'Group Notices',
      value: groupNotices,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      filter: 'group',
    },
  ];

  const hasActiveFilters = searchTerm || audienceFilter !== 'all' || dateFilter;

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Smart Notices"
      subtitle="Create, manage, search, and publish notices for all campus, faculty, students, or specific groups."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        {summaryCards.map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => setAudienceFilter(card.filter)}
            className={`bg-white p-6 rounded-3xl shadow-sm border text-left hover:shadow-lg hover:-translate-y-1 transition-all ${
              audienceFilter === card.filter
                ? 'border-indigo-300 ring-2 ring-indigo-100'
                : 'border-slate-100'
            }`}
          >
            <div
              className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <card.icon size={24} />
            </div>

            <p className="text-slate-500 text-sm font-bold">{card.label}</p>

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {card.value}
            </h3>
          </button>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            {editing ? 'Edit Notice' : 'Create Notice'}
          </h2>

          <p className="text-sm text-slate-500 font-medium mt-1">
            Publish announcements to all campus, faculty only, students only, or selected groups.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.audience_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  audience_type: e.target.value,
                  group_id: '',
                  group_ids: [],
                })
              }
              className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            >
              <option value="all">All Campus</option>
              <option value="faculty">Faculty Only</option>
              <option value="students">Students Only</option>
              <option value="group">Specific Group / Level</option>
            </select>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                value={form.publish_date}
                onChange={(e) =>
                  setForm({ ...form, publish_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          {form.audience_type === 'group' && (
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-800">
                    {editing ? 'Selected Group' : 'Select Groups'}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1">
                    {editing
                      ? 'Editing updates this single notice.'
                      : 'Choose one or more groups for this notice.'}
                  </p>
                </div>

                {!editing && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllGroups}
                      className="px-4 py-2 rounded-2xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition"
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      onClick={clearGroups}
                      className="px-4 py-2 rounded-2xl bg-white text-slate-500 font-bold hover:bg-slate-100 transition"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <select
                  value={form.group_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      group_id: e.target.value,
                      group_ids: e.target.value ? [e.target.value] : [],
                    })
                  }
                  className="w-full px-4 py-4 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  required
                >
                  <option value="">Select Group</option>

                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.course_name} - {g.level_name || g.semester}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {groups.map((g) => {
                    const idString = String(g.id);
                    const selected = form.group_ids.includes(idString);

                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className={`flex items-center justify-between gap-3 px-4 py-4 rounded-2xl border font-bold transition ${
                          selected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                            : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        <span>
                          {g.course_name} - {g.level_name || g.semester}
                        </span>

                        {selected && <CheckSquare size={18} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {!editing && (
                <p className="text-sm text-slate-500 font-medium mt-4">
                  Selected groups: {form.group_ids.length}
                </p>
              )}
            </div>
          )}

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
                onClick={resetForm}
                className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all"
              >
                Cancel Edit
              </button>
            )}

            <button
              type="button"
              onClick={fetchAllData}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw size={18} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Smart Notice Filters
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredNotices.length} notice
              {filteredNotices.length !== 1 ? 's' : ''} shown
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full xl:w-auto">
            <div className="relative xl:col-span-2">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search title, message, audience..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 font-black"
                >
                  ×
                </button>
              )}
            </div>

            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Audiences</option>
              <option value="faculty">Faculty Only</option>
              <option value="students">Students Only</option>
              <option value="group">Group Notices</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={15} />
            Clear Filters
          </button>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Published Notices
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredNotices.length} of {notices.length} notice
              {notices.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
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
              {filteredNotices.length > 0 ? (
                filteredNotices.map((n, index) => (
                  <tr
                    key={n.id}
                    className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                      index === 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 text-base">
                        {n.title}
                      </p>

                      <p className="text-sm text-slate-500 font-medium mt-1 max-w-xl truncate">
                        {n.message}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex px-3 py-2 rounded-2xl text-sm font-bold ${getAudienceBadgeClass(
                          n.audience_type
                        )}`}
                      >
                        {formatAudience(n)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-slate-500 font-semibold">
                        {getNoticeDate(n) || 'N/A'}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(n)}
                          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    {hasActiveFilters
                      ? 'No matching notices found.'
                      : 'No notices available.'}
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