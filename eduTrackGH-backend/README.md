# EduTrackGH Attendance System - Backend API

REST API for EduTrackGH Attendance System.

## 🚀 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Bcrypt** - Password hashing

## ✨ Features

- ✅ User authentication (register, login, email verification)
- ✅ Role-based access control (Student, Lecturer, Admin)
- ✅ Session management (create, activate, deactivate)
- ✅ Attendance tracking (mark, history, export CSV)
- ✅ Admin panel (create/manage lecturers)
- ✅ Email notifications
- ✅ JWT token authentication
- ✅ Input validation
- ✅ Error handling

## 📦 Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd edutrack-gh-backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```bash
cp .env.example .env
```

4. Update `.env` with your credentials
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
FRONTEND_URL=http://localhost:5173
```

5. Run the server
```bash
# Development
npm run dev

# Production
npm start
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Sessions
- `POST /api/sessions` - Create session (lecturer)
- `GET /api/sessions` - Get sessions (role-based)
- `GET /api/sessions/:id` - Get single session
- `PUT /api/sessions/:id/activate` - Activate session
- `PUT /api/sessions/:id/deactivate` - Deactivate session
- `DELETE /api/sessions/:id` - Delete session

### Attendance
- `POST /api/attendance/mark` - Mark attendance (student)
- `GET /api/attendance/history` - Get history (student)
- `GET /api/attendance/session/:id` - Get attendees (lecturer)
- `GET /api/attendance/export/:id` - Export CSV (lecturer)

### Admin
- `POST /api/admin/lecturers` - Create lecturer
- `GET /api/admin/lecturers` - Get all lecturers
- `PUT /api/admin/lecturers/:id` - Update lecturer
- `DELETE /api/admin/lecturers/:id` - Delete lecturer
- `GET /api/admin/stats` - System statistics

## 🏗️ Project Structure

```
edutrack-gh-backend/
├── config/          # Database and email configuration
├── models/          # MongoDB models
├── controllers/     # Business logic
├── routes/          # API routes
├── middleware/      # Auth and error handling
├── utils/           # Helper functions
├── .env             # Environment variables (not in git)
├── server.js        # Entry point
└── package.json     # Dependencies
```

## 🔒 Security

- Passwords hashed with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- CORS configured
- Environment variables for secrets

## 📝 License

MIT

## 👨‍💻 Author

Abdallah Awini - UDS Computer Science Final Year Project
```
