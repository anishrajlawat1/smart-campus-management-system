import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Users, BookOpen, Layers3 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import api from '../../api';

const FacultySubjectAssignment = () => {
  const [faculty, setFaculty] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const fetchData = async () => {
    try {
      const usersRes = await api.get('/users');
      const userList = Array.isArray(usersRes.data)
        ? usersRes.data
        : usersRes.data.users || [];

      setFaculty(userList.filter((u) => u.role === 'faculty'));

      const groupsRes = await api.get('/student-attendance/groups');
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : []);

      const groupSubjectsRes = await api.get('/student-attendance/group-subjects');
      setGroupSubjects(
        Array.isArray(groupSubjectsRes.data) ? groupSubjectsRes.data : []
      );

      const assignmentsRes = await api.get('/student-attendance/faculty-subjects');
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const courses = [...new Set(groups.map((g) => g.course_name).filter(Boolean))];

  const filteredGroups = selectedCourse
    ? groups.filter((g) => g.course_name === selectedCourse)
    : [];

  const filteredSubjects = selectedGroup
    ? groupSubjects.filter((gs) => String(gs.group_id) === String(selectedGroup))
    : [];

  const handleAssign = async (e) => {
    e.preventDefault();

    if (!selectedFaculty || !selectedGroup || !selectedSubject) {
      alert('Select faculty, course, section and subject');
      return;
    }

    try {
      await api.post('/student-attendance/faculty-subjects', {
        faculty_id: Number(selectedFaculty),
        subject_id: Number(selectedSubject),
        group_id: Number(selectedGroup),
      });

      setSelectedFaculty('');
      setSelectedCourse('');
      setSelectedGroup('');
      setSelectedSubject('');

      await fetchData();

      alert('Faculty assigned successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this faculty assignment?')) return;

    try {
      await api.delete(`/student-attendance/faculty-subjects/${id}`);
      await fetchData();
      alert('Assignment removed successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Delete failed');
    }
  };

  const summaryCards = [
    {
      label: 'Faculty',
      value: faculty.length,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
    {
      label: 'Subjects',
      value: groupSubjects.length,
      icon: BookOpen,
      color: 'text-violet-600',
      bg: 'bg-violet-100',
    },
    {
      label: 'Assignments',
      value: assignments.length,
      icon: Layers3,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Faculty Subject Assignment"
      subtitle="Assign faculty members to section-based subjects."
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

            <h3 className="text-3xl font-black text-slate-800 mt-1">
              {card.value}
            </h3>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm mb-8">
        <h2 className="text-xl font-black text-slate-800 mb-2">
          Assign Faculty
        </h2>

        <p className="text-sm text-slate-500 font-medium mb-5">
          Choose course, section, subject and faculty to create a teaching assignment.
        </p>

        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedGroup('');
              setSelectedSubject('');
            }}
            className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setSelectedSubject('');
            }}
            className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!selectedCourse}
            required
          >
            <option value="">Select Section</option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.semester} - {g.section_name}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!selectedGroup}
            required
          >
            <option value="">Select Subject</option>
            {filteredSubjects.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>
                {s.subject_name}
              </option>
            ))}
          </select>

          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Faculty</option>
            {faculty.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="md:col-span-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Assign Faculty
          </button>
        </form>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800">
            Faculty Assignments
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Existing faculty-subject-section assignments.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Faculty
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Subject
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase">
                  Section
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {a.faculty_name}
                    <p className="text-xs text-slate-400 font-medium">
                      {a.faculty_email}
                    </p>
                  </td>

                  <td className="px-6 py-4 text-slate-700 font-semibold">
                    {a.subject_name}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {a.course_name}
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-2 rounded-xl bg-indigo-100 text-indigo-600 font-bold">
                      {a.semester} - {a.section_name}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}

              {assignments.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-slate-500 font-medium"
                  >
                    No faculty assignments found.
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

export default FacultySubjectAssignment;