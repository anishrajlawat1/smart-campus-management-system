import React, { useEffect, useState } from 'react';
import {
  Plus,
  Users,
  Layers3,
  Trash2,
  UserPlus,
  Search,
  RefreshCcw,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const StudentAssignmentPage = () => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [tableCourseFilter, setTableCourseFilter] = useState('');
  const [tableSectionFilter, setTableSectionFilter] = useState('');

  const [editingAssignment, setEditingAssignment] = useState(null);
  const [editCourse, setEditCourse] = useState('');
  const [editGroupId, setEditGroupId] = useState('');

  const [form, setForm] = useState({
    student_id: '',
    group_id: '',
  });

  const fetchData = async () => {
    try {
      const usersRes = await api.get('/users');
      const users = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.users || [];

      setStudents(users.filter((u) => u.role === 'student'));

      const groupsRes = await api.get('/student-attendance/groups');
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);
    } catch {
      alert('Failed to load data');
    }
  };

  const fetchAssignedStudents = async () => {
    try {
      const res = await api.get('/student-attendance/assigned-students');
      setAssignedStudents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAssignedStudents([]);
    }
  };

  useEffect(() => {
    fetchData();
    fetchAssignedStudents();
  }, []);

  const assignedStudentIds = assignedStudents.map((a) =>
    Number(a.student_id)
  );

  const unassignedStudents = students.filter(
    (s) => !assignedStudentIds.includes(Number(s.id))
  );

  const courses = [...new Set(groups.map((g) => g.course_name).filter(Boolean))];

  const filteredGroups = selectedCourse
    ? groups.filter((g) => g.course_name === selectedCourse)
    : [];

  const editFilteredGroups = editCourse
    ? groups.filter((g) => g.course_name === editCourse)
    : [];

  const tableFilteredSections = tableCourseFilter
    ? groups.filter((g) => g.course_name === tableCourseFilter)
    : groups;

  const filteredStudents = unassignedStudents.filter((s) => {
    const q = studentSearch.trim().toLowerCase();

    if (!q) return true;

    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  const filteredAssignedStudents = assignedStudents.filter((a) => {
    const courseMatch = tableCourseFilter
      ? a.course_name === tableCourseFilter
      : true;

    const sectionMatch = tableSectionFilter
      ? String(a.group_id) === String(tableSectionFilter)
      : true;

    return courseMatch && sectionMatch;
  });

  const selectedStudent = students.find(
    (s) => String(s.id) === String(form.student_id)
  );

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!form.student_id || !form.group_id) {
      alert('Select student and section');
      return;
    }

    try {
      await api.post('/student-attendance/assign-student', {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
      });

      setForm({
        student_id: '',
        group_id: '',
      });

      setStudentSearch('');
      setSelectedCourse('');

      await fetchAssignedStudents();

      alert('Student assigned to section successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign student');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this assignment?')) return;

    try {
      await api.delete(`/student-attendance/assigned-students/${id}`);
      await fetchAssignedStudents();
      alert('Assignment removed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove');
    }
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setEditCourse(assignment.course_name);
    setEditGroupId(String(assignment.group_id));
  };

  const closeEditModal = () => {
    setEditingAssignment(null);
    setEditCourse('');
    setEditGroupId('');
  };

  const handleChangeSection = async () => {
    if (!editingAssignment || !editGroupId) {
      alert('Select new section');
      return;
    }

    if (String(editingAssignment.group_id) === String(editGroupId)) {
      alert('Student is already in this section');
      return;
    }

    try {
      await api.delete(
        `/student-attendance/assigned-students/${editingAssignment.id}`
      );

      await api.post('/student-attendance/assign-student', {
        student_id: Number(editingAssignment.student_id),
        group_id: Number(editGroupId),
      });

      closeEditModal();
      await fetchAssignedStudents();

      alert('Student section changed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change section');
    }
  };

  const summaryCards = [
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Sections',
      value: groups.length,
      icon: Layers3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Assigned',
      value: assignedStudents.length,
      icon: UserPlus,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Unassigned',
      value: unassignedStudents.length,
      icon: Users,
      color: 'text-rose-600',
      bg: 'bg-rose-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Student Assignment"
      subtitle="Assign unassigned students, view assigned students, and change sections when needed."
    >
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
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

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {card.value}
            </h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-800">
            Assign Student to Section
          </h2>

          <p className="text-sm text-slate-500 font-medium mt-1">
            Browse or search only unassigned students, then select course and section.
          </p>
        </div>

        <form
          onSubmit={handleAssign}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={studentSearch}
              onChange={(e) => {
                setStudentSearch(e.target.value);
                setForm({ ...form, student_id: '' });
              }}
              onFocus={() => {
                if (!studentSearch) setStudentSearch(' ');
              }}
              placeholder={`Search or browse ${unassignedStudents.length} unassigned students`}
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              required={!form.student_id}
            />

            {studentSearch && !form.student_id && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {filteredStudents.length} unassigned student
                  {filteredStudents.length !== 1 ? 's' : ''} found
                </div>

                {filteredStudents
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 50)
                  .map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setForm({ ...form, student_id: s.id });
                        setStudentSearch(`${s.name} (${s.email})`);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 transition-all"
                    >
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <p className="text-sm text-slate-500">{s.email}</p>
                    </button>
                  ))}

                {filteredStudents.length === 0 && (
                  <div className="px-4 py-5 text-slate-500 font-medium text-center">
                    No unassigned students found.
                  </div>
                )}
              </div>
            )}
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setForm({ ...form, group_id: '' });
            }}
            required
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            value={form.group_id}
            onChange={(e) => setForm({ ...form, group_id: e.target.value })}
            required
            disabled={!selectedCourse}
            className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium disabled:opacity-60"
          >
            <option value="">Select Section</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.semester} - {g.section_name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!form.student_id || !form.group_id}
            className="px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Assign Student
          </button>
        </form>

        {selectedStudent && (
          <div className="mt-4 px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-bold">
            Selected Student: {selectedStudent.name} — {selectedStudent.email}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              Assigned Students
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              {filteredAssignedStudents.length} shown from{' '}
              {assignedStudents.length} total assignments
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={tableCourseFilter}
              onChange={(e) => {
                setTableCourseFilter(e.target.value);
                setTableSectionFilter('');
              }}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 min-w-55"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>

            <select
              value={tableSectionFilter}
              onChange={(e) => setTableSectionFilter(e.target.value)}
              disabled={!tableCourseFilter}
              className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 min-w-55 disabled:opacity-60"
            >
              <option value="">All Sections</option>
              {tableFilteredSections.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.semester} - {g.section_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-250">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Student
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Course
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Section
                </th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssignedStudents.map((a, index) => (
                <tr
                  key={a.id}
                  className={`border-t border-slate-100 hover:bg-slate-50 transition-all ${
                    index === 0 ? 'border-t-0' : ''
                  }`}
                >
                  <td className="px-6 py-5 font-bold text-slate-800">
                    {a.student_name}
                  </td>

                  <td className="px-6 py-5 text-slate-500 font-medium">
                    {a.student_email}
                  </td>

                  <td className="px-6 py-5 text-slate-700 font-semibold">
                    {a.course_name}
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-flex px-3 py-2 rounded-2xl bg-indigo-100 text-indigo-600 text-sm font-bold">
                      {a.semester} - {a.section_name}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(a)}
                        className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all inline-flex items-center justify-center"
                        title="Change section"
                      >
                        <RefreshCcw size={16} />
                      </button>

                      <button
                        onClick={() => handleRemove(a.id)}
                        className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center justify-center"
                        title="Remove assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignedStudents.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No student assignments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingAssignment && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-6">
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              Change Student Section
            </h2>

            <p className="text-slate-500 font-medium mb-6">
              Move{' '}
              <span className="font-bold text-slate-800">
                {editingAssignment.student_name}
              </span>{' '}
              to another section.
            </p>

            <div className="space-y-4">
              <select
                value={editCourse}
                onChange={(e) => {
                  setEditCourse(e.target.value);
                  setEditGroupId('');
                }}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>

              <select
                value={editGroupId}
                onChange={(e) => setEditGroupId(e.target.value)}
                disabled={!editCourse}
                className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="">Select New Section</option>
                {editFilteredGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.semester} - {g.section_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={handleChangeSection}
                disabled={!editGroupId}
                className="px-5 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Change
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default StudentAssignmentPage;