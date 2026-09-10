'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">English Academy LMS</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in with Clerk Auth</p>
        </div>

        <SignIn
          routing="hash"
          appearance={{
            elements: {
              card: 'bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-slate-400 text-xs',
              socialButtonsBlockButton: 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700',
              formFieldLabel: 'text-slate-300 text-xs font-semibold uppercase',
              formFieldInput: 'bg-slate-800/80 border-slate-700 text-white rounded-xl text-sm focus:border-indigo-500',
              formButtonPrimary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-semibold',
            },
          }}
        />
      </div>
    </div>
  );
}
