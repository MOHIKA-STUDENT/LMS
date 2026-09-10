'use client';

import Link from 'next/link';
import { KeyRound, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        <p className="text-sm text-slate-400">
          Clerk Auth manages password resets safely. Click "Forgot password?" directly on the login screen.
        </p>

        <Link
          href="/login"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
