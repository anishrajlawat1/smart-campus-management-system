import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock,
  DoorOpen,
  Users,
  ShieldCheck,
  Download,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import FacultyLayout from './FacultyLayout';
import api from '../../api';

const FacultyExamInvigilationPage = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [students, setStudents] = useState([]);

  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [savingSeatingId, setSavingSeatingId] = useState(null);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/exams/faculty/my-rooms');
      setRooms(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load invigilation rooms');
      setRooms([]);
    }
  };

  const fetchStudents = async (room) => {
    setSelectedRoom(room);
    setStudentSearch('');
    setStatusFilter('all');

    try {
      const res = await api.get(`/exams/faculty/rooms/${room.room_id}/students`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load room students');
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const updateAttendance = async (seatingId, attendance_status) => {
    if (!attendance_status) return;

    setSavingSeatingId(seatingId);

    try {
      await api.patch(`/exams/seating/${seatingId}/attendance`, {
        attendance_status,
      });

      if (selectedRoom) {
        await fetchStudents(selectedRoom);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSavingSeatingId(null);
    }
  };

  const presentCount = students.filter(
    (student) => student.attendance_status === 'present'
  ).length;

  const absentCount = students.filter(
    (student) => student.attendance_status !== 'present'
  ).length;

  const filteredStudents = useMemo(() => {
    const query = studentSearch.toLowerCase().trim();

    return students.filter((student) => {
      const status = student.attendance_status || 'absent';

      const searchableText = `
        ${student.student_name || ''}
        ${student.student_email || ''}
        ${student.seat_number || ''}
        ${student.course_name || ''}
        ${student.semester || ''}
        ${student.section_name || ''}
      `.toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [students, studentSearch, statusFilter]);

  const getStatusBadgeClass = (status) => {
    if (status === 'present') return 'bg-emerald-100 text-emerald-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getDropdownClass = (status) => {
    if (status === 'present') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500';
    }

    return 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500';
  };

  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  };

  const makeCell = (text, options = {}) =>
    new TableCell({
      width: options.width
        ? {
            size: options.width,
            type: WidthType.PERCENTAGE,
          }
        : undefined,
      margins: {
        top: 120,
        bottom: 120,
        left: 120,
        right: 120,
      },
      children: [
        new Paragraph({
          alignment: options.align || AlignmentType.LEFT,
          children: [
            new TextRun({
              text: String(text || ''),
              bold: options.bold || false,
              size: options.size || 18,
            }),
          ],
        }),
      ],
    });

  const exportManualSheet = async () => {
    if (!selectedRoom || students.length === 0) {
      alert('Select a room with students first');
      return;
    }

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('S.N.', {
            bold: true,
            width: 6,
            align: AlignmentType.CENTER,
          }),
          makeCell('Seat No.', {
            bold: true,
            width: 9,
            align: AlignmentType.CENTER,
          }),
          makeCell('Student Name', { bold: true, width: 22 }),
          makeCell('Student ID', { bold: true, width: 12 }),
          makeCell('Course / Level / Section', { bold: true, width: 22 }),
          makeCell('Signature', {
            bold: true,
            width: 18,
            align: AlignmentType.CENTER,
          }),
          makeCell('Remarks', {
            bold: true,
            width: 11,
            align: AlignmentType.CENTER,
          }),
        ],
      }),

      ...students.map(
        (student, index) =>
          new TableRow({
            children: [
              makeCell(String(index + 1), {
                align: AlignmentType.CENTER,
              }),
              makeCell(String(student.seat_number), {
                align: AlignmentType.CENTER,
              }),
              makeCell(student.student_name || ''),
              makeCell(String(student.student_id || '')),
              makeCell(
                `${student.course_name || ''} / ${student.semester || ''} / ${
                  student.section_name || ''
                }`
              ),
              makeCell(''),
              makeCell(''),
            ],
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              heading: HeadingLevel.TITLE,
              children: [
                new TextRun({
                  text: 'SmartCampus Management System',
                  bold: true,
                  size: 30,
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Exam Attendance Sheet',
                  bold: true,
                  size: 26,
                }),
              ],
              spacing: {
                after: 300,
              },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: tableBorders,
              rows: [
                new TableRow({
                  children: [
                    makeCell('Exam Name', { bold: true, width: 20 }),
                    makeCell(selectedRoom.exam_name || '', { width: 30 }),
                    makeCell('Subject', { bold: true, width: 20 }),
                    makeCell(selectedRoom.subject_name || '', { width: 30 }),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Date', { bold: true }),
                    makeCell(selectedRoom.exam_date || ''),
                    makeCell('Time', { bold: true }),
                    makeCell(
                      `${selectedRoom.start_time?.slice(0, 5) || ''} - ${
                        selectedRoom.end_time?.slice(0, 5) || ''
                      }`
                    ),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Room', { bold: true }),
                    makeCell(selectedRoom.room_name || ''),
                    makeCell('Total Students', { bold: true }),
                    makeCell(String(students.length)),
                  ],
                }),
              ],
            }),

            new Paragraph({
              text: '',
              spacing: {
                after: 250,
              },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: tableBorders,
              rows,
            }),

            new Paragraph({
              text: '',
              spacing: {
                after: 400,
              },
            }),

            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              borders: tableBorders,
              rows: [
                new TableRow({
                  children: [
                    makeCell('Invigilator Name', {
                      bold: true,
                      width: 25,
                    }),
                    makeCell('', { width: 25 }),
                    makeCell('Signature', { bold: true, width: 25 }),
                    makeCell('', { width: 25 }),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Submission Time', { bold: true }),
                    makeCell(''),
                    makeCell('Checked By', { bold: true }),
                    makeCell(''),
                  ],
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: {
                before: 300,
              },
              children: [
                new TextRun({
                  text: 'Generated by SmartCampus Management System',
                  italics: true,
                  size: 18,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);

    saveAs(
      blob,
      `${selectedRoom.exam_name || 'exam'}_${
        selectedRoom.room_name || 'room'
      }_attendance_sheet.docx`
    );
  };

  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Exam Invigilation"
      subtitle="View assigned exam rooms, search students, and update attendance using dropdowns."
    >
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5">
            <ShieldCheck size={24} />
          </div>

          <p className="text-slate-500 text-sm font-bold">Assigned Rooms</p>

          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {rooms.length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5">
            <Users size={24} />
          </div>

          <p className="text-slate-500 text-sm font-bold">Room Students</p>

          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {students.length}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5">
            <CheckCircle2 size={24} />
          </div>

          <p className="text-slate-500 text-sm font-bold">Present</p>

          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {presentCount}
          </h3>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-5">
            <XCircle size={24} />
          </div>

          <p className="text-slate-500 text-sm font-bold">Absent</p>

          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {absentCount}
          </h3>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-black text-slate-800">
                My Invigilation Rooms
              </h2>

              <p className="text-sm text-slate-500 font-medium mt-1">
                Select a room to view assigned students.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRooms}
              className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <button
                  key={room.room_id}
                  type="button"
                  onClick={() => fetchStudents(room)}
                  className={`w-full text-left p-4 rounded-2xl border transition ${
                    selectedRoom?.room_id === room.room_id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-200'
                  }`}
                >
                  <h3 className="font-black">{room.room_name}</h3>

                  <p
                    className={`text-sm font-medium mt-1 ${
                      selectedRoom?.room_id === room.room_id
                        ? 'text-indigo-100'
                        : 'text-slate-500'
                    }`}
                  >
                    {room.exam_name}
                  </p>

                  <p
                    className={`text-xs font-semibold mt-2 ${
                      selectedRoom?.room_id === room.room_id
                        ? 'text-indigo-100'
                        : 'text-slate-400'
                    }`}
                  >
                    {room.exam_date} • {room.start_time?.slice(0, 5)} -{' '}
                    {room.end_time?.slice(0, 5)}
                  </p>
                </button>
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

        <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {selectedRoom ? selectedRoom.room_name : 'Room Students'}
                </h2>

                {selectedRoom && (
                  <div className="text-sm text-slate-500 font-medium mt-2 space-y-1">
                    <p className="flex items-center gap-2">
                      <DoorOpen size={16} />
                      {selectedRoom.exam_name} - {selectedRoom.subject_name}
                    </p>

                    <p className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      {selectedRoom.exam_date}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock size={16} />
                      {selectedRoom.start_time?.slice(0, 5)} -{' '}
                      {selectedRoom.end_time?.slice(0, 5)}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={exportManualSheet}
                disabled={!selectedRoom || students.length === 0}
                className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download size={18} />
                Export DOCX Sheet
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search student, email, seat..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="all">All Status</option>
                <option value="present">Present Only</option>
                <option value="absent">Absent Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredStudents.length > 0 ? (
              <table className="w-full min-w-250">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Seat
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Current Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-black">
                      Update
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const status = student.attendance_status || 'absent';

                    return (
                      <tr
                        key={student.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-black text-slate-800">
                          {student.seat_number}
                        </td>

                        <td className="px-4 py-3 font-bold text-slate-800">
                          {student.student_name}
                        </td>

                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {student.student_email}
                        </td>

                        <td className="px-4 py-3 text-slate-500 font-medium">
                          {student.course_name} / {student.semester} /{' '}
                          {student.section_name}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-3 py-2 rounded-2xl text-xs font-black uppercase ${getStatusBadgeClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={status}
                            disabled={savingSeatingId === student.id}
                            onChange={(e) =>
                              updateAttendance(student.id, e.target.value)
                            }
                            className={`px-4 py-3 rounded-2xl border outline-none focus:ring-2 font-bold min-w-36 ${getDropdownClass(
                              status
                            )}`}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>

                          {savingSeatingId === student.id && (
                            <span className="ml-3 text-xs text-slate-400 font-bold">
                              Saving...
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center">
                <Users size={34} className="mx-auto text-slate-300" />

                <h3 className="text-xl font-black text-slate-800 mt-4">
                  No students shown.
                </h3>

                <p className="text-slate-500 font-medium mt-2">
                  Select an assigned room or adjust search/status filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </FacultyLayout>
  );
};

export default FacultyExamInvigilationPage;