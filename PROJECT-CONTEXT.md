# PROJECT CONTEXT

You are assisting in building a production-grade MERN stack final year project.

Project Title:
EduTrackGH – Intelligent Absenteeism Monitoring and Attendance Integrity System for Basic Schools

This system is designed specifically for basic schools (Primary & JHS) in Ghana.

Students do NOT use phones.
Only teachers and admins use the system.

The system is built as a PWA (Progressive Web App) using:

Frontend: React (Vite) + Tailwind

Backend: Node.js + Express

Database: MongoDB (Mongoose)

Cloud Storage: Cloudinary (for attendance photo evidence)

Email Notifications (SMS excluded for cost reasons)

CORE OBJECTIVE

The system must:

Monitor student absenteeism

Detect abnormal absentee patterns

Prevent false attendance reporting by teachers

Provide administrative oversight & audit capability

Be fully functional within a trimester

This is NOT a prototype.
It must be functionally complete.

SYSTEM ROLES

Super Admin

Primary Headteacher

JHS Headteacher

Primary Teacher

JHS Teacher

Each role has a separate dashboard and controlled permissions.

CRITICAL FEATURE: ATTENDANCE INTEGRITY SYSTEM

Project concern raised:

Teachers may:

Mark all students present lazily

Mark attendance later from home

Falsify records

Randomly fill attendance after forgetting

Therefore the system must prevent:

Bulk marking

Lazy marking

Late manipulation

Silent edits

CURRENT ATTENDANCE VERIFICATION DESIGN

We are implementing:

Sequential attendance flow

Teacher must move student-by-student

No bulk marking

Cannot skip randomly

Photo Evidence for Present Students

When marking "Present"

Teacher captures student photo

Photo uploaded to Cloudinary

Stored as photoUrl in DailyAttendance

verificationType = "photo"

Manual Fallback

For cloudy weather / low lighting

verificationType = "manual"

manualReason required

Admin can audit these

Metadata Logging

Timestamp (markedAt)

Optional location (latitude, longitude)

verificationType

isLocked flag

Attendance Locking

After submission

Record becomes immutable

Any edit requires admin override

Admin Audit Dashboard

View attendance

View photo evidence

Filter by teacher/class/date

Identify excessive manual entries

Pattern Detection (AI Logic – Rule-Based)

Flag 100% present patterns

Flag excessive manual overrides

Flag suspicious edit timing

Create AttendanceFlag entries

DATABASE STATUS

DailyAttendance schema updated with:

photoUrl (String)

verificationType ("photo" | "manual")

manualReason (String)

markedAt (Date)

location (latitude, longitude)

isLocked (Boolean)

Backward compatible.
No migration required.

NOTIFICATIONS

Only EMAIL will be implemented.

Reasons:

SMS costs too high for testing

Difficult to manage multiple phone numbers

Email will:

Notify parents of absenteeism

Notify admin of flagged attendance patterns

Using:

Nodemailer

Gmail SMTP or SendGrid (depending on config)

FRONTEND STATUS

Already built with mock data:

Landing Page

Auth (Register, Login, OTP)

Admin Dashboard

Primary Headteacher Dashboard

JHS Headteacher Dashboard

Primary Teacher Dashboard

JHS Teacher Dashboard

Now transitioning from mock data → real backend integration.

CLOUDINARY STATUS

Cloudinary will be used to:

Store attendance photos

Folder: eduTrackGH/attendance

Restrict formats: jpg, jpeg, png

Optional resize transformation

Limit file size to 2MB

Secrets stored in .env only.

PERFORMANCE REQUIREMENTS

System must:

Work on low-end teacher devices

Handle poor lighting conditions

Allow manual fallback

Avoid heavy real-time AI processing

Use simple image capture instead of streaming

WHAT WE ARE NOT BUILDING

Full facial recognition AI

Student mobile app

Real-time streaming verification

SMS infrastructure

Heavy ML training pipelines

Keep system realistic and deployable within trimester.

DEVELOPMENT PRIORITIES

Backend API stability

Attendance integrity flow

Photo upload pipeline

Locking mechanism

Audit dashboard

Email notification system

Pattern detection logic

Production hardening

CODE QUALITY EXPECTATION

Modular controllers

Clean middleware separation

Proper validation (Joi or custom middleware)

Error handling

No hardcoded secrets

Clean Git commits

Production-safe structure

GOAL

Deliver a fully working system with:

Verified attendance

Audit capability

Intelligent absentee monitoring

Secure cloud photo storage

Email notification engine

This must be demonstrable live.

END OF CONTEXT.
