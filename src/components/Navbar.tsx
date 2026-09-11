'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { Profile } from '@/types/database';
import { formatStudentDisplayName } from '@/lib/utils/format-name';
import { useTheme } from '@/components/ThemeProvider';
import {
  createInstitutionAction,
  joinInstitutionByCodeAction,
  getInstitutionDetailsAction,
} from '@/app/actions/lms-actions';
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
  MoreHorizontal,
  Grid,
  Building2,
  Plus,
  KeyRound,
  AlertTriangle,
  Lock,
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

  // Institution / Workspace state
  const [institution, setInstitution] = useState<any>(profile?.institution || null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceNameInput, setWorkspaceNameInput] = useState('');
  const [workspaceCodeInput, setWorkspaceCodeInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isSubmittingWorkspace, setIsSubmittingWorkspace] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    async function loadInst() {
      const res = await getInstitutionDetailsAction();
      if (res.success && res.institution) {
        setInstitution(res.institution);
      }
    }
    loadInst();
  }, [profile?.institutionId]);

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

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceNameInput.trim() || !workspaceCodeInput.trim()) {
      toast.error('Please enter institution name and join code.');
      return;
    }
    setIsSubmittingWorkspace(true);
    const res = await createInstitutionAction(workspaceNameInput, workspaceCodeInput);
    setIsSubmittingWorkspace(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to create institution workspace.');
    } else {
      toast.success(`Workspace "${res.institution?.name}" created successfully!`);
      setShowWorkspaceModal(false);
      window.location.reload();
    }
  };

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) {
      toast.error('Please enter institution join code.');
      return;
    }
    setIsSubmittingWorkspace(true);
    const res = await joinInstitutionByCodeAction(joinCodeInput);
    setIsSubmittingWorkspace(false);
    if (!res.success) {
      toast.error(res.error || 'Failed to join institution workspace.');
    } else {
      toast.success(`Joined ${res.institution?.name}! Awaiting teacher approval.`);
      setShowWorkspaceModal(false);
      window.location.reload();
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
    { href: '/admin/quiz-gen', label: 'Quizzes', icon: Sparkles },
    { href: '/admin/attendance-fees', label: 'Attendance & Fees', icon: CreditCard },
    { href: '/admin/recordings', label: 'Recordings', icon: Video },
    { href: '/admin/materials', label: 'Materials', icon: BookOpen },
    { href: '/admin/grading', label: 'Grading', icon: CheckSquare },
  ];

  const studentLinks = [
    { href: '/student/timeline', label: 'Schedule', icon: Calendar },
    { href: '/student/quizzes', label: 'Quizzes', icon: Sparkles },
    { href: '/student/homework', label: 'Homework', icon: FileText },
    { href: '/student/notes', label: 'Vault', icon: BookOpen },
    { href: '/student/recordings', label: 'Recordings', icon: Video },
    { href: '/student/fees-attendance', label: 'Fees & Attendance', icon: UserCheck },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Award },
  ];

  const navLinks = isTeacher ? teacherLinks : studentLinks;

  // Primary 4 tabs for mobile bottom bar (no scrolling required!)
  const mobilePrimaryLinks = navLinks.slice(0, 4);

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
              Vedayan<span className="text-theme-main"> LMS</span>
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
              {/* Institution / Workspace Badge or Join Button */}
              {institution ? (
                <div
                  onClick={() => isTeacher && setShowWorkspaceModal(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 rounded-lg flex items-center gap-1.5 cursor-pointer hover:bg-indigo-500/20 transition-all"
                  title={isTeacher ? 'Click to manage workspace code' : 'Active Institution'}
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold max-w-[120px] truncate">{institution.name}</span>
                  {institution.code && (
                    <span className="font-mono text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">
                      {institution.code}
                    </span>
                  )}
                </div>
              ) : isTeacher ? (
                <button
                  onClick={() => setShowWorkspaceModal(true)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowWorkspaceModal(true)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Join Workspace</span>
                </button>
              )}

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
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-medium flex items-center gap-1">
                    {role} {role === 'STUDENT' && profile ? `• ${profile.points} pts` : ''}
                    {profile?.status === 'PENDING' && (
                      <span className="bg-amber-500/20 text-amber-500 text-[9px] font-bold px-1 rounded">PENDING</span>
                    )}
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

            {/* MOBILE-ONLY CLEAN PROFILE & MENU TRIGGER BUTTON */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={() => setProfileDrawerOpen(true)}
                className="p-1.5 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                aria-label="Open Navigation & Profile Menu"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                  {displayName?.charAt(0) || 'U'}
                </div>
                <Grid className="w-4 h-4 text-indigo-500 mr-0.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PENDING APPROVAL NOTICE BANNER (FOR STUDENTS PENDING APPROVAL) */}
      {!isTeacher && profile?.status === 'PENDING' && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-2.5 text-xs text-center font-medium flex items-center justify-center gap-2 shadow-inner">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Access Pending Approval:</strong> Your request to join{' '}
            <strong>{institution?.name || 'Workspace'}</strong> is awaiting teacher verification. Content will unlock once approved.
          </span>
        </div>
      )}

      {/* MOBILE FULL NAVIGATION & PROFILE DRAWER MODAL */}
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

              {/* All Section Links */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-theme-sub tracking-wider">All Sections</p>

                <div className="grid grid-cols-1 gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setProfileDrawerOpen(false)}
                        className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 font-bold'
                            : 'text-theme-sub hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-theme-main'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="w-4 h-4 text-indigo-500" />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-theme-sub" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Preferences & Quick Actions */}
              <div className="space-y-3 pt-2 border-t border-theme">
                <p className="text-[10px] font-bold uppercase text-theme-sub tracking-wider">App Preferences</p>

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
              </div>
            </div>

            {/* Drawer Footer & Account Sign Out */}
            <div className="pt-4 border-t border-theme flex items-center justify-between mt-4">
              <span className="text-[11px] text-theme-sub font-mono">Account Profile</span>
              <UserButton />
            </div>
          </div>
        </div>
      )}

      {/* ULTRA-CLEAN 5-TAB MOBILE BOTTOM NAVIGATION BAR (Fits 100% of screens with NO scrolling!) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-theme-card/95 backdrop-blur border-t border-theme px-2 py-1.5 grid grid-cols-5 gap-1 text-theme-sub shadow-2xl">
        {mobilePrimaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 scale-105'
                  : 'hover:text-theme-main'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[56px] text-[10px]">{link.label}</span>
            </Link>
          );
        })}

        {/* 5th Tab: MORE Button */}
        <button
          onClick={() => setProfileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-medium transition-all ${
            profileDrawerOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 scale-105'
              : 'hover:text-theme-main'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5 text-indigo-500" />
          <span className="truncate max-w-[56px] text-[10px] font-bold">More...</span>
        </button>
      </nav>

      {/* INSTITUTION WORKSPACE MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-theme-card border border-theme rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-theme pb-4">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-6 h-6" />
                <h3 className="text-lg font-bold text-theme-main">
                  {isTeacher ? 'Institution Workspace' : 'Join Institution Workspace'}
                </h3>
              </div>
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="p-1 rounded-lg text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isTeacher ? (
              <div>
                {institution ? (
                  <div className="space-y-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl space-y-2">
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Active Workspace
                      </p>
                      <h4 className="text-xl font-bold text-theme-main">{institution.name}</h4>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className="text-xs text-theme-sub">Share Student Join Code:</span>
                        <span className="font-mono text-sm font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">
                          {institution.code}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-theme-sub">
                      Students must enter this code when signing up to access your courses, quizzes, and homework.
                    </p>

                    <button
                      onClick={() => setShowWorkspaceModal(false)}
                      className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateWorkspace} className="space-y-4">
                    <p className="text-xs text-theme-sub">
                      Create an isolated LMS workspace for your college, institute, or tuition center. Students will join using your unique workspace code.
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-theme-main mb-1">
                        Institution / Academy Name
                      </label>
                      <input
                        type="text"
                        required
                        value={workspaceNameInput}
                        onChange={(e) => setWorkspaceNameInput(e.target.value)}
                        placeholder="e.g. Acme Academy"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-theme bg-theme-input text-theme-main focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-theme-main mb-1">
                        Unique Join Code for Students
                      </label>
                      <input
                        type="text"
                        required
                        value={workspaceCodeInput}
                        onChange={(e) => setWorkspaceCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. ACME101"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-theme bg-theme-input text-theme-main font-mono uppercase focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingWorkspace}
                      className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                    >
                      {isSubmittingWorkspace ? 'Creating Workspace...' : 'Create Institution Workspace'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={handleJoinWorkspace} className="space-y-4">
                <p className="text-xs text-theme-sub">
                  Enter the unique workspace code provided by your teacher or institution to access your specific courses and quizzes.
                </p>

                <div>
                  <label className="block text-xs font-bold text-theme-main mb-1">
                    Institution Join Code
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ACME101"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-theme bg-theme-input text-theme-main font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {institution && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                    Currently joined: <strong>{institution.name}</strong> ({profile?.status || 'APPROVED'})
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingWorkspace}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                >
                  {isSubmittingWorkspace ? 'Joining Workspace...' : 'Join Workspace'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
