# EduTrack GH – Backend API

REST API for EduTrack GH: school absenteeism tracking and parent notifications (Primary/JHS, Ghana).

## Tech Stack

Node.js, Express, MongoDB, JWT, Bcrypt, Nodemailer. Optional SMS via Hubtel (see `.env.example`).

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Environment**
   ```bash
   cp .env.example .env
   ```
   Set: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (e.g. `http://localhost:5173`). Optional: `EMAIL_*`, `SMS_ENABLED`, `HUBTEL_*`.

3. **Run**
   ```bash
   npm run dev
   ```
   Server: `http://localhost:5000`

## Test Users

```bash
npm run create-test-users
```
Creates admin, headteachers, teachers, parent (e.g. `admin@edutrack.test` / `admin123`). See script output for full list.

## Main Endpoints

| Area | Examples |
|------|----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Attendance | `POST /api/attendance/daily` (teacher), `GET /api/attendance/classroom/:id/daily` |
| Classrooms | `GET /api/classrooms`, `GET /api/classrooms/:id/students` |
| Admin | `GET/POST /api/admin/schools`, `GET/POST /api/admin/headteachers`, `GET/POST /api/admin/teachers` |
| Notifications | `GET /api/notifications` (parent), `PATCH /api/notifications/:id/read` |
| Reports | `GET /api/reports/school?month=YYYY-MM` (headteacher) |

## Structure

```
config/       db, email
models/       User, School, Student, Classroom, DailyAttendance, Notification
controllers/  auth, attendance, classroom, admin, notification, reports
routes/       auth, attendance, classrooms, admin, notifications, reports
middleware/   auth, role, error
utils/        generateToken, sendEmail, sendSms, validators
scripts/      createTestUsers.js
server.js
```
