import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Shield, Users, Sparkles, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    const role = (user.publicMetadata as any)?.role || 'STUDENT';
    if (role === 'TEACHER') {
      redirect('/admin/batches');
    } else {
      redirect('/student/timeline');
    }
  }

  return (
    <div className="min-h-screen bg-theme-main text-theme-main flex flex-col justify-between transition-colors duration-200">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-theme">
        <div className="flex items-center space-x-2 font-extrabold text-xl text-indigo-500">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          <span>English<span className="text-theme-main">Academy</span> LMS</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-theme-sub hover:text-theme-main bg-theme-card-sub border border-theme rounded-xl transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 text-center max-w-4xl space-y-8">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-600 dark:text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Next.js 16 • Clerk Auth • Neon PostgreSQL • Cloudinary • Gemini AI</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-theme-main">
          Enterprise Learning Management System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">English Tutors</span>
        </h1>

        <p className="text-theme-sub text-base sm:text-lg max-w-2xl mx-auto">
          Manage student batches, generate Gemini AI CEFR quizzes, proofread homework assignments, schedule live Zoom classes, and sync offline seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-base transition-all"
          >
            <span>Register Your Account</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-theme-card-sub border border-theme hover:opacity-90 text-theme-main font-bold rounded-2xl flex items-center justify-center space-x-2 text-base transition-all"
          >
            <span>Access Portal</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-theme py-6 text-center text-xs text-theme-sub">
        © 2026 English Tutors Academy. 100% Free-Tier Architecture.
      </footer>
    </div>
  );
}
