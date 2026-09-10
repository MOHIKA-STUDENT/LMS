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

      // Auto-create profile in Prisma if missing
      if (!profile && user.primaryEmailAddress) {
        const emailPrefix = user.primaryEmailAddress.emailAddress.split('@')[0];
        const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        const displayName = user.fullName || user.firstName || formattedName;

        profile = await prisma.profile.create({
          data: {
            id: user.id,
            fullName: displayName,
            email: user.primaryEmailAddress.emailAddress,
            role: targetRole,
            isActive: true,
          },
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
          console.warn('Could not sync Clerk publicMetadata:', mErr);
        }
      }
    } catch (err) {
      console.warn('Prisma layout query notice:', err);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <OfflineBanner />
      <Navbar profile={profile as any} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
