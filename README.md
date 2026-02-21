# EduTrack GH

School absenteeism tracking and parent notification system for Primary and JHS schools in Ghana.

## Structure

```
EduTrackGH/
├── eduTrackGH-backend/   # Node.js + Express + MongoDB API
└── eduTrackGH-frontend/  # React + Vite frontend
```

## Quick Start

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

**Test users**
```bash
cd eduTrackGH-backend
npm run create-test-users
```
Then log in at `http://localhost:5173/login` with e.g. `admin@edutrack.test` / `admin123`. See script output for full list.

## Docs

- [eduTrackGH-frontend/README.md](./eduTrackGH-frontend/README.md) – Frontend setup and structure
- [eduTrackGH-frontend/ARCHITECTURE.md](./eduTrackGH-frontend/ARCHITECTURE.md) – Frontend architecture
- [eduTrackGH-backend/README.md](./eduTrackGH-backend/README.md) – Backend setup and API
