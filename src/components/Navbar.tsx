'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Profile } from '@/types/database';
import { formatStudentDisplayName } from '@/lib/utils/format-name';
import { useTheme } from '@/components/ThemeProvider';
import {
  BookOpen,
  Users,
  Calendar,
  FileText,
  Sparkles,
  Award,
  LayoutDashboard,
  CheckSquare,
  Settings,
  Video,
  CreditCard,
  UserCheck,
  Sun,
  Moon,
  Download,
  User,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('LMS App installed successfully!');
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        "To Install App:\n- Android Chrome: Tap 3 dots menu -> 'Install App'\n- iPhone Safari: Tap Share button -> 'Add to Home Screen'",
        { duration: 6000 }
      );
    }
  };

  const role = (user?.publicMetadata as any)?.role || (user?.unsafeMetadata as any)?.role || profile?.role || 'STUDENT';
  const isTeacher = role === 'TEACHER';

  const displayName = formatStudentDisplayName(
    profile?.fullName,
    user?.primaryEmailAddress?.emailAddress,
    user?.username || user?.fullName || user?.firstName
  );

  const teacherLinks = [
    { href: '/admin/batches', label: 'Batches', icon: LayoutDashboard },
    { href: '/admin/roster', label: 'Roster', icon: Users },
    { href: '/admin/attendance-fees', label: 'Attendance & Fees', icon: CreditCard },
    { href: '/admin/recordings', label: 'Recordings', icon: Video },
    { href: '/admin/materials', label: 'Materials', icon: BookOpen },
    { href: '/admin/quiz-gen', label: 'Quizzes', icon: Sparkles },
    { href: '/admin/grading', label: 'Grading', icon: CheckSquare },
  ];

  const studentLinks = [
    { href: '/student/timeline', label: 'Schedule', icon: Calendar },
    { href: '/student/recordings', label: 'Recordings', icon: Video },
    { href: '/student/fees-attendance', label: 'Fees & Attendance', icon: UserCheck },
    { href: '/student/quizzes', label: 'Quizzes', icon: Sparkles },
    { href: '/student/notes', label: 'Vault', icon: BookOpen },
    { href: '/student/homework', label: 'Homework', icon: FileText },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Award },
  ];

  const navLinks = isTeacher ? teacherLinks : studentLinks;

  return (
    <>
      <header className="sticky top-0 z-40 bg-theme-nav backdrop-blur border-b border-theme text-theme-main transition-colors duration-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href={isTeacher ? '/admin/batches' : '/student/timeline'}
            className="flex items-center space-x-2 font-bold text-lg sm:text-xl text-indigo-600 dark:text-indigo-400 hover:opacity-90 transition-opacity shrink-0"
          >
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
            <span>
              English<span className="text-theme-main">Academy</span>
            </span>
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
                      ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 font-bold'
                      : 'text-theme-sub hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-theme-main'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Header Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* DESKTOP-ONLY ACTIONS */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={handleInstallPWA}
                className="px-2.5 py-1.5 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold border border-indigo-500/30"
                title="Install Mobile App"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Install App</span>
              </button>

              <button
                onClick={toggleTheme}
                className="px-2.5 py-1.5 text-theme-sub hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-theme"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-indigo-600">Dark</span>
                  </>
                )}
              </button>

              {isLoaded && user && (
                <div className="flex flex-col items-end text-xs">
                  <span className="font-semibold text-theme-main max-w-[130px] truncate">{displayName}</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    {role} {role === 'STUDENT' && profile ? `• ${profile.points} pts` : ''}
                  </span>
                </div>
              )}

              {isTeacher && (
                <Link
                  href={pathname.startsWith('/admin') ? '/student/timeline' : '/admin/batches'}
                  className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg text-[11px] font-bold border border-purple-500/30 transition-colors flex items-center gap-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{pathname.startsWith('/admin') ? 'Student View' : 'Teacher View'}</span>
                </Link>
              )}

              <UserButton />
            </div>

            {/* MOBILE-ONLY CLEAN PROFILE TRIGGER BUTTON */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setProfileDrawerOpen(true)}
                className="p-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                aria-label="Open Profile & Settings Menu"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {displayName?.charAt(0) || 'U'}
                </div>
                <User className="w-4 h-4 text-indigo-500 mr-0.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE PROFILE & SETTINGS DRAWER MODAL */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn md:hidden">
          <div className="w-[85%] max-w-sm bg-theme-card border-l border-theme h-full flex flex-col justify-between shadow-2xl p-5 overflow-y-auto">
            {/* Drawer Header */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-theme pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                    {displayName?.charAt(0) || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm text-theme-main truncate">{displayName}</h3>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-indigo-500" />
                      <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setProfileDrawerOpen(false)}
                  className="p-2 rounded-xl text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Preferences & Controls */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase text-theme-sub tracking-wider">Preferences</p>

                {/* LIGHT / DARK THEME TOGGLE BUTTON */}
                <button
                  onClick={toggleTheme}
                  className="w-full p-3.5 bg-theme-card-sub border border-theme rounded-2xl flex items-center justify-between hover:opacity-90 transition-all text-left shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    {theme === 'dark' ? (
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Sun className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-600 flex items-center justify-center">
                        <Moon className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-theme-main">
                        Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </p>
                      <p className="text-[10px] text-theme-sub mt-0.5">
                        Tap to switch to {theme === 'dark' ? 'Light' : 'Dark'} theme
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase font-mono ${
                      theme === 'dark'
                        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                        : 'bg-indigo-600/20 text-indigo-600 border border-indigo-500/40'
                    }`}
                  >
                    {theme === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </button>

                {/* INSTALL LMS APP BUTTON */}
                <button
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    handleInstallPWA();
                  }}
                  className="w-full p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between hover:bg-indigo-500/20 transition-all text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-theme-main">Install App (PWA)</p>
                      <p className="text-[10px] text-theme-sub mt-0.5">Add LMS to home screen</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                </button>

                {/* TEACHER / STUDENT ROLE SWITCHER */}
                {isTeacher && (
                  <Link
                    href={pathname.startsWith('/admin') ? '/student/timeline' : '/admin/batches'}
                    onClick={() => setProfileDrawerOpen(false)}
                    className="w-full p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between hover:bg-purple-500/20 transition-all text-left block"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-theme-main">
                          {pathname.startsWith('/admin') ? 'Switch to Student View' : 'Switch to Teacher View'}
                        </p>
                        <p className="text-[10px] text-theme-sub mt-0.5">Toggle admin / portal preview</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-500" />
                  </Link>
                )}

                {!isTeacher && (
                  <Link
                    href="/student/settings"
                    onClick={() => setProfileDrawerOpen(false)}
                    className="w-full p-3.5 bg-theme-card-sub border border-theme rounded-2xl flex items-center justify-between hover:opacity-90 transition-all text-left block"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-theme-main flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-theme-main">Account Settings</p>
                        <p className="text-[10px] text-theme-sub mt-0.5">Edit display name & profile</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-theme-sub" />
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer Footer & Account Sign Out */}
            <div className="pt-4 border-t border-theme flex items-center justify-between">
              <span className="text-[11px] text-theme-sub font-mono">Account Options</span>
              <UserButton />
            </div>
          </div>
        </div>
      )}

      {/* Clean Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-card/95 backdrop-blur border-t border-theme px-1 py-1.5 flex items-center justify-between overflow-x-auto text-theme-sub shadow-2xl no-scrollbar">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 min-w-[62px] rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 scale-105'
                  : 'hover:text-theme-main'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[58px] text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
