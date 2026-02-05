# EduTrack GH - Frontend

A modern, production-ready React frontend for basic school absenteeism tracking and parent notification system. Built for Primary and JHS schools in Ghana.

## 🎯 Project Overview

This is the **frontend-only** implementation of EduTrack GH that:
- Supports teachers, headteachers, and parents with role-based interfaces
- Provides daily attendance marking for basic schools (Primary 1-6, JHS 1-3)
- Features mobile-first responsive design with EduTrack GH branding
- Is ready for backend integration (MERN stack)

### ⚠️ IMPORTANT: Frontend-First Development

**Backend Status**: NOT IMPLEMENTED YET

This frontend is designed to work **independently** during development:

✅ **What Works Now:**
- Complete UI structure and navigation
- Mock authentication and authorization
- Teacher, Headteacher, Parent, and Admin dashboards
- All user flows with mock data
- Responsive design and EduTrack GH branding

🔄 **What's Mocked:**
- API calls return placeholder data
- JWT tokens are simulated
- Attendance data is mocked
- All services use mock implementations

🔮 **What's Coming:**
- Real backend API (Node.js + Express + MongoDB)
- SMS notification integration (Hubtel API)
- Actual JWT validation
- Database operations
- Email verification
- Daily attendance marking functionality

### Development Philosophy
```
Build UI First → Test with Mocks → Connect Backend → Integrate Python
```

This approach allows:
- Frontend and backend teams to work in parallel
- Early UI/UX validation with stakeholders
- Faster iteration on design
- Clear separation of concerns

## 🧱 Tech Stack

- **React 19.2.0** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing (to be installed)
- **Axios** - HTTP client (to be installed)
- **Context API** - Global state management

## 📁 Project Structure

```
src/
├── assets/              # Images, logos, icons
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Button, Input, Modal)
│   ├── student/        # Student-specific components
│   └── lecturer/       # Lecturer-specific components
├── context/            # React Context (AuthContext)
├── hooks/              # Custom hooks (useAuth, useCamera, useRole)
├── layouts/            # Page layouts (Public, Student, Lecturer)
├── pages/              # Route-level pages
│   ├── public/         # Landing, Login, Register
│   ├── student/        # Dashboard, Sessions, History
│   └── lecturer/       # Dashboard, Create Session, Reports
├── routes/             # Route configuration and guards
├── services/           # API abstraction layer (mocked)
├── utils/              # Constants, validators, helpers
├── App.jsx             # Root component
└── main.jsx            # Entry point
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install additional required packages:
```bash
npm install react-router-dom axios
```

3. Start development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:5173`

## 🎨 UDS Branding & Design System

### University Identity
**University for Development Studies (UDS)**  
**Computer Science Society (CSS)**

### Color Palette

#### Primary Colors
- **UDS Green**: `#006838` - Main brand color
  - Primary buttons, headers, active states
- **University Blue**: `#1E40AF` - Accent color
  - Links, secondary actions, highlights

#### Semantic Colors
- **Success**: `#10B981` - Attendance marked, success messages
- **Error**: `#EF4444` - Failed verification, errors
- **Warning**: `#F59E0B` - Session ending soon
- **Info**: `#3B82F6` - Informational messages

#### Neutrals
- **White**: `#FFFFFF` - Backgrounds, cards
- **Gray**: `#F5F5F5` to `#1A1A1A` - Text, borders, backgrounds

### Design Principles

1. **Clean**: Minimal clutter, clear hierarchy
2. **Modern**: Contemporary UI patterns, smooth animations
3. **Accessible**: WCAG 2.1 AA compliant, high contrast
4. **Professional**: Academic credibility, consistent branding
5. **Mobile-First**: Optimized for phones, touch-friendly

### Typography
- **Font**: Inter / Poppins
- **Headings**: Bold, UDS Green or Dark
- **Body**: Regular, Dark or Gray
- **Captions**: Small, Gray

### Component Styling
```css
/* Buttons */
Primary: bg-green-700 text-white rounded hover:bg-green-800
Secondary: bg-white text-green-700 border-green-700

/* Cards */
bg-white rounded-lg shadow-md p-6 border border-gray-200

/* Inputs */
border border-gray-300 rounded px-4 py-2 
focus:border-green-700 focus:ring-2 focus:ring-green-200
```

See `src/utils/constants.js` for complete design system constants.

## 👥 User Roles

### Student
- Register and verify account
- View active attendance sessions
- Mark attendance via face capture
- View attendance history

### Lecturer
- Create attendance sessions
- Activate/deactivate sessions
- View attendance records
- Export attendance reports

## 🔐 Authentication (Frontend)

### Current Implementation: Mock Authentication

**Important Security Notes:**

❌ **Roles Are NEVER Selected by Users**
- Students: Auto-assigned `role: 'student'` by backend during registration
- Lecturers: Created by admin or authorized email domain
- Frontend: Only displays UI based on role from JWT token

✅ **How Roles Work:**
```
1. User registers/logs in
2. Backend assigns role
3. Backend generates JWT with role claim
4. Frontend receives JWT
5. Frontend decodes role from token
6. Frontend shows appropriate UI
```

⚠️ **Frontend Security = UX Only**
- Route guards prevent accidental navigation
- Backend validates EVERY API request
- JWT tokens validated server-side
- Never trust frontend role checks for security

### Google Authentication

**Google Sign-In Flow:**
1. User clicks "Sign in with Google"
2. Google OAuth popup
3. Frontend receives Google token
4. Frontend sends to backend
5. Backend validates and:
   - If user exists: Return JWT
   - If new user: Create account, assign role, return JWT
6. Frontend stores JWT and redirects

**Note**: Google Sign-In is for authentication, backend handles account creation and role assignment.

### Mock Data Structure
```javascript
// Current mock JWT payload
{
  token: 'mock_jwt_token_12345',
  user: {
    id: 1,
    email: 'student@uds.edu.gh',
    role: 'student',  // Assigned by backend
    firstName: 'John',
    lastName: 'Doe'
  }
}
```

**Note**: Current implementation uses mock data. Backend integration pending.

## 📱 Key Features

### Student Features
- **Active Sessions**: View and join active attendance sessions
- **Face Capture**: Camera interface for attendance marking
- **History**: View past attendance records

### Lecturer Features
- **Session Management**: Create and manage attendance sessions
- **Attendance Reports**: View and export attendance data
- **Real-time Status**: Monitor active sessions

### Common Features
- **Responsive Design**: Mobile-first, works on all devices
- **Role-Based Access**: Separate interfaces for students and lecturers
- **Modern UI**: Clean, professional design with UDS branding

## 🧩 Core Components

### Common Components
- `Button` - Reusable button with variants
- `Input` - Form input with validation
- `Modal` - Overlay dialogs
- `Loader` - Loading spinner
- `Alert` - Success/error messages
- `Card` - Content container

### Student Components
- `SessionCard` - Display session details
- `FaceCapture` - Camera interface
- `AttendanceHistoryTable` - Past records

### Lecturer Components
- `SessionForm` - Create session form
- `SessionList` - Manage sessions
- `AttendanceReport` - View attendance

## 🔄 Mock Data

All API calls are currently mocked in the service layer:
- `authService.js` - Authentication operations
- `attendanceService.js` - Attendance operations
- `sessionService.js` - Session management

### Why Mock Data?

1. **Parallel Development**: Frontend and backend teams work independently
2. **Early Testing**: Test UI flows before backend is ready
3. **Stakeholder Demos**: Show working UI to get feedback
4. **Clear Contracts**: Define API structure before implementation

### Mock Implementation Example

```javascript
// src/services/authService.js
export const authService = {
  login: async (credentials) => {
    // TODO: Replace with real API call when backend is ready
    // return apiClient.post('/auth/login', credentials);
    
    // Mock response for now
    return {
      token: 'mock_jwt_token',
      user: {
        id: 1,
        email: credentials.email,
        role: 'student',
        firstName: 'John',
        lastName: 'Doe'
      }
    };
  }
};
```

### When Backend Is Ready

Replace mock implementations with real API calls:

```javascript
// Update BASE_URL in src/services/api.js
const BASE_URL = 'https://api.uds-attendance.edu.gh/api';

// Replace mock in authService.js
export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }
};
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Style
- Use functional components with hooks
- Follow component naming conventions
- Keep components small and focused
- Use barrel exports (index.js) for clean imports

## 🔮 Future Integration

### Backend Integration Checklist

When backend is ready:

1. **Update API Configuration**
   ```javascript
   // src/services/api.js
   const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
   ```

2. **Replace Mock Services**
   - Remove mock return statements
   - Implement real API calls using apiClient
   - Handle real error responses

3. **Implement Real JWT Handling**
   ```javascript
   // src/utils/tokenManager.js
   - Store tokens securely
   - Implement refresh token logic
   - Handle token expiration
   ```

4. **Update Interceptors**
   ```javascript
   // src/services/api.js
   - Add JWT to request headers
   - Handle 401 (token expired)
   - Implement token refresh flow
   ```

### Python Face Recognition Integration

**Architecture:**
```
Frontend → Backend API → Python Service
```

**Frontend Responsibilities:**
1. Capture image from webcam
2. Convert to base64
3. Send to backend endpoint
4. Display result

**Python Service (Backend):**
1. Receive image from backend
2. Detect face in image
3. Generate face encoding
4. Match against stored encodings
5. Calculate confidence score
6. Return result to backend

**Integration Point:**
```javascript
// src/services/attendanceService.js
export const attendanceService = {
  markAttendance: async (sessionId, imageData) => {
    // Backend forwards to Python service
    const response = await apiClient.post('/attendance/mark', {
      sessionId,
      imageData, // base64 string
    });
    
    // Response includes:
    // { success, confidence, message }
    return response.data;
  }
};
```

**Note**: Python service is called by backend, not directly by frontend.

## 📚 Documentation

- **[README.md](./README.md)** - Project overview and setup (you are here)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed architecture rules and principles
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Complete folder tree
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Implementation status and roadmap
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick reference for developers
- **[REFINEMENT_SUMMARY.md](./REFINEMENT_SUMMARY.md)** - Architecture refinement summary

### Quick Navigation
- **First time?** Start with README.md (this file)
- **Ready to code?** Read ARCHITECTURE.md then QUICK_REFERENCE.md
- **Adding files?** Check FOLDER_STRUCTURE.md
- **Need status?** See PROJECT_STATUS.md

## 🎓 Academic Context

This project is designed for a final-year BSc Computer Science project at UDS. The architecture follows:
- Industry best practices
- Scalable design patterns
- Security-first approach
- Defensible design decisions

## 🤝 Contributing

This is an academic project. For collaboration:
1. Follow the established folder structure
2. Document all components and functions
3. Use consistent naming conventions
4. Write clean, readable code

## 📄 License

Academic project for University for Development Studies (UDS)

## 👨‍💻 Development Status

**Current Phase**: Frontend Architecture & Scaffolding ✅
**Next Phase**: UI Implementation
**Future**: Backend Integration

---

Built with ❤️ for UDS Computer Science Department
