import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, X, Bell, Search } from 'lucide-react';
import api from '../../api';
import FacultyLayout from './FacultyLayout';

const FacultyNoticePage = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  const [notices, setNotices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjectsByGroup, setSubjectsByGroup] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    audience_type: 'group',
    group_id: '',
    subject_id: '',
    publish_date: '',
  });

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/student-attendance/faculty-subjects', {
        params: { faculty_id: user?.id },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      const groupMap = new Map();
      const subjectMap = {};

      data.forEach((item) => {
        if (!groupMap.has(item.group_id)) {
          groupMap.set(item.group_id, {
            id: item.group_id,
            course_name: item.course_name,
            semester: item.semester,
            section_name: item.section_name,
          });
        }

        if (!subjectMap[item.group_id]) {
          subjectMap[item.group_id] = [];
        }

        const exists = subjectMap[item.group_id].some(
          (s) => Number(s.id) === Number(item.subject_id)
        );

        if (!exists) {
          subjectMap[item.group_id].push({
            id: item.subject_id,
            subject_name: item.subject_name,
          });
        }
      });

      setGroups(Array.from(groupMap.values()));
      setSubjectsByGroup(subjectMap);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load assigned sections');
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      const data = Array.isArray(res.data) ? res.data : [];

      const relevantNotices = data.filter((notice) => {
        const audienceType = notice.audience_type || 'all';
        const createdByMe = Number(notice.created_by) === Number(user?.id);

        return (
          audienceType === 'all' ||
          audienceType === 'faculty' ||
          createdByMe
        );
      });

      setNotices(relevantNotices);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to fetch notices');
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchNotices();
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      message: '',
      audience_type: 'group',
      group_id: '',
      subject_id: '',
      publish_date: '',
    });
    setShowModal(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title || '',
      message: notice.message || '',
      audience_type: notice.audience_type || 'group',
      group_id: notice.group_id || '',
      subject_id: notice.subject_id || '',
      publish_date: notice.publish_date
        ? String(notice.publish_date).slice(0, 10)
        : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotice(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'group_id' ? { subject_id: '' } : {}),
      ...(name === 'audience_type' && value !== 'group'
        ? { group_id: '', subject_id: '' }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.audience_type === 'group' && !formData.group_id) {
      alert('Please select section');
      return;
    }

    const payload = {
      title: formData.title,
      message: formData.message,
      audience_type: formData.audience_type,
      group_id: formData.audience_type === 'group' ? formData.group_id : null,
      subject_id: formData.audience_type === 'group' ? formData.subject_id || null : null,
      publish_date: formData.publish_date || null,
      created_by: user?.id,
    };

    try {
      if (editingNotice) {
        await api.put(`/notices/${editingNotice.id}`, payload);
      } else {
        await api.post('/notices', payload);
      }

      closeModal();
      fetchNotices();
    } catch (error) {
      alert(error.response?.data?.message || 'Notice operation failed');
    }
  };

  const handleDelete = async (notice) => {
    if (Number(notice.created_by) !== Number(user?.id)) {
      alert('You can delete only notices created by you.');
      return;
    }

    if (!window.confirm('Delete this notice?')) return;

    try {
      await api.delete(`/notices/${notice.id}`);
      fetchNotices();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete notice');
    }
  };

  const currentSubjects = subjectsByGroup[formData.group_id] || [];

  const formatAudience = (notice) => {
    if (notice.audience_type === 'all') return 'All Campus';
    if (notice.audience_type === 'faculty') return 'Faculty Only';
    if (notice.audience_type === 'students') return 'Students Only';

    if (notice.section_name || notice.semester || notice.course_name) {
      return `${notice.course_name || ''} ${notice.semester || ''} ${
        notice.section_name || ''
      }`.trim();
    }

    return 'Specific Section';
  };

  const getAudienceBadgeClass = (audienceType) => {
    if (audienceType === 'all') return 'bg-indigo-100 text-indigo-600';
    if (audienceType === 'faculty') return 'bg-violet-100 text-violet-600';
    if (audienceType === 'students') return 'bg-blue-100 text-blue-600';
    return 'bg-emerald-100 text-emerald-600';
  };

  const getNoticeDate = (notice) => {
    const rawDate = notice.publish_date || notice.created_at;

    if (!rawDate) return 'Not set';

    return String(rawDate).split('T')[0];
  };

  const filteredNotices = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return notices.filter((notice) => {
      const searchableText = `
        ${notice.title || ''}
        ${notice.message || ''}
        ${notice.audience_type || ''}
        ${formatAudience(notice)}
        ${notice.subject_name || ''}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }, [notices, searchTerm]);

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Faculty Notices"
      subtitle="View campus/faculty notices and create notices for assigned students."
    >
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Notices</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              All campus and faculty-only notices are visible here. You can also manage notices created by you.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Create Notice
          </button>
        </div>
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

          <div className="relative w-full xl:w-96">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search notices..."
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
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNotices.map((notice) => {
          const ownNotice = Number(notice.created_by) === Number(user?.id);

          return (
            <div
              key={notice.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Bell size={24} />
                </div>

                <span
                  className={`px-3 py-2 rounded-2xl text-xs font-black uppercase ${getAudienceBadgeClass(
                    notice.audience_type
                  )}`}
                >
                  {formatAudience(notice)}
                </span>
              </div>

              <h3 className="text-lg font-black text-slate-800">
                {notice.title}
              </h3>

              <p className="text-sm text-slate-500 mt-3 leading-6">
                {notice.message}
              </p>

              <div className="mt-5 space-y-2 text-sm text-slate-500">
                <p>
                  <span className="font-bold text-slate-700">Audience:</span>{' '}
                  {formatAudience(notice)}
                </p>

                <p>
                  <span className="font-bold text-slate-700">Subject:</span>{' '}
                  {notice.subject_name || 'All Subjects'}
                </p>

                <p>
                  <span className="font-bold text-slate-700">Publish Date:</span>{' '}
                  {getNoticeDate(notice)}
                </p>

                <p>
                  <span className="font-bold text-slate-700">Created By:</span>{' '}
                  {ownNotice ? 'You' : notice.created_by_name || 'Admin'}
                </p>
              </div>

              {ownNotice && (
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(notice)}
                    className="w-10 h-10 rounded-2xl bg-slate-50 border text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(notice)}
                    className="w-10 h-10 rounded-2xl bg-slate-50 border text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center text-slate-500 font-medium">
            No notices found.
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {editingNotice ? 'Edit Notice' : 'Create Notice'}
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                  Faculty can create notices for students in assigned sections.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-2xl bg-slate-50 border text-slate-500 hover:text-slate-700 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Notice Title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <textarea
                name="message"
                placeholder="Notice Message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <select
                name="audience_type"
                value={formData.audience_type}
                onChange={handleChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="group">Specific Section</option>
                <option value="students">All Students</option>
              </select>

              {formData.audience_type === 'group' && (
                <>
                  <select
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Section</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.course_name} - {g.semester} - {g.section_name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleChange}
                    disabled={!formData.group_id}
                    className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="">All Subjects</option>
                    {currentSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject_name}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <input
                type="date"
                name="publish_date"
                value={formData.publish_date}
                onChange={handleChange}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 rounded-2xl bg-slate-50 border text-slate-700 font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  {editingNotice ? 'Save Changes' : 'Create Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FacultyLayout>
  );
};

export default FacultyNoticePage;