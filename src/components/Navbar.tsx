import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Profile } from '@/types/database';
import { formatStudentDisplayName } from '@/lib/utils/format-name';
import { useTheme } from '@/components/ThemeProvider';
import { BookOpen, Users, Calendar, FileText, Sparkles, Award, LayoutDashboard, CheckSquare, Settings, Video, CreditCard, UserCheck, Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  profile?: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = (user?.publicMetadata as any)?.role || (user?.unsafeMetadata as any)?.role || profile?.role || 'STUDENT';
  const isTeacher = role === 'TEACHER';

  // Compute clean display name (never raw email)
  const displayName = formatStudentDisplayName(
    profile?.fullName || user?.fullName || user?.firstName,
    user?.primaryEmailAddress?.emailAddress
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
          <Link href={isTeacher ? '/admin/batches' : '/student/timeline'} className="flex items-center space-x-2 font-bold text-xl text-indigo-600 dark:text-indigo-400 hover:opacity-90 transition-opacity">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            <span>English<span className="text-theme-main">Academy</span></span>
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

          {/* User Info & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-theme-sub hover:text-amber-500 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold border border-theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-amber-400">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline text-indigo-600">Dark</span>
                </>
              )}
            </button>

            {isLoaded && user && (
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-semibold text-theme-main max-w-[140px] truncate">
                  {displayName}
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                  {role} {role === 'STUDENT' && profile ? `• ${profile.points} pts` : ''}
                </span>
              </div>
            )}

            {isTeacher && (
              <Link
                href={pathname.startsWith('/admin') ? '/student/timeline' : '/admin/batches'}
                className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-bold border border-purple-500/30 transition-colors flex items-center gap-1"
                title="Switch between Teacher Admin and Student preview views"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{pathname.startsWith('/admin') ? 'Student View' : 'Teacher View'}</span>
              </Link>
            )}

            {!isTeacher && (
              <Link
                href="/student/settings"
                className="p-2 text-theme-sub hover:text-theme-main hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold border border-theme"
                title="Account Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}

            <UserButton />

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-theme-main hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg border border-theme transition-colors"
              aria-label="Toggle Mobile Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-theme-card border-b border-theme px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="text-xs font-bold text-theme-sub uppercase tracking-wider mb-2 px-2">Navigation Menu</div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-md'
                        : 'bg-theme-main/60 border border-theme text-theme-main hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-card/95 backdrop-blur border-t border-theme px-2 py-2 flex items-center justify-around text-theme-sub shadow-2xl">
        {navLinks.slice(0, 5).map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'hover:text-theme-main'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[60px]">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
