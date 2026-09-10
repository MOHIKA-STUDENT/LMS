# 📚 English Tutors Academy - Enterprise LMS

A high-performance, offline-first Learning Management System (LMS) built with **Next.js 14 (App Router)**, **Supabase (PostgreSQL + RLS)**, **Google Gemini AI**, and **Dexie.js (IndexedDB PWA)**.

---

## ✨ Features

- 🔐 **Role-Based Access Control**: Separate Teacher (Admin) and Student portals with strict Next.js Middleware route guards.
- 🎯 **Batch / Group Engine**: Filter quizzes, homework assignments, schedule timelines, and study materials strictly by student batch assignment.
- 🤖 **Gemini AI Quiz Engine**: Automatically generate 5-question CEFR-aligned English quizzes (A1-C2) based on custom topics.
- ✍️ **AI Homework Proofreader**: Instant server-side grammar, spelling, and structural feedback for student text submissions.
- 📴 **Offline-First PWA & Auto-Reconciliation**: Submissions and quizzes taken offline are cached in IndexedDB via Dexie.js and auto-synced upon reconnecting.
- 🛡️ **Asset Size Shield**: Frontend interceptor enforcing 5MB upload limits and browser-side image compression.
- 🏆 **Gamified Leaderboards**: Real-time point tracking and global/batch rankings.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (TypeScript, App Router, Server Actions)
- **Database & Auth**: Supabase (PostgreSQL with Row-Level Security)
- **Storage**: Supabase Storage Buckets
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Offline Storage**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS & Lucide Icons
- **Notifications**: Sonner

---

## 🚀 Quick Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MOHIKA-STUDENT/LMS.git
   cd LMS
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and add your Supabase and Gemini credentials:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security Policy

- Environment secrets (`.env.local`) are strictly excluded via `.gitignore`.
- API keys execute strictly on the server layer to prevent client-side key leakage.
- Database access is protected with strict PostgreSQL Row-Level Security policies.
