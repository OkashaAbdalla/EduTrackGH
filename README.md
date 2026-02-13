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

# Create .env file with required variables
# MONGODB_URI, JWT_SECRET, EMAIL_SERVICE, etc.

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
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/edutrack
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

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
