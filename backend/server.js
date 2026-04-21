const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentAttendanceRoutes = require('./routes/studentAttendanceRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const facultyAttendanceRoutes = require('./routes/facultyAttendanceRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/student-attendance', studentAttendanceRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lost-found', lostFoundRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/faculty-attendance', facultyAttendanceRoutes);

const startServer = async () => {
  try {
    await db.execute('SELECT 1');
    console.log('Database connected successfully');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

startServer();