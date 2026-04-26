# EduTrackGH - Attendance Management System

A comprehensive attendance tracking system for educational institutions in Ghana with face recognition, multi-role support (Admin, Teachers, Parents, Students), and real-time notifications.

## Project Structure

```
EduTrackGH/
├── eduTrackGH-backend/          # Node.js/Express backend API
│   ├── config/                  # Database and email configuration
│   ├── controllers/             # Business logic
│   ├── models/                  # MongoDB schemas
│   ├── routes/                  # API endpoints
│   ├── middleware/              # Auth and error handling
│   ├── utils/                   # Helper functions
│   ├── scripts/                 # Database migration scripts
│   └── server.js               # Express server entry point
│
└── eduTrackGH-frontend/         # React/Vite frontend application
    ├── src/
    │   ├── components/          # Reusable UI components
    │   ├── pages/              # Page components
    │   ├── services/           # API client services
    │   ├── context/            # React context (Auth, Theme, Toast)
    │   ├── hooks/              # Custom React hooks
    │   ├── routes/             # Route definitions
    │   ├── layouts/            # Dashboard layouts
    │   └── utils/              # Utility functions
    └── vite.config.js          # Vite configuration
```

## Key Features

- **Multi-Role System**: Admin, Teachers, Parents, Students with role-based access control
- **Attendance Tracking**: Real-time attendance marking and history
- **Security**: JWT authentication, encrypted passwords, role-based middleware
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode**: Automatic theme switching with user preferences
- **API-First Architecture**: RESTful backend with proper authorization

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- Git

### Backend Setup

```bash
cd eduTrackGH-backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your actual values:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: A strong random secret
# - EMAIL_USER / EMAIL_PASSWORD: Gmail app credentials
# - Other environment-specific values

# Start development server
node server.js
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd eduTrackGH-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Application runs on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Classrooms
- `GET /api/classrooms` - Get teacher's classrooms
- `GET /api/classrooms/:id` - Get classroom details
- `GET /api/classrooms/:id/students` - Get students in classroom

### Attendance
- `GET /api/attendance/classroom/:classroomId` - Get attendance history
- `POST /api/attendance/mark` - Mark attendance

### Admin
- `GET /api/admin/schools` - Manage schools
- `GET /api/admin/users` - Manage users

## Environment Variables

### Backend (.env)

Create a `.env` file in `eduTrackGH-backend/` with the following variables:

```
# Database
MONGODB_URI=your_mongodb_connection_string_here

# JWT (variable name must match `generateToken.js`)
JWT_SECRET=your_strong_random_jwt_secret_here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Email (Gmail or other service)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Frontend URL(s) for CORS + Socket.IO (comma-separated for Vercel prod + preview)
FRONTEND_URL=http://localhost:5173

# Must match frontend `VITE_ADMIN_LOGIN_PATH`
ADMIN_LOGIN_PATH=secure-admin-CHANGE_ME
```

**Note:** Never commit the `.env` file. Use `.env.example` as a template. See `eduTrackGH-backend/.env.example` for reference.

### Frontend (`.env` or `.env.local`)

Create a `.env` file in `eduTrackGH-frontend/` (see `eduTrackGH-frontend/.env.example`):

```
VITE_API_URL=http://localhost:5000/api
VITE_ADMIN_LOGIN_PATH=secure-admin-CHANGE_ME
```

Set `VITE_API_URL` to your deployed backend API (e.g. `https://your-backend.onrender.com/api`).

## Deployment (Render for Both Backend and Frontend)

Use Render for **both** services:
- Backend: Render **Web Service**
- Frontend: Render **Static Site**
- Database: MongoDB Atlas

### Step 1: Deploy Backend (Render Web Service)

1. In Render dashboard, click **New +** -> **Web Service**.
2. Connect this GitHub repository.
3. Configure:
   - **Name:** `edutrackgh-backend`
   - **Root Directory:** `eduTrackGH-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables:

```env
NODE_ENV=production
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.onrender.com
ADMIN_LOGIN_PATH=your-secure-admin-path
EMAIL_SERVICE=gmail
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_app_password
SMS_ENABLED=false
```

5. Deploy and copy backend URL, e.g.:
   - `https://edutrackgh-backend.onrender.com`

### Step 2: Deploy Frontend (Render Static Site)

1. In Render dashboard, click **New +** -> **Static Site**.
2. Connect this GitHub repository.
3. Configure:
   - **Name:** `edutrackgh-frontend`
   - **Root Directory:** `eduTrackGH-frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add environment variables:

```env
VITE_API_URL=https://edutrackgh-backend.onrender.com/api
VITE_ADMIN_LOGIN_PATH=your-secure-admin-path
```

> `VITE_ADMIN_LOGIN_PATH` must match backend `ADMIN_LOGIN_PATH`.

### Step 3: Final Wiring and Redeploy

1. Update backend `FRONTEND_URL` to your actual frontend Render URL.
2. Trigger a manual redeploy for backend.
3. Verify backend health:
   - `GET https://your-backend.onrender.com/api/health`
4. Open frontend and verify login/attendance/admin flows.

### Step 4: Post-Deploy Checklist

- Confirm at least one user has `super_admin` role.
- Keep `ADMIN_LOGIN_PATH` private and non-default.
- Ensure MongoDB Atlas network allows Render connections.
- Confirm `VITE_API_URL` points to `/api` path.
- Test secure admin login route:
  - `https://your-frontend.onrender.com/<VITE_ADMIN_LOGIN_PATH>`

## Project Status

✅ **Completed**
- Backend API with all CRUD operations
- User authentication with JWT
- Role-based access control
- Attendance tracking system
- Parent dashboard
- Teacher classroom management
- Admin system settings

🔄 **In Progress**
- Enhanced UI/UX improvements
- Performance optimization

## Testing the System

### Test Users (created via script)
```bash
cd eduTrackGH-backend
node scripts/createTestUsers.js
```

**Available login credentials:**
- Admin: admin@edutrack.com / password123
- Teacher: teacher@edutrack.com / password123
- Headteacher: headteacher@edutrack.com / password123
- Parent: parent@edutrack.com / password123
- Parent (Custom): okashamach44@gmail.com / password123

## Security Measures

- JWT tokens with expiration
- Password hashing with bcrypt
- Role-based authorization on protected routes
- Server-side validation on all API endpoints
- CORS enabled for frontend only
- Helmet.js for HTTP headers security

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is proprietary and confidential.

## Author

**Okasha Abdalla** - EduTrackGH Developer

## Support

For issues, bugs, or feature requests, please create an issue on the repository.

---

**Last Updated**: February 13, 2026
