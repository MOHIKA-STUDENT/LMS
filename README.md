# English Tutors Academy LMS 🎓

> **An MNC Production-Grade, Offline-First Learning Management System built with Next.js 16, Clerk Auth, Neon Serverless PostgreSQL, Prisma ORM, Cloudinary CDN, Google Gemini AI, and Mobile PWA Support.**

---

## ✨ System Features & Capabilities

### 👨‍🏫 Teacher Admin Panel
- **Strict Teacher Data Isolation (`teacherId`)**: Each teacher owns and manages their own batches, students, materials, and fee records. Teacher B cannot view or modify Teacher A's students.
- **Batch Engine & Auto Join Codes**: Create batches (A1-C2 CEFR levels) with schedule timings and Zoom links. Each batch receives a unique 6-character **Batch Join Code** (e.g. `SPOK-492`).
- **Batch Editing & Deletion**: Update batch info, schedule timings, or delete batches in 1 click.
- **Masterclass Zoom Broadcast**: Broadcast 1 Zoom meeting link to ALL your batches simultaneously for joint sessions or webinars.
- **Roster & Access Control**: Manage student accounts, assign batches, edit details, or suspend access for students who left the class.
- **Attendance & Fee Ledger**: Record daily attendance (`PRESENT`, `ABSENT`, `LATE`) and track tuition fees (`PAID`, `PENDING`, `OVERDUE`).
- **Recorded Sessions & Watch Analytics**: Stream recorded classes with live watch progress logging (watched duration, completion %, and student view logs).
- **Course Materials Vault**: Upload study guides (.pdf, .docx, .ppt) to Cloudinary with target scope (**Specific Batch** OR **All Batches (Global)**).
- **AI & Manual Quiz Studio**:
  - **Gemini Chat AI Generator**: Generate CEFR multiple-choice quizzes from natural prompts.
  - **Google Forms & ChatGPT Parser**: Paste raw quiz text to convert into interactive quizzes.
  - **Draft Preview & Explanations**: Edit questions and step-by-step answer explanations before publishing.
- **Homework & Grading Terminal**: Review student homework files and award scores.

### 🎓 Student Portal
- **Batch Join Code Self-Enrollment**: Enter your teacher's 6-character Join Code (`ENG-101`) to automatically enroll in class.
- **Interactive Schedule & Zoom Link**: View weekly class schedules and join live Zoom classes with 1-click.
- **Class Recordings Vault**: Stream recorded live sessions with automatic watch progress logging.
- **Fees & Attendance Tracker**: Check personal attendance rates and fee payment statuses.
- **Daily Quiz Arena**: Take CEFR multiple-choice quizzes with **step-by-step explanations revealed ONLY AFTER test submission**.
- **Gamified Leaderboard**: Rank among active enrolled students for points.
- **Account Customization & PFP Avatar**: Update display name and upload custom PFP avatar images to Cloudinary CDN.
- **Light & Dark Theme Switcher**: Toggle between Dark and Light themes across all pages.

---

## 🛠️ Tech Stack & Technologies

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Authentication**: Clerk Auth (`@clerk/nextjs` v7)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Prisma Client v6.4.0
- **Cloud Storage**: Cloudinary CDN (`next-cloudinary`)
- **Artificial Intelligence**: Google Gemini 2.5 AI (`@google/genai`)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Mobile PWA**: Web App Manifest (`manifest.json`)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Variables

---

## 🚀 Quick Start (Local Setup)

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
   NEXT_PUBLIC_TEACHER_SIGNUP_CODE=TEACHER2026
   ```

4. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser!

---

## 📱 Mobile App (PWA) Installation

- **Android (Chrome)**: Open live URL $\rightarrow$ Tap 3 dots menu $\rightarrow$ **"Add to Home Screen"** or **"Install App"**.
- **iOS (Safari)**: Open live URL $\rightarrow$ Tap Share icon $\rightarrow$ **"Add to Home Screen"**.

---

## 🌐 Production Deployment (Vercel)

1. Connect repository `MOHIKA-STUDENT/LMS` to **Vercel**.
2. Add environment variables in Vercel project settings.
3. Update build script in `package.json`: `"build": "prisma generate && next build"`.
4. Click **Deploy**!
