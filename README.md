# EduComm — A Comprehensive Communication and Collaboration Platform for Education

EduComm is a unified academic communication platform for students and lecturers. It
replaces the usual sprawl of WhatsApp, Telegram, Discord and email with one
academic-first workspace, and it translates messages in real time so that students and
staff who do not share a language can still work together.

This was my final year project (PSM) for the Bachelor of Computer Science (Software
Engineering) at **Universiti Teknologi Malaysia**, completed July 2025.

> **This repository is the React front end.** The Next.js API backend lives in
> [`educomm-backend`](https://github.com/Seifeldin02/educomm-backend).

---

## The problem

Academic communication is scattered across general-purpose chat apps that were never
designed for teaching. Messages get lost between platforms, there is no structure for
organising discussion by course or topic, and in a classroom as linguistically diverse
as UTM's, language itself becomes a barrier.

## Project objectives

1. **Build a unified communication platform** — group chats, direct messages and
   dedicated topic areas, so academic conversation lives in one place.
2. **Implement AI translation** — remove the language barrier for international
   students and lecturers.
3. **Test with real users** — validate practicality with UTM Faculty of Computing
   students and lecturers, and feed the results back into the product.

---

## Features

### Communication
- Group chats with member management (add, remove, edit group)
- Direct messages between users
- Topic-based course forums for structured discussion
- File upload and sharing
- Real-time delivery over WebSockets

### Real-time translation
Messages are translated inline using **LibreTranslate, self-hosted in Docker**. The
backend calls a `detect` endpoint to identify each message's language and a `translate`
endpoint to convert it. Running the engine locally rather than against a paid cloud API
keeps every message private to the deployment — no chat content leaves the system.

### Roles and access control
Students and lecturers get separate dashboards and separate route trees
(`StudentRoute`, `LecturerRoute`, `ProtectedRoute`, `PublicRoute`). Role is chosen at
registration and enforced on both the client routes and the backend endpoints.

### Academic management
- Courses, course details and course materials
- Assignments — lecturers create and review submissions, students submit
- Activity reports, exportable to PDF via jsPDF

### Accounts
- Firebase Authentication with email verification
- Sign in with **either** username or email — a `get-email` endpoint resolves a
  username to its address before authenticating
- Enforced username uniqueness, checked server-side
- Profile management backed by Firestore

---

## Architecture

The system follows an MVC separation across two deployables:

```
┌─────────────────────────┐        ┌──────────────────────────┐       ┌──────────────┐
│  EduComm front end      │  REST  │  educomm-backend         │       │ LibreTranslate│
│  React + Vite + TS      │ ─────► │  Next.js API routes      │ ────► │ (Docker)      │
│  (this repository)      │   WS   │  users/, groups/, ws/    │       │ detect + translate
└─────────────────────────┘        └──────────┬───────────────┘       └──────────────┘
                                              │
                                      ┌───────▼────────┐
                                      │ Firebase       │
                                      │ Auth + Firestore│
                                      └────────────────┘
```

**Front end (this repo)**
```
src/
├── components/
│   ├── chat/          # ChatHeader, ChatInput, ChatSidebar, GroupChat,
│   │   └── dialogs/   # DirectMessages, Message, FileUpload, MemberItem
│   ├── course/        # CourseDetailPage, CourseAssignmentsPage, CourseMaterialsPage
│   ├── layout/        # Header, Sidebar, Layout
│   ├── routes/        # StudentRoute, LecturerRoute, ProtectedRoute, PublicRoute
│   └── ui/            # Radix-based primitives
├── hooks/chat/        # useMessages, useDMChats, useDirectMessages, useGroupManagement
├── views/
│   ├── student/       # Dashboard, Courses, Assignments, Groups, Messages, Reports
│   ├── lecturer/      # Dashboard, CourseManage, AssignmentSubmissions, Reports
│   ├── forum/         # CourseTopicsPage, TopicDetailPage
│   └── register/      # RoleSelector, RegisterForm, student/ and lecturer/ flows
├── firebase/          # auth.ts, firebaseConfig.ts
└── config/api.ts
```

**Backend** — Next.js API routes for `users/` (create, check-username, get-email,
get-username, update-profile, verify-role, search) and `groups/` (create, list,
members, messages), with shared `lib/` for auth, CORS, middleware and the WebSocket
layer. Firebase Admin SDK validates JWTs on every protected endpoint.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | React 18 + Vite |
| Language | TypeScript |
| Routing | React Router |
| State | Zustand |
| Forms & validation | React Hook Form + Zod |
| UI | Radix UI primitives, Tailwind CSS, Framer Motion, Lucide, Sonner |
| Auth & data | Firebase Authentication, Firestore |
| Backend | Next.js API routes (separate repository) |
| Translation | LibreTranslate, self-hosted via Docker |
| PDF export | jsPDF + jspdf-autotable |
| Hosting | Firebase Hosting |

---

## Running it locally

```bash
git clone -b Deployed https://github.com/Seifeldin02/EduComm.git
cd EduComm
npm install
```

Create a `.env` with your own Firebase project credentials and the backend URL:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

```bash
npm run dev     # http://localhost:5173
npm run build   # tsc -b && vite build
npm run lint
```

The backend and a LibreTranslate container both need to be running — see
[`educomm-backend`](https://github.com/Seifeldin02/educomm-backend).

---

## Testing

The platform was validated three ways, documented in Chapter 5 of the thesis:

**Black box** — each user-facing flow driven through valid and invalid inputs, checking
responses and error handling against the specification.

**White box** — every major module walked branch by branch: username uniqueness, email
domain validation, email-verification state, role-based access, token expiry, and
failure of the translation API.

**User testing** — five UTM participants who had taken no part in development (three
students, two lecturers) each ran a scripted set of tasks and reported back. Registration
and login were found quick and clear, and chat and translation usable in real time.
The feedback produced a short list of fixes: more visible error messages and a
show/hide toggle on password fields.

There is no automated test suite. That is the main thing I would change, and it is why
the next project I built ([CodeProof](https://github.com/Seifeldin02/CodeProof)) was
written test-first and now carries 99 automated tests.

---

## Branches

| Branch | Contents |
| --- | --- |
| `Deployed` | The complete application — **start here** |
| `sprint/1`, `sprint2`, `sprint3`, `sprint4` | Development history by sprint |
| `bug-fixes-` | Post-sprint fixes |
| `main` | Initial Vite scaffold only |

---

## Author

**Seifeldin Mahmoud**
[GitHub](https://github.com/Seifeldin02) · [LinkedIn](https://linkedin.com/in/seifeldin02) · [Portfolio](https://seifeldin-portfolio.vercel.app)
