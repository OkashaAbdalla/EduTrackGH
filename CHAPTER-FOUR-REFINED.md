# CHAPTER FOUR: SYSTEM IMPLEMENTATION AND RESULTS (Refined)

**Project:** EduTrackGH  
**Use this version:** Screenshot placeholders match **pages that exist in the codebase**, not generic assumptions.

---

## Quick screenshot checklist (before you capture)

| Figure | Log in as | Open this page (URL path) | Capture this |
|--------|-----------|---------------------------|--------------|
| 4.1 | (not logged in) | `/login` | Login form |
| 4.2 | **Teacher** | `/teacher/dashboard` | Sidebar + stats + quick actions |
| 4.3 | **Teacher** | `/teacher/mark-attendance` | One-student card + Present/Late/Absent |
| 4.4 | **Teacher** | `/teacher/mark-attendance` | **Late** selected OR optional verification |
| 4.5 | **Headteacher** | `/headteacher/dashboard` | School location (GPS) settings block |
| 4.6 | **Teacher** | `/teacher/mark-attendance` | “School location check” before submit *(if geo enabled)* |
| 4.7 | **Headteacher** | `/headteacher/registers` | Term register grid + summary rates |
| 4.8 | **Teacher** | `/teacher/flagged` | Flagged students list |
| 4.9 | **Parent** | `/parent/notifications` | Notification list (present / late / absent) |

**Test logins:** Run `npm run create-test-users` in the backend, or use accounts your supervisor knows (teacher, headteacher, parent).

**Do not screenshot:** Features that are **not** in the app (full-class table with one Submit row, facial recognition, username field, “parent contact button” on notifications).

---

## 4.1 Introduction

This chapter presents the **implementation and testing** of EduTrackGH. It describes the interfaces that were actually built, how the main features work, and where screenshots should be placed as evidence.

Implementation was guided by the interview with the JHS headteacher of UDS Basic School, Mr. Ibrahim S. Alhassan (Chapter Two). The system supports **digital attendance marking**, **late and absent recording**, **GES-aligned registers**, **parent alerts** (present, late, and absent), **GPS boundary checks** when configured, and **headteacher monitoring**—without facial recognition or heavy biometric hardware.

EduTrackGH is a **web application** used on phone or computer browsers. **Students do not log in**; only teachers, headteachers, parents, and system administrators use accounts.

---

## 4.2 System Implementation

EduTrackGH was implemented as a **role-based web system** with a React frontend and Node.js/Express backend connected to MongoDB.

**Implemented modules (as built):**

| Module | Who uses it | Main screen(s) |
|--------|-------------|----------------|
| Authentication | All roles | `/login`, separate admin login URL |
| Teacher dashboard | Class teacher | `/teacher/dashboard` |
| Mark attendance | Class teacher | `/teacher/mark-attendance` |
| Attendance history | Class teacher | `/teacher/history` |
| Flagged students | Class teacher | `/teacher/flagged` |
| Headteacher dashboard | Headteacher | `/headteacher/dashboard` |
| Class registers | Headteacher | `/headteacher/registers` |
| Teacher compliance | Headteacher | `/headteacher/compliance` |
| School GPS setup | Headteacher | School location block on headteacher dashboard |
| Parent notifications | Parent | `/parent/notifications` |
| System administration | Super admin | `/admin/dashboard` (not required for basic-school demo) |

---

## 4.3 User Authentication Module

The system uses **email and password** login (not username). Teachers, headteachers, and parents sign in at the public login page. Email verification is required for new parent accounts. System administrators use a **separate admin login URL** (not shown on the public login page).

After login, the user is redirected to the dashboard for their role (teacher, headteacher, or parent).

### Figure 4.1 — Login page interface

**Where to capture:** Landing → **Sign in**, or open `/login` directly.

**Caption:** *Figure 4.1 EduTrackGH login page (email and password)*

**Screenshot must show (all are on the built page):**

- EduTrack GH logo and “Welcome Back” heading  
- **Email** field  
- **Password** field  
- **Sign in** button  
- Link to registration (for parents)  
- Optional: “Back to home” link  

**Do not describe in the caption:** “Username field” — the form uses **email** only.

**Sample paragraph for report:**

> Figure 4.1 shows the login interface of EduTrackGH. Authorized users enter their registered email and password to access role-specific dashboards. This prevents unauthorized access to attendance data.

---

## 4.4 Dashboard Interface

Each role has its own dashboard and sidebar menu. For attendance implementation evidence, the **teacher dashboard** is the primary screenshot; the headteacher dashboard is used for school-wide monitoring (Figure 4.5 and registers in 4.7).

### Figure 4.2 — Teacher dashboard interface

**Where to capture:** Log in as **teacher** → `/teacher/dashboard`

**Caption:** *Figure 4.2 Teacher dashboard with navigation and summary cards*

**Screenshot must show:**

- **Left sidebar:** Dashboard, Mark Attendance, Propose Students, Attendance History, Flagged Students, Messages  
- **Top bar:** User name, theme switch, notifications (if visible), profile area  
- **Statistics cards:** Classes Today, Unmarked Classes, Flagged Students, Total Students  
- **Quick action cards:** at least **Mark Attendance** (and optionally Propose Students / History)  

**Do not assume in text:** “Recent attendance activities” as a separate feed—the dashboard shows **stats and quick links**, not a full activity log.

**Sample paragraph:**

> Figure 4.2 presents the teacher dashboard. After login, the teacher sees summary statistics for assigned classes and quick links to mark attendance, view history, and review flagged students. This reduces navigation time during the school day.

---

## 4.5 Attendance Marking Module

Teachers mark attendance at **Mark Attendance** (`/teacher/mark-attendance`). The flow matches headteacher feedback: **simple status buttons**, not facial recognition.

**Actual behaviour (important for your report):**

1. Teacher selects **class** and **date**.  
2. System checks **GES calendar** (invalid days are blocked).  
3. Students are marked **one at a time** (“Student 1 of N”).  
4. For each student: choose **Present**, **Late**, or **Absent**.  
5. For **Present**, **Verification (Optional)** — photo and/or reason (can be skipped).  
6. **Confirm & Next** until all students are done.  
7. If the school has GPS configured: **School location check** appears before submit.  
8. **Submit Attendance** saves and **locks** the day.

This is **not** a single screen listing all students with one row of buttons each—that design was not implemented.

### Figure 4.3 — Attendance marking page

**Where to capture:** Teacher → Mark Attendance → select class and date → while marking (before finishing all students).

**Caption:** *Figure 4.3 Mark Attendance — one student at a time with Present, Late, and Absent*

**Screenshot must show:**

- Page title **Mark Attendance**  
- **Your Class** and **Date** dropdowns  
- Counters for Present / Absent / Late (session totals)  
- Current student name and “Student X of Y”  
- Three buttons: **present**, **late**, **absent**  
- **Confirm & Next** button  

**Optional second crop (same figure or note in text):** With **Present** selected, show **Verification (Optional)**, **Take Photo**, and **Add reason (Optional)**.

**Sample paragraph:**

> Figure 4.3 shows the attendance marking interface. The teacher selects the class and date, then marks each learner individually as present, late, or absent. Optional photo or reason can be added for present without blocking the workflow, which addresses concerns about network delay and poor lighting raised during the headteacher interview.

---

## 4.6 Late Status and Attendance Correction

**What the system actually does:**

- **Late** is recorded as its own status (orange **late** button)—not automatically converted to present.  
- In **registers and rates**, late is grouped with present for attendance percentage (P + L), which aligns with monitoring “attended school” while still recording lateness.  
- If a day is already **submitted and locked**, the teacher cannot edit it until the **headteacher unlocks** it. The teacher sends an **unlock request** via message from the Mark Attendance page.

**Do not write:** “Teachers reopen attendance for late students to count them as present” — that is **not** how the built system works.

### Figure 4.4 — Late status and/or unlock request

**Option A — Late marking (recommended for 4.4):**  
Same page as 4.3, with **late** button highlighted/selected before Confirm & Next.

**Caption:** *Figure 4.4 Recording late arrival using the Late status button*

**Option B — Locked day correction:**  
Open a **locked** date → amber **Attendance locked** card → “Notify headteacher” → message box → **Send unlock request**.

**Caption (if used):** *Figure 4.4 Attendance unlock request sent to the headteacher*

**Headteacher side (describe in text; optional extra figure):** On `/headteacher/dashboard`, section **Attendance unlock requests** with **Unlock** button—capture if you need two figures for correction workflow.

**Sample paragraph:**

> Figure 4.4 demonstrates late attendance recording. Students who arrive late are marked with the Late status. When attendance for a date is locked after submission, teachers request an unlock from the headteacher with a short message, supporting accurate records without leaving registers editable indefinitely.

---

## 4.7 GPS-Based Attendance Restriction

GPS is **configured by the headteacher** and **checked for the teacher** when submitting attendance (if enabled for the school).

**Headteacher — set boundary:** On the headteacher dashboard, scroll to **School location** (latitude, longitude, radius in metres, **Use current location**, **Save**).

**Teacher — verification at submit:** After all students are marked, panel **School location check** with message e.g. within school boundary, with **Refresh location** and **Submit Attendance** (disabled if outside boundary).

### Figure 4.5 — School GPS configuration (headteacher)

**Where to capture:** Headteacher → `/headteacher/dashboard` → scroll to **School location** section.

**Caption:** *Figure 4.5 Headteacher configuring school GPS boundary for attendance marking*

**Must show:** Latitude, longitude, radius fields; **Use current location**; **Save** (or saved coordinates visible).

### Figure 4.6 — School location check (teacher)

**Where to capture:** Teacher → Mark Attendance → complete all students → **School location check** visible (school must have GPS configured).

**Caption:** *Figure 4.6 GPS verification before submitting attendance*

**Must show:** “School location check” heading, status message (green = OK or red = outside), **Submit Attendance** button.

**Note for report:** If GPS is not configured for demo school, state in text that marking works without geo-fence and show Figure 4.5 only.

**Sample paragraph:**

> Based on headteacher feedback that registers should not be completed away from school, EduTrackGH restricts submission to within a configurable radius of the school coordinates. Figure 4.5 shows the headteacher setting the boundary; Figure 4.6 shows the teacher’s location check at submit time.

---

## 4.8 Absentee Monitoring and Reporting

**Built reporting tools:**

1. **Headteacher — Class Registers** (`/headteacher/registers`): GES **term** or **month** view, colour-coded cells (present/late/absent), weekly and term **P / A / L** totals, **Rate %**, summary cards (On Roll, Present incl. late, Total Absent, Late, Overall Rate), **CSV/Excel** export.  
2. **Teacher — Attendance History** (`/teacher/history`): Same register component for the teacher’s class(es).  
3. **Teacher — Flagged Students** (`/teacher/flagged`): Students with **chronic absenteeism** over the last month (by classroom).

There is **no separate page** titled “Frequently absent students” with a search filter—the **Flagged Students** page and **Registers** fulfil this role.

### Figure 4.7 — Class attendance register (headteacher)

**Where to capture:** Headteacher → **Registers** → `/headteacher/registers` → select class → **Term** view with data visible.

**Caption:** *Figure 4.7 GES-aligned class attendance register with totals and attendance rate*

**Must show:**

- Title **Class Registers**  
- Class selector, Term/Month toggle, GES term buttons  
- Register grid with student names and day marks  
- Term total **P / A / L** and **Rate %** column  
- Bottom summary row (On Roll, Present incl. late, etc.)  

### Figure 4.8 — Flagged students (teacher)

**Where to capture:** Teacher → **Flagged Students** → `/teacher/flagged`

**Caption:** *Figure 4.8 Flagged students with chronic absenteeism*

**Must show:** Classroom dropdown, list/table of flagged students with absence-related metrics (as displayed on your seeded data).

**Sample paragraph:**

> Figure 4.7 replaces manual register tracing with a digital GES-aligned register and calculated rates from stored marks. Figure 4.8 supports early identification of learners with repeated absences, addressing the delayed absentee detection described in Chapter Two.

---

## 4.9 Parent Notification Feature

When a teacher **submits** attendance, linked parents receive **in-app notifications** (and email through the system). Notifications are created for **present, late, and absent** marks. **SMS** (Hubtel) is sent for **absent and late only** when SMS is enabled on the server—not for every present mark.

Parents view alerts at **Notifications** (`/parent/notifications`).

### Figure 4.9 — Parent notifications interface

**Where to capture:** Parent account → **Notifications** → `/parent/notifications` (after at least one attendance submit for their child).

**Caption:** *Figure 4.9 Parent notifications for student attendance (present, late, or absent)*

**Must show:**

- Page title **Notifications**  
- Subtitle about SMS and email alerts  
- **Unread** count  
- Notification cards with child name, status, date, message  
- Icons/colours for **present** (green), **late** (orange), **absence** (red) if visible  
- **Mark as read** on unread items  

**Do not claim in caption:** “Parent contact button” on this screen—contact is via stored parent phone/email used by the system, not a manual dial button on this page.

**Sample paragraph:**

> Figure 4.9 shows parent notifications generated after attendance submission. Parents see when a child was marked present, late, or absent, improving school–home communication in line with the truancy case discussed in the literature review and interview.

---

## 4.10 System Testing

Testing was **manual functional testing** against the implemented modules (login, marking, GPS when enabled, registers, notifications).

### Table 4.1 — Test results (aligned with built features)

| Test activity | Steps (actual system) | Expected result | Actual result | Status |
|---------------|------------------------|-----------------|---------------|--------|
| User login | Teacher email + password at `/login` | Redirect to teacher dashboard | As expected | Passed |
| Attendance marking | Mark class one student at a time; Submit | Records saved; day locked | As expected | Passed |
| Late status | Mark at least one student **Late** | Late stored; appears in register | As expected | Passed |
| GPS verification | Submit with school location configured | Blocked outside radius; allowed inside | As expected* | Passed |
| Register / rates | Open headteacher Registers, Term view | P/A/L and % match marked days | As expected | Passed |
| Flagged students | Open `/teacher/flagged` | List shows high-absence learners | As expected | Passed |
| Parent notification | Submit present, late, absent | Parent sees alerts in app | As expected | Passed |
| Unlock request | Teacher requests unlock on locked date | Headteacher sees request on dashboard | As expected | Passed |

\*GPS row: mark **N/A** or **Not tested** if demo school had no coordinates set during testing.

---

## 4.11 Discussion of Results

The implemented EduTrackGH system shows that **digital attendance** can address problems identified at UDS Basic School:

| Interview / literature issue | How implementation addresses it |
|------------------------------|----------------------------------|
| Teacher forgetfulness | Compliance view for headteacher; unmarked class stats on teacher dashboard |
| Manual absentee tracing | Registers and flagged students |
| Delayed parent contact | Automatic notifications on submit |
| Registers taken home | Optional GPS boundary on submit |
| Slow marking (no facial recognition) | One-tap Present/Late/Absent per student |

**Limitations observed during testing:** Requires internet at marking time; GPS accuracy varies by device; campus networks may block hosting URLs (DNS issue, not application logic); full term pilot in multiple schools was outside project scope.

---

## 4.12 Chapter Summary

This chapter presented the **actual EduTrackGH interfaces** and specified **exact screenshots** for Figures 4.1–4.9 from live pages in the deployed system. It corrected common assumptions (bulk student grid, username login, absent-only notifications) and tied each figure to a **role, route, and visible elements** from the implementation.

The screenshots serve as visual evidence that EduTrackGH supports attendance marking, late/absent monitoring, GES registers, GPS accountability, and parent alerts for UDS Basic School and similar basic schools in Ghana.

---

## List of figures (Chapter Four)

| Figure | Title |
|--------|--------|
| 4.1 | EduTrackGH login page (email and password) |
| 4.2 | Teacher dashboard with navigation and summary cards |
| 4.3 | Mark Attendance — one student at a time |
| 4.4 | Late status and/or attendance unlock request |
| 4.5 | Headteacher school GPS boundary configuration |
| 4.6 | Teacher school location check before submit |
| 4.7 | Headteacher class attendance register (term view) |
| 4.8 | Flagged students (chronic absenteeism) |
| 4.9 | Parent notifications (present, late, absent) |

---

*End of refined Chapter Four — copy into Word and insert screenshots at each Figure marker.*
