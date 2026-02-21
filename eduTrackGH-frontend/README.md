# EduTrack GH – Frontend

React frontend for **EduTrack GH**: school absenteeism tracking and parent notifications for Primary and JHS schools in Ghana.

## Overview

- **Roles:** Teacher, Headteacher, Parent, Admin (role-based dashboards)
- **Daily attendance:** Teachers mark by class; absent/late → parent notifications (SMS optional via Hubtel)
- **Reports:** Headteachers view school-wide attendance by month
- **Backend:** Node.js API at `http://localhost:5000/api` (see `eduTrackGH-backend`)

## Tech Stack

React 19, Vite, Tailwind CSS, React Router, Axios, Context API

## Getting Started

```bash
npm install
npm install react-router-dom axios
npm run dev
```

Open `http://localhost:5173`

## Test Credentials

Create test users (backend must be running with MongoDB):

```bash
cd eduTrackGH-backend
npm run create-test-users
```

Then log in with e.g. `admin@edutrack.test` / `admin123`, `teacher@edutrack.test` / `teacher123`, `parent@edutrack.test` / `parent123`. See backend script output for full list.

## Project Structure

```
src/
├── components/   common, admin, teacher, student, lecturer
├── context/      AuthContext, ThemeContext, ToastProvider
├── hooks/        useAuth, useCamera, useRole, useSchools
├── layouts/      DashboardLayout, PublicLayout
├── pages/        public, teacher, headteacher, parent, admin
├── routes/       ProtectedRoute, role-based redirects
├── services/     auth, attendance, admin, notification, reports
├── utils/        constants, validators, loginHelpers
├── App.jsx
└── main.jsx
```

## Design

- **Primary:** EduTrack Green `#006838`; **Accent:** Blue `#1E40AF`
- **Fonts:** Inter / Poppins
- Constants: `src/utils/constants.js`

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) – Architecture rules and backend integration
