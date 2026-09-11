import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const eventType = payload.type;
    const data = payload.data;

    if (eventType === 'user.deleted') {
      const userId = data.id;
      if (userId) {
        // Cascade delete user data
        await prisma.homeworkSubmission.deleteMany({ where: { studentId: userId } });
        await prisma.quizSubmission.deleteMany({ where: { studentId: userId } });
        await prisma.attendanceRecord.deleteMany({ where: { studentId: userId } });
        await prisma.profile.deleteMany({ where: { id: userId } });
      }
    } else if (eventType === 'user.created' || eventType === 'user.updated') {
      const userId = data.id;
      const primaryEmailObj = data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id);
      const email = primaryEmailObj?.email_address || data.email_addresses?.[0]?.email_address;
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';
      const fullName = (firstName + ' ' + lastName).trim() || data.username || email?.split('@')[0] || 'User';

      if (userId && email) {
        // Remove any stale profile with same email under a different ID
        const stale = await prisma.profile.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (stale) {
          await prisma.homeworkSubmission.deleteMany({ where: { studentId: stale.id } });
          await prisma.quizSubmission.deleteMany({ where: { studentId: stale.id } });
          await prisma.attendanceRecord.deleteMany({ where: { studentId: stale.id } });
          await prisma.profile.delete({ where: { id: stale.id } });
        }

        const role = data.public_metadata?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';

        await prisma.profile.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email,
            fullName,
            role,
            isActive: true,
          },
          update: {
            email,
            fullName,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
