# EduTrack GH – Full Project Document

**Purpose of this document:** Give a complete picture of the project and what has been implemented so far, so that an AI assistant (e.g. ChatGPT) can understand the codebase and help with next steps.

---

## 1. What Is EduTrack GH?

**EduTrack GH** is a **school absenteeism tracking and parent notification system** for **Primary (P1–P6) and JHS (JHS 1–3) schools in Ghana**.

- **Teachers** mark daily attendance by class (present / late / absent).
- **Parents** receive notifications when their child is absent or late (in-app list; optional SMS via Hubtel).
- **Headteachers** see school-wide attendance reports by month and manage classes.
- **Admins** manage schools, create headteachers and teachers, and system settings.

There are **no “students” as login users** in this product: students are entities in the database (linked to classrooms and parents). The four **user roles** are: **Teacher**, **Headteacher**, **Parent**, **Admin**.

---

## 2. Tech Stack

| Layer     | Stack |
|----------|--------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, Context API (Auth, Theme, Toast) |
| Backend  | Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Nodemailer |
| Optional | Hubtel API for SMS to parents (Ghana); configured via backend `.env` |

**Repo structure:** Monorepo with two main folders:

- `eduTrackGH-frontend/` – React app (default port 5173).
- `eduTrackGH-backend/` – Express API (default port 5000).

---

## 3. User Roles and Capabilities

| Role         | Who uses it           | Main capabilities |
|-------------|------------------------|-------------------|
| **Teacher** | Class teacher          | Mark daily attendance for assigned classroom(s); view attendance history; view flagged students. |
| **Headteacher** | School-level admin | View school reports (attendance by class/month); teacher compliance; manage classes. Assigned to one school; has `schoolLevel`: PRIMARY or JHS. |
| **Parent**  | Guardian               | View children’s attendance; view notifications (absence/late). Linked to students via `User.children` (array of Student IDs). |
| **Admin**   | System super admin     | Manage schools (CRUD); create headteachers and teachers; system settings. |

Roles are **assigned by the backend only** (e.g. on registration or when admin creates a user). The frontend never shows a “choose your role” control; it only reads role from the JWT and redirects accordingly.

---

## 4. What Has Been Implemented (Step by Step)

### 4.1 Backend – Foundation

- **MongoDB** connection via `config/db.js`.
- **Environment:** `.env` from `.env.example` (e.g. `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`; optional: `EMAIL_*`, `SMS_ENABLED`, `HUBTEL_CLIENT_ID`, `HUBTEL_CLIENT_SECRET`).
- **Express** app in `server.js`: CORS, JSON body parser, routes mounted under `/api/*`, health check at `GET /api/health`, 404 and error middleware.

### 4.2 Backend – Auth

- **User model** (`models/User.js`): `fullName`, `email`, `phone`, `password` (bcrypt), `role` (teacher | headteacher | parent | admin), `schoolLevel` (PRIMARY | JHS for headteachers), `school` (ref School), `schoolId`, `classroomIds`, `children` (array of Student refs for parents), `isVerified`, `isActive`, etc.
- **Auth controller** (`controllers/authController.js`): register (default role parent), login (returns JWT + user profile), verifyEmail, getMe, logout, resendVerification.
- **Auth routes** (`routes/authRoutes.js`): `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `GET /api/auth/me`, `POST /api/auth/logout`.
- **JWT:** Generated in `utils/generateToken.js`; validated in `middleware/authMiddleware.js` (`protect`). Role checks in `middleware/roleMiddleware.js` (`authorize(role)`).

### 4.3 Backend – Schools, Classrooms, Students

- **School model** (`models/School.js`): name, schoolLevel (PRIMARY | JHS | BOTH), location, contact, headteacher (ref User), isActive, etc.
- **Classroom model** (`models/Classroom.js`): name, grade, schoolId, teacherId (ref User), studentCount, isActive.
- **Student model** (`models/Student.js`): studentId (unique string), fullName, schoolId, classroomId, grade, parentPhone, parentName, attendanceStats, isFlagged, etc. (Students are not users; they are records linked to classrooms and parents.)
- **Classroom controller/routes:** `GET /api/classrooms` (teacher’s classrooms), `GET /api/classrooms/:classroomId`, `GET /api/classrooms/:classroomId/students` (teacher only).

### 4.4 Backend – Admin

- **Admin controller** (`controllers/adminController.js`): createHeadteacher, createTeacher, getHeadteachers, getTeachers, getStats, getSchools, createSchool, updateSchool, toggleSchoolStatus, getSystemSettings, updateSystemSettings.
- **Admin routes** (`routes/adminRoutes.js`): all under `protect` + `authorize('admin')`. Examples: `POST/GET /api/admin/headteachers`, `POST/GET /api/admin/teachers`, `GET /api/admin/stats`, `GET/POST/PUT/PATCH /api/admin/schools`, `GET/PUT /api/admin/settings`.

### 4.5 Backend – Daily Attendance (EduTrack Core)

- **DailyAttendance model** (`models/DailyAttendance.js`): classroomId, schoolId, date, studentId (ref Student), status (present | late | absent), markedBy (ref User). Unique on (classroomId, date, studentId).
- **Attendance controller:**  
  - `markDailyAttendance` (teacher): accepts `classroomId`, `date`, `attendanceData` (array of `{ studentId, status }`). Creates/updates DailyAttendance records. For each absent/late student: finds parent (`User` with `children` containing that studentId), creates a **Notification** record, and optionally sends SMS if `SMS_ENABLED` and Hubtel credentials are set (`utils/sendSms.js`).  
  - `getClassroomDailyHistory` (teacher): returns daily attendance aggregated by date for a classroom (optional `month` query).
- **Attendance routes:** `POST /api/attendance/daily` (teacher), `GET /api/attendance/classroom/:classroomId/daily` (teacher). (Legacy session-based routes for student/lecturer also exist but are not the main EduTrack flow.)

### 4.6 Backend – Parent Notifications

- **Notification model** (`models/Notification.js`): parentId (ref User), studentId (ref Student), type (absence | late), message, channel, date, read.
- **Notification controller** (`controllers/notificationController.js`): getMyNotifications (parent), markAsRead (parent).
- **Notification routes** (`routes/notificationRoutes.js`): `GET /api/notifications`, `PATCH /api/notifications/:id/read` (parent only).

### 4.7 Backend – School Reports (Headteacher)

- **Reports controller** (`controllers/reportsController.js`): getSchoolReports – headteacher’s school, optional `month` query; aggregates DailyAttendance by classroom (class name, level, student count, avg rate, flagged count, etc.).
- **Reports routes** (`routes/reportsRoutes.js`): `GET /api/reports/school?month=YYYY-MM` (headteacher only).

### 4.8 Backend – SMS (Optional)

- **sendSms** (`utils/sendSms.js`): Sends SMS via Hubtel (Ghana). No-op if `HUBTEL_CLIENT_ID` / `HUBTEL_CLIENT_SECRET` are not set. Used when saving daily attendance for absent/late students if `SMS_ENABLED=true`.

### 4.9 Backend – Test Data

- **Script** `scripts/createTestUsers.js` (run with `npm run create-test-users`): Creates test users for admin, headteachers (primary/JHS), teachers, parent. Logins printed to console (e.g. `admin@edutrack.test` / `admin123`, `teacher@edutrack.test` / `teacher123`).

---

### 4.10 Frontend – Foundation

- **Entry:** `main.jsx` → `App.jsx` with React Router. Global providers: ThemeProvider, ToastProvider, AuthProvider.
- **API client** (`services/api.js`): Axios instance with baseURL `http://localhost:5000/api`, request interceptor adding `Authorization: Bearer <token>` from localStorage, response interceptor handling 401 (e.g. redirect to login).
- **Constants** (`utils/constants.js`): ROLES (teacher, headteacher, parent, admin), ROUTES (all paths), COLORS, SCHOOL_LEVELS, PRIMARY_GRADES, JHS_GRADES, etc.

### 4.11 Frontend – Auth and Routing

- **AuthContext** (`context/AuthContext.jsx`): user, isAuthenticated, loading, login(), logout(), register(). On login, stores token and user (role normalized to lowercase) in localStorage and state. On load, restores from localStorage.
- **Login** (`pages/public/Login.jsx`): form → authService.login → on success calls getRoleRedirectPath(role) and navigates to role dashboard (teacher, headteacher, parent, admin).
- **loginHelpers** (`utils/loginHelpers.js`): validateLoginForm, getRoleRedirectPath(role) → path (e.g. ADMIN → /admin/dashboard).
- **ProtectedRoute** (`components/common/ProtectedRoute.jsx`): If not authenticated → redirect to login. If requiredRole and user.role !== requiredRole → redirect to getRoleRedirectPath(user.role). Otherwise render children.
- **Routes in App.jsx:** Public: `/`, `/login`, `/register`, `/verify-email`. Teacher: `/teacher/dashboard`, `/teacher/mark-attendance`, `/teacher/history`, `/teacher/flagged`. Headteacher: `/headteacher/dashboard`, `/headteacher/reports`, `/headteacher/compliance`, `/headteacher/classes`. Parent: `/parent/dashboard`, `/parent/children`, `/parent/notifications`. Admin: `/admin/dashboard`, `/admin/schools`, `/admin/create-headteacher`, `/admin/teachers`, `/admin/settings`. Catch-all → home.

### 4.12 Frontend – Services (API Layer)

- **authService:** register, login, verifyEmail, resendVerification, googleAuth, logout (all call apiClient).
- **attendanceService:** markDailyAttendance(classroomId, date, attendanceData) → POST /attendance/daily; getClassroomAttendanceHistory(classroomId, month) → GET /attendance/classroom/:id/daily; getFlaggedStudents, getChildAttendance (stubs or placeholder endpoints).
- **classroomService:** getTeacherClassrooms, getClassroomStudents (GET /classrooms, GET /classrooms/:id/students).
- **adminService:** schools, headteachers, teachers, stats, settings (GET/POST/PUT as per backend).
- **notificationService:** getMyNotifications (GET /notifications), markAsRead (PATCH /notifications/:id/read).
- **reportsService:** getSchoolReports(month) → GET /reports/school.

### 4.13 Frontend – Pages by Role

- **Public:** Landing, Login, Register, VerifyEmail.
- **Teacher:** TeacherDashboard, MarkAttendance (daily by class/date; uses classroomService + attendanceService.markDailyAttendance), AttendanceHistory, FlaggedStudents.
- **Headteacher:** HeadteacherDashboard, SchoolReports (month picker; reportsService.getSchoolReports; table by class), TeacherCompliance, ManageClasses.
- **Parent:** ParentDashboard, ChildrenAttendance, Notifications (notificationService.getMyNotifications; list of absence/late notifications).
- **Admin:** AdminDashboard, ManageSchools, CreateHeadteacher, ManageTeachers, SystemSettings.

### 4.14 Frontend – Key Components and Layouts

- **Layouts:** DashboardLayout (sidebar + role-based nav), PublicLayout (auth pages).
- **Common:** Button, Modal, Card, FormInput, ProtectedRoute, AuthLayout, Loader, Toast, etc.
- **Teacher:** StudentAttendanceRow (present/late/absent buttons per student) used in MarkAttendance.
- **Admin:** SchoolForm, NotificationSettings, etc.

### 4.15 Frontend – Design and UX

- EduTrack GH branding: primary green (#006838), accent blue (#1E40AF). Tailwind throughout.
- Dark/light theme (ThemeContext). Toasts for success/error (ToastProvider).

---

## 5. Important File Locations (Quick Reference)

**Backend**

- Entry: `server.js`
- Config: `config/db.js`, `config/email.js`
- Models: `models/User.js`, `models/School.js`, `models/Student.js`, `models/Classroom.js`, `models/DailyAttendance.js`, `models/Notification.js`, `models/Attendance.js`, `models/Session.js`
- Controllers: `controllers/authController.js`, `controllers/adminController.js`, `controllers/attendanceController.js`, `controllers/classroomController.js`, `controllers/notificationController.js`, `controllers/reportsController.js`
- Routes: `routes/authRoutes.js`, `routes/adminRoutes.js`, `routes/attendanceRoutes.js`, `routes/classroomRoutes.js`, `routes/notificationRoutes.js`, `routes/reportsRoutes.js`
- Middleware: `middleware/authMiddleware.js`, `middleware/roleMiddleware.js`, `middleware/errorMiddleware.js`
- Utils: `utils/generateToken.js`, `utils/sendEmail.js`, `utils/sendSms.js`, `utils/validators.js`
- Scripts: `scripts/createTestUsers.js`

**Frontend**

- Entry: `main.jsx`, `App.jsx`
- Context: `context/AuthContext.jsx`, `context/ThemeContext.jsx`, `context/ToastContext.jsx`
- Routes: `App.jsx` (route definitions), `components/common/ProtectedRoute.jsx`, `utils/loginHelpers.js` (getRoleRedirectPath)
- Constants: `utils/constants.js`
- Services: `services/api.js`, `services/authService.js`, `services/attendanceService.js`, `services/classroomService.js`, `services/adminService.js`, `services/notificationService.js`, `services/reportsService.js`
- Pages: `pages/public/*`, `pages/teacher/*`, `pages/headteacher/*`, `pages/parent/*`, `pages/admin/*`
- Layouts: `layouts/DashboardLayout.jsx`, `layouts/PublicLayout.jsx`

---

## 6. API Endpoints Summary

| Area        | Method | Path (example) | Who |
|------------|--------|------------------|-----|
| Auth       | POST   | /api/auth/register, /api/auth/login, /api/auth/verify-email, /api/auth/resend-verification | Public |
| Auth       | GET    | /api/auth/me | Authenticated |
| Auth       | POST   | /api/auth/logout | Authenticated |
| Classrooms | GET    | /api/classrooms, /api/classrooms/:id, /api/classrooms/:id/students | Teacher |
| Attendance | POST   | /api/attendance/daily | Teacher |
| Attendance | GET    | /api/attendance/classroom/:classroomId/daily | Teacher |
| Notifications | GET  | /api/notifications | Parent |
| Notifications | PATCH | /api/notifications/:id/read | Parent |
| Reports    | GET    | /api/reports/school?month=YYYY-MM | Headteacher |
| Admin      | GET/POST | /api/admin/schools, /api/admin/headteachers, /api/admin/teachers, /api/admin/stats, /api/admin/settings | Admin |

(Other legacy or secondary routes exist for sessions, attendance history, etc.)

---

## 7. Test Credentials (After Running create-test-users)

| Role       | Email | Password |
|-----------|--------|----------|
| Admin     | admin@edutrack.test | admin123 |
| Headteacher (Primary) | headteacher.primary@edutrack.test | headteacher123 |
| Headteacher (JHS)     | headteacher.jhs@edutrack.test | headteacher123 |
| Teacher   | teacher@edutrack.test or teacher.primary@edutrack.test | teacher123 |
| Parent    | parent@edutrack.test | parent123 |

Run from backend folder: `npm run create-test-users`. Script prints full list.

---

## 8. Current State and Known Gaps

**Working end-to-end**

- Auth: register, login, JWT, role-based redirect to dashboards.
- Teacher: load classrooms → select class and date → load students → set present/late/absent → save daily attendance → backend creates DailyAttendance and Notification (and optional SMS).
- Parent: view notifications list from API.
- Headteacher: view school reports by month from API (for headteacher’s school).
- Admin: manage schools, create headteachers/teachers, system settings (UI + API).

**Assumptions / limitations**

- Parent must be linked to students via `User.children` (array of Student IDs). Notifications are only created when such a parent exists for an absent/late student.
- Headteacher must have `school` set (ref School) for school reports to return data.
- Teacher must be assigned to classrooms (`Classroom.teacherId`) to see classes and mark attendance.
- SMS: optional; requires Hubtel credentials and `SMS_ENABLED=true` in backend `.env`.
- Some frontend flows (e.g. flagged students, child attendance for parent) may still call stub or placeholder endpoints; backend may not have all corresponding routes yet.
- Lecturer/session-based attendance (Session, Attendance models) exists in backend but is not the primary EduTrack flow; primary flow is daily class attendance (DailyAttendance).

---

## 9. How to Run the Project

**Backend**

```bash
cd eduTrackGH-backend
npm install
cp .env.example .env   # set MONGODB_URI, JWT_SECRET, FRONTEND_URL
npm run dev
```

**Frontend**

```bash
cd eduTrackGH-frontend
npm install
npm install react-router-dom axios
npm run dev
```

**Create test users**

```bash
cd eduTrackGH-backend
npm run create-test-users
```

Then open frontend at `http://localhost:5173`, go to Login, and use any of the test credentials above.

---

## 10. For AI Assistants (ChatGPT, etc.)

When helping with this project:

- **Project name:** EduTrack GH (school absenteeism + parent notifications, Ghana Primary/JHS).
- **Roles:** Teacher, Headteacher, Parent, Admin (no student login).
- **Core flow:** Teacher marks daily attendance per class → absent/late → Notification created and optional SMS to parent.
- **Backend:** Node/Express/MongoDB; JWT; role-based routes; key models: User, School, Classroom, Student, DailyAttendance, Notification.
- **Frontend:** React/Vite; AuthContext + ProtectedRoute + getRoleRedirectPath; pages and services aligned with backend; no role selection in UI.
- Use this document and the file locations in Section 5 to navigate the repo and suggest changes or next steps.
