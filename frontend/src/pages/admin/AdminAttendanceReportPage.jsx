import React from 'react';
import AdminLayout from './AdminLayout';
import AttendanceReportDocxExport from '../../components/AttendanceReportDocxExport';

const AdminAttendanceReportPage = () => {
  return (
    <AdminLayout
      pageLabel="Admin Module"
      title="Attendance Reports"
      subtitle="Generate printable DOCX attendance reports for any section and subject."
    >
      <AttendanceReportDocxExport role="admin" />
    </AdminLayout>
  );
};

export default AdminAttendanceReportPage;