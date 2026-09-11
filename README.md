# Vedayan LMS — Enterprise Multi-Tenant Learning Management System 🎓

> **An MNC Production-Grade, Offline-First, Multi-Tenant Learning Management System built with Next.js 16 (Turbopack), Clerk Auth, Neon Serverless PostgreSQL, Prisma ORM, Cloudinary CDN, Google Gemini 2.5 AI, and PWA Support.**

---

## ✨ Key Architectural Highlights & Enterprise Features

### 🏢 1. Multi-Tenant Institution Architecture (Moodle / Teams Style)
- **Isolated Organization Workspaces**: Every college, institute, or tuition center operates in complete data isolation using an `Institution` model.
- **Private Join Code Privacy & Concealment**: Raw workspace join codes (e.g. `MOA12`) are strictly concealed behind eye-toggles and copy buttons inside the Teacher Workspace Modal to prevent accidental leaks on screenshots or main navigation displays.
- **Student Access Approval Gate**: When a new user signs up, their account remains in `PENDING` status until an institution teacher explicitly approves (`APPROVED`) their access request via the Roster dashboard.
- **Zero Cross-Tenant Data Leaks**: Quizzes, materials, homework, recordings, leaderboards, and rosters enforce database-level `institutionId` query filtering.

### 🛡️ 2. Clerk Session Sync & Database Account Cleanup
- **Real-Time Clerk Webhooks (`/api/webhooks/clerk`)**: Automatically syncs user creation (`user.created`), profile updates (`user.updated`), and account deletions (`user.deleted`).
- **Cascade Account Cleanup**: When a user account is deleted, all associated submissions (`HomeworkSubmission`, `QuizSubmission`), attendance records, and database profiles are wiped cleanly from Neon PostgreSQL.
- **Re-registration Security**: Seamlessly allows users to re-register with an email from a previously deleted Clerk account without encountering database unique constraint errors.

### 👨‍🏫 3. Teacher Admin Panel
- **Batch Engine & Auto Join Codes**: Create CEFR batches (A1-C2) with schedule timings and Zoom links.
- **Masterclass Broadcast**: Broadcast 1 Zoom meeting link to all active batches simultaneously.
- **Roster & Access Request Manager**: Review pending student access requests with 1-click Approve/Reject controls, assign batches, or suspend access.
- **Attendance & Fee Ledger**: Record daily attendance (`PRESENT`, `ABSENT`, `LATE`) and track tuition fees with date-by-date student history reports.
- **Course Materials Vault**: Upload study guides (.pdf, .docx, .ppt) to Cloudinary CDN with specific batch or institution global targeting.
- **AI Quiz Studio**:
  - **Gemini Chat AI Generator**: Generate CEFR multiple-choice quizzes from natural language prompts.
  - **PPT Slide & Document AI Builder**: Upload PowerPoint slides or study notes to generate quizzes tailored directly to lecture slides.
  - **ChatGPT & Text Parser**: Convert raw text into interactive quizzes.

### 🎓 4. Student Portal
- **Interactive Timeline & Zoom Integration**: View weekly class schedules and join live Zoom classes with 1 click.
- **Class Recordings Vault**: Stream recorded live sessions with automatic watch progress logging.
- **Offline PWA & Mobile Navigation**:
  - Offline-first caching via Dexie.js (IndexedDB).
  - 5-tab Mobile Bottom Navigation Bar (`Schedule`, `Quizzes`, `Homework`, `Vault`, `More...`).
  - Slide-over profile drawer with theme switcher (Light/Dark mode) and PWA app installer.

---

## 🛠️ Tech Stack & Technologies

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Authentication**: Clerk Auth (`@clerk/nextjs` v7) + Webhooks (`svix`)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Prisma Client v6.4.0
- **Cloud Storage**: Cloudinary CDN (`next-cloudinary`)
- **Artificial Intelligence**: Google Gemini 2.5 AI (`@google/genai`)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Mobile PWA**: Web App Manifest (`manifest.json`) + App Icons
- **Styling**: Tailwind CSS v4 + Vanilla CSS Variables

---

## 🚀 Local Setup & Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/MOHIKA-STUDENT/LMS.git
   cd LMS
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env.local`)**:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   DATABASE_URL=postgresql://...

   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 📱 Mobile App (PWA) & Play Store Setup

- **Android (Chrome)**: Open live URL $\rightarrow$ Tap 3 dots menu $\rightarrow$ **"Add to Home Screen"** or **"Install App"**.
- **iOS (Safari)**: Open live URL $\rightarrow$ Tap Share icon $\rightarrow$ **"Add to Home Screen"**.
- **Google Play Store (TWA)**:
  - Generate an APK/AAB bundle via [PWABuilder](https://www.pwabuilder.com/) using your Vercel deployment URL.
  - Code changes pushed to GitHub automatically update live inside the installed app without requiring app store updates!

---

## 🌐 Production Deployment (Vercel)

1. Connect repository `MOHIKA-STUDENT/LMS` to **Vercel**.
2. Add environment variables in Vercel project settings.
3. Configure build command: `"build": "prisma generate && next build"`.
4. Deploy!
