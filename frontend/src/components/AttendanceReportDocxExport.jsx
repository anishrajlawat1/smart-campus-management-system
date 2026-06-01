import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  FileText,
  RefreshCw,
  Search,
  BookOpen,
  Users,
  CalendarDays,
  AlertTriangle,
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
import api from '../api';

const AttendanceReportDocxExport = ({ role = 'faculty' }) => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
      return {};
    }
  }, []);

  const [groups, setGroups] = useState([]);
  const [groupSubjects, setGroupSubjects] = useState([]);
  const [reportRows, setReportRows] = useState([]);

  const [filters, setFilters] = useState({
    group_id: '',
    subject_id: '',
    date_from: '',
    date_to: '',
  });

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const loadOptions = async () => {
    setLoadingOptions(true);

    try {
      if (role === 'faculty') {
        const res = await api.get('/student-attendance/faculty-subjects', {
          params: {
            faculty_id: user?.id,
          },
        });

        const rows = Array.isArray(res.data) ? res.data : [];

        const uniqueGroups = [];
        const seenGroups = new Set();

        rows.forEach((item) => {
          const groupId = item.group_id;

          if (!groupId || seenGroups.has(String(groupId))) return;

          seenGroups.add(String(groupId));

          uniqueGroups.push({
            id: groupId,
            course_name: item.course_name,
            semester: item.semester,
            section_name: item.section_name,
          });
        });

        const uniqueGroupSubjects = [];
        const seenSubjects = new Set();

        rows.forEach((item) => {
          const key = `${item.group_id}-${item.subject_id}`;

          if (!item.group_id || !item.subject_id || seenSubjects.has(key)) {
            return;
          }

          seenSubjects.add(key);

          uniqueGroupSubjects.push({
            group_id: item.group_id,
            subject_id: item.subject_id,
            subject_name: item.subject_name,
            course_name: item.course_name,
            semester: item.semester,
            section_name: item.section_name,
          });
        });

        setGroups(uniqueGroups);
        setGroupSubjects(uniqueGroupSubjects);
      } else {
        const [groupRes, subjectRes] = await Promise.all([
          api.get('/student-attendance/groups'),
          api.get('/student-attendance/group-subjects'),
        ]);

        setGroups(Array.isArray(groupRes.data) ? groupRes.data : []);
        setGroupSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : []);
      }
    } catch (error) {
      console.error('Load attendance report options error:', error);
      alert(error.response?.data?.message || 'Failed to load report options');
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!filters.group_id) return [];

    return groupSubjects.filter(
      (item) => String(item.group_id) === String(filters.group_id)
    );
  }, [groupSubjects, filters.group_id]);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => String(group.id) === String(filters.group_id));
  }, [groups, filters.group_id]);

  const selectedSubject = useMemo(() => {
    return groupSubjects.find(
      (subject) =>
        String(subject.group_id) === String(filters.group_id) &&
        String(subject.subject_id) === String(filters.subject_id)
    );
  }, [groupSubjects, filters.group_id, filters.subject_id]);

  const fetchReport = async (e) => {
    e?.preventDefault();

    if (
      !filters.group_id ||
      !filters.subject_id ||
      !filters.date_from ||
      !filters.date_to
    ) {
      alert('Please select section, subject, start date, and end date');
      return;
    }

    if (filters.date_from > filters.date_to) {
      alert('Start date cannot be after end date');
      return;
    }

    setLoadingReport(true);

    try {
      const res = await api.get('/student-attendance/reports/attendance', {
        params: {
          group_id: filters.group_id,
          subject_id: filters.subject_id,
          date_from: filters.date_from,
          date_to: filters.date_to,
        },
      });

      setReportRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Fetch attendance report error:', error);
      alert(error.response?.data?.message || 'Failed to generate report');
      setReportRows([]);
    } finally {
      setLoadingReport(false);
    }
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
              text: String(text ?? ''),
              bold: options.bold || false,
              size: options.size || 18,
            }),
          ],
        }),
      ],
    });

  const exportDocx = async () => {
    if (reportRows.length === 0) {
      alert('Generate a report first');
      return;
    }

    const courseText = selectedGroup?.course_name || '';
    const levelText = selectedGroup?.semester || '';
    const sectionText = selectedGroup?.section_name || '';
    const subjectText = selectedSubject?.subject_name || '';

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('S.N.', {
            bold: true,
            width: 6,
            align: AlignmentType.CENTER,
          }),
          makeCell('Student Name', { bold: true, width: 24 }),
          makeCell('Email', { bold: true, width: 22 }),
          makeCell('Present', {
            bold: true,
            width: 10,
            align: AlignmentType.CENTER,
          }),
          makeCell('Late', {
            bold: true,
            width: 8,
            align: AlignmentType.CENTER,
          }),
          makeCell('Absent', {
            bold: true,
            width: 10,
            align: AlignmentType.CENTER,
          }),
          makeCell('Percentage', {
            bold: true,
            width: 12,
            align: AlignmentType.CENTER,
          }),
          makeCell('Remarks', {
            bold: true,
            width: 18,
            align: AlignmentType.CENTER,
          }),
        ],
      }),

      ...reportRows.map(
        (student, index) =>
          new TableRow({
            children: [
              makeCell(index + 1, { align: AlignmentType.CENTER }),
              makeCell(student.student_name || ''),
              makeCell(student.student_email || ''),
              makeCell(student.present_count || 0, {
                align: AlignmentType.CENTER,
              }),
              makeCell(student.late_count || 0, {
                align: AlignmentType.CENTER,
              }),
              makeCell(student.absent_count || 0, {
                align: AlignmentType.CENTER,
              }),
              makeCell(`${student.attendance_percentage || 0}%`, {
                align: AlignmentType.CENTER,
              }),
              makeCell(
                Number(student.attendance_percentage || 0) < 75
                  ? 'Below 75%'
                  : ''
              ),
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
              spacing: {
                after: 300,
              },
              children: [
                new TextRun({
                  text: 'Attendance Report',
                  bold: true,
                  size: 26,
                }),
              ],
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
                    makeCell('Course', { bold: true, width: 20 }),
                    makeCell(courseText, { width: 30 }),
                    makeCell('Level', { bold: true, width: 20 }),
                    makeCell(levelText, { width: 30 }),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Section', { bold: true }),
                    makeCell(sectionText),
                    makeCell('Subject', { bold: true }),
                    makeCell(subjectText),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Date From', { bold: true }),
                    makeCell(filters.date_from),
                    makeCell('Date To', { bold: true }),
                    makeCell(filters.date_to),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Generated By', { bold: true }),
                    makeCell(user?.name || role),
                    makeCell('Total Students', { bold: true }),
                    makeCell(reportRows.length),
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
                after: 350,
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
                    makeCell('Prepared By', { bold: true, width: 25 }),
                    makeCell('', { width: 25 }),
                    makeCell('Signature', { bold: true, width: 25 }),
                    makeCell('', { width: 25 }),
                  ],
                }),
                new TableRow({
                  children: [
                    makeCell('Checked By', { bold: true }),
                    makeCell(''),
                    makeCell('Date', { bold: true }),
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

    const fileName = `${courseText}_${levelText}_${sectionText}_${subjectText}_attendance_report.docx`
      .replaceAll(' ', '_')
      .replaceAll('/', '-');

    saveAs(blob, fileName);
  };

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              Attendance Report Export
            </h2>

            <p className="text-slate-500 font-medium mt-1">
              Generate a printable DOCX report by course, level, section,
              subject, and date range.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOptions}
            disabled={loadingOptions}
            className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={18} />
            {loadingOptions ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <form
          onSubmit={fetchReport}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4"
        >
          <select
            value={filters.group_id}
            onChange={(e) =>
              setFilters({
                ...filters,
                group_id: e.target.value,
                subject_id: '',
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="">Select Section</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.course_name} - {group.semester} - {group.section_name}
              </option>
            ))}
          </select>

          <select
            value={filters.subject_id}
            onChange={(e) =>
              setFilters({
                ...filters,
                subject_id: e.target.value,
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={!filters.group_id}
            required
          >
            <option value="">Select Subject</option>
            {filteredSubjects.map((subject) => (
              <option
                key={`${subject.group_id}-${subject.subject_id}`}
                value={subject.subject_id}
              >
                {subject.subject_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) =>
              setFilters({
                ...filters,
                date_from: e.target.value,
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) =>
              setFilters({
                ...filters,
                date_to: e.target.value,
              })
            }
            className="px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />

          <button
            type="submit"
            disabled={loadingReport}
            className="px-5 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Search size={18} />
            {loadingReport ? 'Generating...' : 'Generate'}
          </button>
        </form>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
            <Users size={22} />
          </div>

          <p className="text-sm text-slate-500 font-bold">Students</p>

          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {reportRows.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <BookOpen size={22} />
          </div>

          <p className="text-sm text-slate-500 font-bold">Subject</p>

          <h3 className="text-lg font-black text-slate-800 mt-1 line-clamp-1">
            {selectedSubject?.subject_name || 'Not selected'}
          </h3>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
            <CalendarDays size={22} />
          </div>

          <p className="text-sm text-slate-500 font-bold">Date Range</p>

          <h3 className="text-sm font-black text-slate-800 mt-2">
            {filters.date_from && filters.date_to
              ? `${filters.date_from} to ${filters.date_to}`
              : 'Not selected'}
          </h3>
        </div>

        <button
          type="button"
          onClick={exportDocx}
          disabled={reportRows.length === 0}
          className="bg-emerald-600 text-white rounded-3xl p-5 shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-start justify-center"
        >
          <Download size={25} className="mb-4" />

          <p className="font-black text-lg">Export DOCX</p>

          <p className="text-sm text-emerald-100 font-medium mt-1">
            Printable attendance report
          </p>
        </button>
      </section>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText size={22} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800">
              Generated Report Preview
            </h2>

            <p className="text-sm text-slate-500 font-medium mt-1">
              Review the report before exporting it as DOCX.
            </p>
          </div>
        </div>

        {reportRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Student
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Email
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Total
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Present
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Late
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Absent
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    %
                  </th>
                  <th className="p-4 text-left text-xs font-black uppercase text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {reportRows.map((student) => {
                  const percentage = Number(student.attendance_percentage || 0);

                  return (
                    <tr
                      key={student.student_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-4 font-bold text-slate-800">
                        {student.student_name}
                      </td>

                      <td className="p-4 text-slate-500 font-medium">
                        {student.student_email}
                      </td>

                      <td className="p-4 text-slate-600 font-bold">
                        {student.total_classes || 0}
                      </td>

                      <td className="p-4 text-emerald-600 font-bold">
                        {student.present_count || 0}
                      </td>

                      <td className="p-4 text-amber-600 font-bold">
                        {student.late_count || 0}
                      </td>

                      <td className="p-4 text-rose-600 font-bold">
                        {student.absent_count || 0}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black ${
                            percentage >= 75
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-rose-100 text-rose-600'
                          }`}
                        >
                          {percentage}%
                        </span>
                      </td>

                      <td className="p-4">
                        {percentage < 75 ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-black">
                            <AlertTriangle size={13} />
                            Below 75%
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-xs font-black">
                            Safe
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <FileText size={36} className="mx-auto text-slate-300" />

            <h3 className="text-xl font-black text-slate-800 mt-4">
              No report generated yet.
            </h3>

            <p className="text-slate-500 font-medium mt-2">
              Select section, subject, and date range to generate report.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default AttendanceReportDocxExport;