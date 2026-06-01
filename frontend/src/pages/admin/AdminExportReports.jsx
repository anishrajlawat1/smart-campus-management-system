import React, { useState } from 'react';
import {
  Download,
  Users,
  CalendarDays,
  PackageOpen,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import api from '../../api';

const AdminExportReports = () => {
  const [loading, setLoading] = useState('');

  const cleanValue = (value) => {
    if (value === null || value === undefined) return '';

    const text = String(value).replace(/"/g, '""');

    return `"${text}"`;
  };

  const downloadCsv = (filename, rows) => {
    if (!rows || rows.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = Object.keys(rows[0]);

    const csvContent = [
      headers.map(cleanValue).join(','),
      ...rows.map((row) =>
        headers.map((header) => cleanValue(row[header])).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const formatDateTime = (value) => {
    if (!value) return '';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const exportUsers = async () => {
    setLoading('users');

    try {
      const res = await api.get('/users');
      const users = Array.isArray(res.data) ? res.data : res.data.users || [];

      const rows = users.map((user) => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Phone: user.phone || '',
        Address: user.address || '',
        DOB: user.dob || '',
        Created_At: formatDateTime(user.created_at),
      }));

      downloadCsv('smartcampus_users_report.csv', rows);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to export users');
    } finally {
      setLoading('');
    }
  };

  const exportRoutines = async () => {
    setLoading('routines');

    try {
      const res = await api.get('/routines');
      const routines = Array.isArray(res.data) ? res.data : [];

      const rows = routines.map((routine) => ({
        ID: routine.id,
        Course: routine.course_name,
        Level: routine.semester,
        Section: routine.section_name,
        Day: routine.day_of_week,
        Start_Time: routine.start_time,
        End_Time: routine.end_time,
        Room: routine.room,
        Block: routine.block,
        Module_Code: routine.module_code,
        Subject: routine.subject_name,
        Faculty: routine.faculty_name,
        Class_Type: routine.class_type,
      }));

      downloadCsv('smartcampus_routines_report.csv', rows);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to export routines');
    } finally {
      setLoading('');
    }
  };

  const exportEvents = async () => {
    setLoading('events');

    try {
      const res = await api.get('/events');
      const events = Array.isArray(res.data) ? res.data : [];

      const rows = events.map((event) => ({
        ID: event.id,
        Title: event.title,
        Description: event.description,
        Event_Type: event.event_type,
        Audience: event.audience_type || 'all',
        Venue: event.venue,
        Coordinator: event.organizer_name,
        Coordinator_Email: event.organizer_email,
        Start_DateTime: formatDateTime(event.start_datetime),
        End_DateTime: formatDateTime(event.end_datetime),
      }));

      downloadCsv('smartcampus_events_report.csv', rows);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to export events');
    } finally {
      setLoading('');
    }
  };

  const exportLostFound = async () => {
    setLoading('lost-found');

    try {
      const res = await api.get('/lost-found');
      const items = Array.isArray(res.data) ? res.data : [];

      const rows = items.map((item) => ({
        ID: item.id,
        Type: item.item_type,
        Title: item.title,
        Description: item.description,
        Category: item.category,
        Lost_Found_Location: item.location,
        Collection_Point: item.collection_point,
        Reported_By: item.reported_by_name,
        Reporter_Email: item.reported_by_email,
        Contact_Info: item.contact_info,
        Status: item.status === 'resolved' ? 'returned' : 'open',
        Date_Reported: item.date_reported,
        Created_At: formatDateTime(item.created_at),
      }));

      downloadCsv('smartcampus_lost_found_report.csv', rows);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to export lost & found');
    } finally {
      setLoading('');
    }
  };

  const exportAnalyticsSummary = async () => {
    setLoading('analytics');

    try {
      const res = await api.get('/analytics');
      const summary = res.data;

      const rows = [
        {
          Metric: 'Total Users',
          Value: summary?.users?.total ?? 0,
        },
        {
          Metric: 'Total Students',
          Value: summary?.users?.students ?? 0,
        },
        {
          Metric: 'Total Faculty',
          Value: summary?.users?.faculty ?? 0,
        },
        {
          Metric: 'Total Admins',
          Value: summary?.users?.admins ?? 0,
        },
        {
          Metric: 'Attendance Records',
          Value: summary?.attendance?.total ?? 0,
        },
        {
          Metric: 'Present Records',
          Value: summary?.attendance?.present ?? 0,
        },
        {
          Metric: 'Absent Records',
          Value: summary?.attendance?.absent ?? 0,
        },
        {
          Metric: 'Late Records',
          Value: summary?.attendance?.late ?? 0,
        },
        {
          Metric: 'Attendance Percentage',
          Value: `${summary?.attendance?.percentage ?? 0}%`,
        },
        {
          Metric: 'Total Notices',
          Value: summary?.notices?.total ?? 0,
        },
        {
          Metric: 'Total Events',
          Value: summary?.events?.total ?? 0,
        },
        {
          Metric: 'Upcoming Events',
          Value: summary?.events?.upcoming ?? 0,
        },
        {
          Metric: 'Total Lost & Found',
          Value: summary?.lostFound?.total ?? 0,
        },
        {
          Metric: 'Open Lost & Found',
          Value: summary?.lostFound?.open ?? 0,
        },
        {
          Metric: 'Returned Lost & Found',
          Value: summary?.lostFound?.resolved ?? 0,
        },
      ];

      downloadCsv('smartcampus_analytics_summary.csv', rows);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to export analytics');
    } finally {
      setLoading('');
    }
  };

  const exportOptions = [
    {
      key: 'users',
      title: 'Users Report',
      desc: 'Export students, faculty, and admin accounts.',
      icon: Users,
      action: exportUsers,
    },
    {
      key: 'routines',
      title: 'Routine Report',
      desc: 'Export all class schedules and lecturers.',
      icon: CalendarDays,
      action: exportRoutines,
    },
    {
      key: 'events',
      title: 'Events Report',
      desc: 'Export scheduled campus events.',
      icon: ClipboardList,
      action: exportEvents,
    },
    {
      key: 'lost-found',
      title: 'Lost & Found Report',
      desc: 'Export reported lost and found items.',
      icon: PackageOpen,
      action: exportLostFound,
    },
    {
      key: 'analytics',
      title: 'Analytics Summary',
      desc: 'Export overall dashboard statistics.',
      icon: BarChart3,
      action: exportAnalyticsSummary,
    },
  ];

  return (
    <section className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm mb-10">
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-800">
          Export Reports
        </h2>

        <p className="text-sm text-slate-500 font-medium mt-1">
          Download important admin data as CSV files for records, review, and reporting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {exportOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.action}
            disabled={loading === option.key}
            className="p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all text-left group disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center mb-4">
              <option.icon size={21} />
            </div>

            <h3 className="font-black text-slate-800 group-hover:text-indigo-600">
              {option.title}
            </h3>

            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              {option.desc}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm font-black text-indigo-600">
              <Download size={16} />
              {loading === option.key ? 'Exporting...' : 'Download CSV'}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default AdminExportReports;