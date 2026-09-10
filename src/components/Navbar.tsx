'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Profile } from '@/types/database';
import { BookOpen, Users, Calendar, FileText, Sparkles, Award, LayoutDashboard, CheckSquare, Settings } from 'lucide-react';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata as any)?.role || (user?.unsafeMetadata as any)?.role || profile?.role || 'STUDENT';
  const isTeacher = role === 'TEACHER';

  const teacherLinks = [
    { href: '/admin/batches', label: 'Batches', icon: LayoutDashboard },
    { href: '/admin/roster', label: 'Roster & Points', icon: Users },
    { href: '/admin/materials', label: 'Materials', icon: BookOpen },
    { href: '/admin/quiz-gen', label: 'AI Quiz Gen', icon: Sparkles },
    { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
    { href: '/admin/grading', label: 'Grading', icon: CheckSquare },
  ];

  const studentLinks = [
    { href: '/student/timeline', label: 'Schedule', icon: Calendar },
    { href: '/student/quizzes', label: 'Quizzes', icon: Sparkles },
    { href: '/student/notes', label: 'Vault', icon: BookOpen },
    { href: '/student/homework', label: 'Homework', icon: FileText },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Award },
  ];

  const navLinks = isTeacher ? teacherLinks : studentLinks;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={isTeacher ? '/admin/batches' : '/student/timeline'} className="flex items-center space-x-2 font-bold text-xl text-indigo-400 hover:text-indigo-300 transition-colors">
          <BookOpen className="w-7 h-7 text-indigo-500" />
          <span>English<span className="text-white">Academy</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Clerk UserButton */}
        <div className="flex items-center space-x-3">
          {isLoaded && user && (
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="font-semibold text-slate-100 max-w-[140px] truncate">
                {user.fullName || user.primaryEmailAddress?.emailAddress}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono font-medium">
                {role} {role === 'STUDENT' && profile ? `• ${profile.points} pts` : ''}
              </span>
            </div>
          )}

          {!isTeacher && (
            <Link
              href="/student/settings"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold"
              title="Account Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}

          <UserButton />
        </div>
      </div>
    </header>
  );
}
