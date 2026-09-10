'use client';

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import { BookOpen, Shield, Users, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [teacherPasscode, setTeacherPasscode] = useState('');
  const [passcodeVerified, setPasscodeVerified] = useState(false);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredCode = process.env.NEXT_PUBLIC_TEACHER_SIGNUP_CODE || 'TEACHER2026';
    if (teacherPasscode.trim() === requiredCode) {
      setPasscodeVerified(true);
      toast.success('Teacher Security Passcode verified!');
    } else {
      toast.error('Invalid Teacher Security Passcode! Students cannot register as Teacher.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 flex flex-col items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-sm text-slate-400 mt-1">Join English Academy with Clerk Auth</p>
        </div>

        {/* Role Selector */}
        <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Account Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('STUDENT');
                setPasscodeVerified(false);
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-semibold transition-all ${
                role === 'STUDENT'
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-semibold transition-all ${
                role === 'TEACHER'
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Teacher</span>
            </button>
          </div>

          {role === 'TEACHER' && !passcodeVerified && (
            <form onSubmit={handleVerifyPasscode} className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl space-y-2 pt-3">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center space-x-1">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>Teacher Security Passcode</span>
              </label>
              <input
                type="password"
                required
                value={teacherPasscode}
                onChange={(e) => setTeacherPasscode(e.target.value)}
                placeholder="Enter academy secret passcode (TEACHER2026)"
                className="w-full px-4 py-2 bg-slate-900 border border-purple-700/60 rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-400 text-xs font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs transition-all"
              >
                Verify Passcode to Unlock Teacher Registration
              </button>
            </form>
          )}
        </div>

        {(role === 'STUDENT' || passcodeVerified) && (
          <SignUp
            unsafeMetadata={{
              role: role,
            }}
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
        )}
      </div>
    </div>
  );
}
