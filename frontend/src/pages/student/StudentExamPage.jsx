import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Clock,
  DoorOpen,
  Hash,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import StudentLayout from './StudentLayout';
import api from '../../api';

const StudentExamPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyExamSeats = async () => {
    setLoading(true);

    try {
      const res = await api.get('/exams/student/my-seats');
      setExams(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to load exam seats');
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyExamSeats();
  }, []);

  return (
    <StudentLayout
      pageLabel="Student Module"
      title="My Exam Seats"
      subtitle="View your assigned exam room and seat number."
    >
      {loading ? (
        <div className="bg-white rounded-3xl p-8 text-slate-500 font-bold">
          Loading exam seats...
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={`${exam.exam_id}-${exam.seat_number}`}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <BookOpen size={24} />
              </div>

              <h2 className="text-xl font-black text-slate-800">
                {exam.exam_name}
              </h2>

              <p className="text-sm text-slate-500 font-bold mt-1">
                {exam.subject_name}
              </p>

              <div className="space-y-3 mt-5 text-sm text-slate-600 font-medium">
                <p className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {exam.exam_date}
                </p>

                <p className="flex items-center gap-2">
                  <Clock size={16} />
                  {exam.start_time?.slice(0, 5)} - {exam.end_time?.slice(0, 5)}
                </p>

                <p className="flex items-center gap-2">
                  <DoorOpen size={16} />
                  Room: {exam.room_name}
                </p>

                <p className="flex items-center gap-2">
                  <Hash size={16} />
                  Seat Number: {exam.seat_number}
                </p>

                <p className="flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Invigilator: {exam.invigilator_name || 'Not assigned'}
                </p>
              </div>

              <div className="mt-5 px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-sm">
                {exam.course_name} / {exam.level_name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <DoorOpen size={36} className="mx-auto text-slate-300" />

          <h3 className="text-xl font-black text-slate-800 mt-4">
            No exam seat assigned yet.
          </h3>

          <p className="text-slate-500 font-medium mt-2">
            Your exam room and seat number will appear here after admin generates seating.
          </p>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentExamPage;