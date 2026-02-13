# Backend Setup Guide

Complete guide to set up and run the EduTrackGH Backend API.

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
3. **Gmail Account** (for email verification)

---

## Step 1: Install Dependencies

```bash
cd edutrack-gh-backend
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB ODM)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- nodemailer (email service)
- cors (CORS middleware)
- express-validator (input validation)
- dotenv (environment variables)
- nodemon (auto-restart for development)

---

## Step 2: Setup MongoDB

### Option A: Local MongoDB

1. **Install MongoDB** from [mongodb.com](https://www.mongodb.com/try/download/community)

2. **Start MongoDB**:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # Should connect successfully
   ```

### Option B: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster
4. Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

---

## Step 3: Setup Gmail for Email Verification

1. **Enable 2-Factor Authentication** on your Gmail account

2. **Generate App Password**:
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Scroll down to "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "UDS Attendance"
   - Copy the 16-character password

---

## Step 4: Create .env File

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/uds-attendance

# OR Database (MongoDB Atlas)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uds-attendance

# JWT (Generate a random secret)
JWT_SECRET=your_super_secret_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Python Service (for later)
PYTHON_SERVICE_URL=http://localhost:8000
```

**Important**: 
- Change `JWT_SECRET` to a random string (at least 32 characters)
- Use your Gmail app password (not your regular password)

---

## Step 5: Run the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Email service ready
🚀 Server running on port 5000
📝 Environment: development
🌐 Frontend URL: http://localhost:5173
```

---

## Step 6: Test the API

### Option A: Using Browser

Visit: `http://localhost:5000/api/health`

Should return:
```json
{
  "status": "OK",
  "message": "EduTrackGH API is running",
  "timestamp": "2026-01-20T..."
}
```

### Option B: Using Postman/Thunder Client

1. **Register a student**:
   ```
   POST http://localhost:5000/api/auth/register
   Content-Type: application/json

   {
     "fullName": "John Doe",
     "email": "john@student.uds.edu.gh",
     "studentId": "CSC/0030/22",
     "password": "Password123"
   }
   ```

2. **Check your email** for verification link

3. **Login**:
   ```
   POST http://localhost:5000/api/auth/login
   Content-Type: application/json

   {
     "email": "john@student.uds.edu.gh",
     "password": "Password123"
   }
   ```

   Response will include a `token` - copy it!

4. **Get current user** (protected route):
   ```
   GET http://localhost:5000/api/auth/me
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

---

## Step 7: Create Admin Account (Manual)

Since admins can't self-register, create one manually in MongoDB:

### Using MongoDB Compass (GUI):

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Open `edutrack-gh` database
4. Open `users` collection
5. Click "Insert Document"
6. Paste this (change email/password):

```json
{
  "fullName": "System Admin",
  "email": "admin@uds.edu.gh",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "admin",
  "isVerified": true,
  "isActive": true,
  "createdAt": "2026-01-20T00:00:00.000Z",
  "updatedAt": "2026-01-20T00:00:00.000Z"
}
```

### Using MongoDB Shell (mongosh):

```javascript
use uds-attendance

db.users.insertOne({
  fullName: "System Admin",
  email: "admin@uds.edu.gh",
  password: "$2a$10$YourHashedPasswordHere", // Hash "Admin123" or your password
  role: "admin",
  isVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**To hash a password**, run this Node.js script:
```javascript
const bcrypt = require('bcryptjs');
const password = 'Admin123';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

### Sessions (`/api/sessions`)
- `POST /api/sessions` - Create session (lecturer)
- `GET /api/sessions` - Get sessions (role-based)
- `GET /api/sessions/:id` - Get single session
- `PUT /api/sessions/:id/activate` - Activate session (lecturer)
- `PUT /api/sessions/:id/deactivate` - Deactivate session (lecturer)
- `DELETE /api/sessions/:id` - Delete session (lecturer)

### Attendance (`/api/attendance`)
- `POST /api/attendance/mark` - Mark attendance (student)
- `GET /api/attendance/history` - Get history (student)
- `GET /api/attendance/session/:id` - Get attendees (lecturer)
- `GET /api/attendance/export/:id` - Export CSV (lecturer)
- `POST /api/attendance/enroll-face` - Enroll face (student)

### Admin (`/api/admin`)
- `POST /api/admin/lecturers` - Create lecturer (admin)
- `GET /api/admin/lecturers` - Get all lecturers (admin)
- `PUT /api/admin/lecturers/:id` - Update lecturer (admin)
- `DELETE /api/admin/lecturers/:id` - Delete lecturer (admin)
- `GET /api/admin/stats` - System statistics (admin)

---

## Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error: connect ECONNREFUSED
```
**Solution**: Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### Email Service Error
```
❌ Email configuration error: Invalid login
```
**Solution**: 
- Make sure you're using Gmail App Password (not regular password)
- Enable 2-Factor Authentication first
- Generate new App Password

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env` to 5001 or kill the process using port 5000

### JWT Token Error
```
Not authorized, token failed
```
**Solution**: 
- Make sure you're sending token in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Token might be expired (7 days by default)

---

## Next Steps

1. ✅ Backend is running
2. ✅ Test all endpoints with Postman
3. 🔄 Connect frontend to backend (update API base URL)
4. 🔄 Build Python face recognition service
5. 🔄 Integrate face recognition with backend

---

## Production Deployment

When deploying to production:

1. **Change environment variables**:
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET` (32+ characters)
   - Use MongoDB Atlas (cloud database)
   - Update `FRONTEND_URL` to production URL

2. **Security**:
   - Enable HTTPS
   - Set secure CORS policy
   - Use environment variables (never commit .env)
   - Enable rate limiting
   - Add helmet.js for security headers

3. **Hosting Options**:
   - **Backend**: Railway, Render, Heroku, DigitalOcean
   - **Database**: MongoDB Atlas (free tier available)
   - **Frontend**: Vercel, Netlify

---

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Make sure MongoDB is running
4. Test endpoints with Postman before connecting frontend

**Backend is ready! 🚀**
