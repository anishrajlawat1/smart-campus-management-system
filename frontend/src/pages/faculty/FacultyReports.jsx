import React from 'react';
import FacultyLayout from './FacultyLayout';
import AttendanceReportDocxExport from '../../components/AttendanceReportDocxExport';

const FacultyReports = () => {
  return (
    <FacultyLayout
      pageLabel="Faculty Module"
      title="Attendance Reports"
      subtitle="Generate printable DOCX attendance reports for your assigned classes."
    >
      <AttendanceReportDocxExport role="faculty" />
    </FacultyLayout>
  );
};

export default FacultyReports;