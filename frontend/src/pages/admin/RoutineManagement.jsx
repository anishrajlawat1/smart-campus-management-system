import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const RoutineManagement = () => {
  const [routines, setRoutines] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');

  const emptyForm = {
    group_id: '',
    subject_id: '',
    faculty_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    room: '',
    class_type: 'Lecture',
    block: '',
    module_code: '',
  };

  const [form, setForm] = useState(emptyForm);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const fetchData = async () => {
    try {
      const routineRes = await api.get('/routines');
      setRoutines(Array.isArray(routineRes.data) ? routineRes.data : []);

      const groupRes = await api.get('/student-attendance/groups');
      const groupData = Array.isArray(groupRes.data) ? groupRes.data : [];
      setGroups(groupData);

      if (!selectedSection && groupData.length > 0) {
        setSelectedSection(String(groupData[0].id));
      }

      const subjectRes = await api.get('/student-attendance/group-subjects');
      setSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : []);

      const usersRes = await api.get('/users');
      const users = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.users || [];
      setFaculty(users.filter((u) => u.role === 'faculty'));

      const assignRes = await api.get('/student-attendance/faculty-subjects');
      setFacultyAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load routine data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedGroup = groups.find(
    (g) => String(g.id) === String(selectedSection)
  );

  const selectedSectionRoutines = routines.filter(
    (r) => String(r.group_id) === String(selectedSection)
  );

  const sortedSectionRoutines = [...selectedSectionRoutines].sort((a, b) => {
    const dayA = days.indexOf(a.day_of_week);
    const dayB = days.indexOf(b.day_of_week);
    if (dayA !== dayB) return dayA - dayB;
    return String(a.start_time).localeCompare(String(b.start_time));
  });

  const sectionSubjects = form.group_id
    ? subjects.filter((s) => String(s.group_id) === String(form.group_id))
    : [];

  const assignedFacultyForSubject =
    form.group_id && form.subject_id
      ? facultyAssignments.filter(
          (a) =>
            String(a.group_id) === String(form.group_id) &&
            String(a.subject_id) === String(form.subject_id)
        )
      : [];

  const resetForm = () => {
    setForm(emptyForm);
    setEditingRoutine(null);
  };

  const getDuration = (start, end) => {
    if (!start || !end) return '-';

    const [sh, sm] = start.slice(0, 5).split(':').map(Number);
    const [eh, em] = end.slice(0, 5).split(':').map(Number);

    const duration = eh * 60 + em - (sh * 60 + sm);
    if (duration <= 0) return '-';

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    return minutes === 0
      ? `${hours}:00`
      : `${hours}:${String(minutes).padStart(2, '0')}`;
  };

  const getSubjectName = (subjectId) => {
    const subject =
      subjects.find((s) => String(s.subject_id) === String(subjectId)) ||
      subjects.find((s) => String(s.id) === String(subjectId));

    return subject?.subject_name || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedSubjectName = getSubjectName(form.subject_id);

      const payload = {
        group_id: Number(form.group_id),
        subject_id: Number(form.subject_id),
        faculty_id: Number(form.faculty_id),
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room,
        class_type: form.class_type,
        block: form.block || '-',
        module_code:
          form.module_code || selectedSubjectName.substring(0, 6).toUpperCase(),
      };

      if (editingRoutine) {
        await api.put(`/routines/${editingRoutine.id}`, payload);
        alert('Routine updated successfully');
      } else {
        await api.post('/routines', payload);
        alert('Routine created successfully');
      }

      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save routine');
    }
  };

  const handleGenerateRoutine = async () => {
    if (!selectedSection) {
      alert('Please select a section first');
      return;
    }

    try {
      const res = await api.post('/routines/generate', {
        group_id: selectedSection,
      });

      alert(res.data.message || 'Routine generated successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate routine');
    }
  };

  const handleEdit = (routine) => {
    setEditingRoutine(routine);

    setForm({
      group_id: String(routine.group_id),
      subject_id: String(routine.subject_id),
      faculty_id: String(routine.faculty_id),
      day_of_week: routine.day_of_week,
      start_time: routine.start_time?.slice(0, 5) || '',
      end_time: routine.end_time?.slice(0, 5) || '',
      room: routine.room || '',
      class_type: routine.class_type || 'Lecture',
      block: routine.block || '',
      module_code: routine.module_code || '',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this routine?')) return;

    try {
      await api.delete(`/routines/${id}`);
      fetchData();
    } catch {
      alert('Failed to delete routine');
    }
  };

  const summaryCards = [
    {
      label: 'Total Routines',
      value: routines.length,
      icon: CalendarDays,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Sections',
      value: groups.length,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Assigned Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Class Routine Management"
      subtitle="Create, edit, auto-generate, and view section-wise class schedules."
    >
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div
              className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-5`}
            >
              <card.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold">{card.label}</p>
            <h3 className="text-3xl font-black text-slate-800">{card.value}</h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {editingRoutine ? 'Edit Routine' : 'Create Routine'}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Select section first. Subjects and lecturers are filtered by admin assignment.
            </p>
          </div>

          {editingRoutine && (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-bold flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <select
            value={form.group_id}
            onChange={(e) =>
              setForm({
                ...form,
                group_id: e.target.value,
                subject_id: '',
                faculty_id: '',
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
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
            value={form.subject_id}
            onChange={(e) =>
              setForm({
                ...form,
                subject_id: e.target.value,
                faculty_id: '',
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!form.group_id}
            required
          >
            <option value="">Select Section Subject</option>
            {sectionSubjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          <select
            value={form.faculty_id}
            onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!form.subject_id}
            required
          >
            <option value="">Select Assigned Lecturer</option>
            {assignedFacultyForSubject.map((a) => (
              <option key={a.id} value={a.faculty_id}>
                {a.faculty_name}
              </option>
            ))}
          </select>

          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="text"
            placeholder="Room e.g. LT-02"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="text"
            placeholder="Block e.g. WLV / ING"
            value={form.block}
            onChange={(e) => setForm({ ...form, block: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="text"
            placeholder="Module Code e.g. 6CS030"
            value={form.module_code}
            onChange={(e) => setForm({ ...form, module_code: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={form.class_type}
            onChange={(e) => setForm({ ...form, class_type: e.target.value })}
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Lecture">Lecture</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Workshop">Workshop</option>
            <option value="Practical">Practical</option>
          </select>

          <button
            type="submit"
            className="md:col-span-2 px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            {editingRoutine ? <Pencil size={18} /> : <Plus size={18} />}
            {editingRoutine ? 'Update Routine' : 'Add Routine'}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Section Wise Routine
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Auto-generation uses section subjects and faculty assignments with clash detection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium min-w-65"
            >
              <option value="">Select Section</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.course_name} - {g.semester} - {g.section_name}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateRoutine}
              className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Auto Generate
            </button>
          </div>
        </div>

        <div className="px-6 pt-6">
          <div className="bg-green-700 text-white text-center py-4 rounded-t-2xl">
            <h3 className="text-lg font-black">
              {selectedGroup ? selectedGroup.course_name : 'Class Routine'}
            </h3>
            <p className="text-sm font-semibold">
              Smart Campus Management System
            </p>
            <p className="text-sm font-bold">
              Schedule: {selectedGroup?.semester || '-'}{' '}
              {selectedGroup?.section_name || ''}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full min-w-300 border border-slate-300">
            <thead>
              <tr className="bg-blue-700 text-white">
                {[
                  'Day',
                  'Time',
                  'Hours',
                  'Group',
                  'Room',
                  'Block',
                  'Module Code',
                  'Module Title',
                  'Lecturer',
                  'Class Type',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-sm border border-blue-900"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedSectionRoutines.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 border border-slate-300 font-semibold">
                    {String(r.day_of_week).slice(0, 3).toUpperCase()}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {getDuration(r.start_time, r.end_time)}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.section_name}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.room}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.block || '-'}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.module_code || '-'}
                  </td>
                  <td className="px-3 py-3 border border-slate-300 font-semibold">
                    {r.subject_name}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.faculty_name}
                  </td>
                  <td className="px-3 py-3 border border-slate-300">
                    {r.class_type || 'Lecture'}
                  </td>
                  <td className="px-3 py-3 border border-slate-300 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(r)}
                        className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 inline-flex items-center justify-center"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 inline-flex items-center justify-center"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {sortedSectionRoutines.length === 0 && (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-10 text-slate-500 border border-slate-300"
                  >
                    No routine found for this section.
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

export default RoutineManagement;