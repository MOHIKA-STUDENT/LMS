import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Shield, Users, Sparkles, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'TEACHER') {
      redirect('/admin/batches');
    } else {
      redirect('/student/timeline');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-2 font-extrabold text-xl text-indigo-400">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          <span>English<span className="text-white">Academy</span> LMS</span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all"
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
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Next.js 14 • Supabase • Gemini AI • Offline-First PWA</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Enterprise Learning Management System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">English Tutors</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
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
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-2xl flex items-center justify-center space-x-2 text-base transition-all"
          >
            <span>Access Portal</span>
          </Link>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        © 2026 English Tutors Academy. 100% Free-Tier Architecture.
      </footer>
    </div>
  );
}
