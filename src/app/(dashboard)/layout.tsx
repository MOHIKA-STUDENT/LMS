import { currentUser, clerkClient } from '@clerk/nextjs/server';
import Navbar from '@/components/Navbar';
import OfflineBanner from '@/components/OfflineBanner';
import { prisma } from '@/lib/db/prisma';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  let profile = null;

  if (user) {
    try {
      profile = await prisma.profile.findUnique({
        where: { id: user.id },
        include: { batch: true },
      });

      const metadataRole = (user.publicMetadata as any)?.role || (user.unsafeMetadata as any)?.role;
      const targetRole = metadataRole === 'TEACHER' ? 'TEACHER' : 'STUDENT';

      // Auto-create profile in Prisma if missing, cleaning up any stale profiles from deleted Clerk accounts
      if (!profile && user.primaryEmailAddress) {
        const userEmail = user.primaryEmailAddress.emailAddress;
        const emailPrefix = userEmail.split('@')[0];
        const displayName = user.fullName || user.username || user.firstName || emailPrefix;

        // Clean up stale profile with matching email if previously deleted from Clerk
        const staleProfile = await prisma.profile.findUnique({
          where: { email: userEmail },
        });

        if (staleProfile) {
          await prisma.homeworkSubmission.deleteMany({ where: { studentId: staleProfile.id } });
          await prisma.quizSubmission.deleteMany({ where: { studentId: staleProfile.id } });
          await prisma.attendanceRecord.deleteMany({ where: { studentId: staleProfile.id } });
          await prisma.profile.delete({ where: { id: staleProfile.id } });
        }

        profile = await prisma.profile.create({
          data: {
            id: user.id,
            fullName: displayName,
            email: userEmail,
            role: targetRole,
            isActive: true,
          },
          include: { batch: true },
        });
      } else if (profile && (profile.fullName.includes('@') || !profile.fullName)) {
        const emailPrefix = profile.email ? profile.email.split('@')[0] : 'User';
        const cleanName = user.fullName || user.username || user.firstName || emailPrefix;
        profile = await prisma.profile.update({
          where: { id: user.id },
          data: { fullName: cleanName },
          include: { batch: true },
        });
      }

      if (profile && metadataRole === 'TEACHER' && profile.role !== 'TEACHER') {
        profile = await prisma.profile.update({
          where: { id: user.id },
          data: { role: 'TEACHER' },
          include: { batch: true },
        });
      }

      // Sync publicMetadata in Clerk if missing or mismatched
      if (profile && (user.publicMetadata as any)?.role !== profile.role) {
        try {
          const client = await clerkClient();
          await client.users.updateUserMetadata(user.id, {
            publicMetadata: { role: profile.role },
          });
        } catch (mErr) {
          // Silent fallback for Edge / Vercel
        }
      }
    } catch (err) {
      // Quiet handler for build-time/prerender queries
    }
  }

  if (profile && profile.isActive === false) {
    return (
      <div className="min-h-screen bg-theme-main text-theme-main flex flex-col transition-colors duration-200">
        <OfflineBanner />
        <Navbar profile={profile as any} />
        <main className="flex-1 container mx-auto px-4 py-16 max-w-xl text-center flex flex-col items-center justify-center">
          <div className="bg-theme-card border border-red-500/30 p-8 rounded-2xl shadow-xl w-full">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Revoked / Account Inactive</h2>
            <p className="text-theme-muted mb-6 text-sm">
              Your account is currently inactive or you are no longer enrolled in an active class batch. You do not have access to study materials, quizzes, or classroom resources.
            </p>
            <p className="text-xs text-theme-muted bg-theme-main p-3 rounded-lg border border-theme-border">
              If you believe this is a mistake or need re-enrollment, please contact your teacher or administrator.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-main text-theme-main flex flex-col transition-colors duration-200">
      <OfflineBanner />
      <Navbar profile={profile as any} />
      <main className="flex-1 container mx-auto px-4 pt-6 pb-28 md:pb-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
