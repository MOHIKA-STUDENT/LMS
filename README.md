# English Tutors Academy LMS 🎓

> **An MNC Production-Grade, Offline-First Learning Management System built with Next.js 16, Clerk Auth, Neon PostgreSQL, Prisma ORM, Cloudinary CDN, Google Gemini AI, and Mobile PWA Support.**

---

## ✨ Features Breakdown

### 👨‍🏫 Teacher Admin Dashboard
- **Batch Management**: Create and manage student batches (A1-C2 CEFR levels) with schedule timings and live Zoom meeting links.
- **Roster & Permission Control**: View student profiles, assign batches, toggle portal access (Active/Suspended), and edit details.
- **Attendance & Fee Tracker**: Record daily student presence (`PRESENT`, `ABSENT`, `LATE`) and track tuition fee statuses (`PAID`, `PENDING`, `OVERDUE`).
- **Recorded Sessions & Watch Analytics**: Post class video recordings and monitor live student watch engagement (who watched, watched duration, completion %, and who missed out).
- **Course Materials Vault**: Upload study guides (.pdf, .ppt, .docx) to Cloudinary with 5MB client compression shield. Supports **Specific Batch** OR **All Batches (Global)** target scope.
- **AI & Manual Quiz Studio**:
  - **Gemini Chat Generator**: Generate 5-question CEFR quizzes from natural prompts.
  - **Google Forms Parser**: Paste raw quiz text from Google Forms or ChatGPT and convert into editable quiz cards.
  - **Draft Preview & Editor**: Review and modify questions, options, and explanations before publishing.
  - **Publish Scope**: Publish quizzes to **All Batches (Global)** or a **Specific Batch**.
- **Homework Terminal & AI Grading**: View student submissions, run AI proofread reports, and award scores.

### 🎓 Student Learning Portal
- **Interactive Timeline**: View weekly class schedules and join live Zoom classes with 1-click.
- **Class Recordings Vault**: Stream recorded live sessions with automatic watch progress tracking.
- **Fees & Attendance Status**: Check personal attendance rates and fee payment dues.
- **Daily Quiz Arena**: Take CEFR multiple choice quizzes and view **step-by-step explanations revealed ONLY AFTER test submission**.
- **Gamified Leaderboard**: Filter by Global Rank or Batch Rank. Only students compete for points (Teachers excluded).
- **Settings & Profile Customization**: Update display name and upload custom PFP avatar pictures to Cloudinary CDN.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Authentication**: Clerk Auth (`@clerk/nextjs` v7)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: Prisma Client v6.4.0
- **Cloud Storage**: Cloudinary CDN
- **Artificial Intelligence**: Google Gemini 2.5 AI (`@google/genai`)
- **Offline Storage**: Dexie.js (IndexedDB)
- **PWA**: Web App Manifest (`manifest.json`)
- **Styling**: Tailwind CSS v4 + Vanilla CSS (Dark & Light Mode)

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

3. **Configure `.env.local`**:
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

1. Connect your repository `MOHIKA-STUDENT/LMS` to **[Vercel](https://vercel.com)**.
2. Add your environment variables in Vercel project settings.
3. Click **Deploy**!
