import { currentUser } from '@clerk/nextjs/server';
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

      // Auto-create profile in Prisma if missing
      if (!profile && user.primaryEmailAddress) {
        const userRole = (user.publicMetadata as any)?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
        profile = await prisma.profile.create({
          data: {
            id: user.id,
            fullName: user.fullName || user.primaryEmailAddress.emailAddress,
            email: user.primaryEmailAddress.emailAddress,
            role: userRole,
            isActive: true,
          },
          include: { batch: true },
        });
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
