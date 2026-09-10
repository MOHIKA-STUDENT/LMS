import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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
      {/* Header */}
      <header className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between border-b border-theme gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 font-extrabold text-base sm:text-xl text-indigo-500 shrink-0">
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
          <span className="truncate max-w-[150px] sm:max-w-none">
            English<span className="text-theme-main">Academy</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-theme-sub hover:text-theme-main bg-theme-card-sub border border-theme rounded-xl transition-all whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 sm:py-16 text-center max-w-4xl space-y-6 sm:space-y-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-600 dark:text-indigo-300 text-[11px] sm:text-xs font-semibold max-w-full overflow-hidden truncate">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Next.js 16 • Clerk Auth • Neon PostgreSQL • Cloudinary • Gemini AI</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black tracking-tight leading-tight text-theme-main">
          Enterprise Learning Management System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">English Tutors</span>
        </h1>

        <p className="text-theme-sub text-sm sm:text-lg max-w-2xl mx-auto px-2">
          Manage student batches, generate Gemini AI CEFR quizzes, proofread homework assignments, schedule live Zoom classes, and sync offline seamlessly.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 text-sm sm:text-base transition-all"
          >
            <span>Register Your Account</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-theme-card-sub border border-theme hover:opacity-90 text-theme-main font-bold rounded-2xl flex items-center justify-center space-x-2 text-sm sm:text-base transition-all"
          >
            <span>Access Portal</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-theme py-6 text-center text-xs text-theme-sub">
        © 2026 English Tutors Academy. 100% Free-Tier Architecture.
      </footer>
    </div>
  );
}
