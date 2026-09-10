'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { uploadToCloudinary } from '@/lib/storage/cloudinary';
import { CEFRLevel, Role } from '@prisma/client';

// ==========================================
// BATCH ACTIONS
// ==========================================
export async function getBatchesAction() {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, batches };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch batches.' };
  }
}

export async function createBatchAction(data: {
  name: string;
  description?: string;
  cefrLevel: CEFRLevel;
  scheduleInfo?: string;
  zoomLink?: string;
}) {
  try {
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role || 'STUDENT';
    if (role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teachers only.' };
    }

    const batch = await prisma.batch.create({
      data: {
        name: data.name,
        description: data.description || null,
        cefrLevel: data.cefrLevel,
        scheduleInfo: data.scheduleInfo || null,
        zoomLink: data.zoomLink || null,
      },
    });

    return { success: true, batch };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create batch.' };
  }
}

export async function updateBatchScheduleAction(
  batchId: string,
  scheduleInfo: string,
  zoomLink: string
) {
  try {
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role || 'STUDENT';
    if (role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teachers only.' };
    }

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: {
        scheduleInfo,
        zoomLink,
      },
    });

    return { success: true, batch };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update schedule.' };
  }
}

// ==========================================
// ROSTER & PROFILE ACTIONS
// ==========================================
export async function getRosterAction() {
  try {
    const profiles = await prisma.profile.findMany({
      include: { batch: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, profiles };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch roster.' };
  }
}

export async function updateStudentBatchAction(studentId: string, batchId: string | null) {
  try {
    const profile = await prisma.profile.update({
      where: { id: studentId },
      data: { batchId: batchId || null },
    });
    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign batch.' };
  }
}

export async function updateStudentAccessAction(studentId: string, isActive: boolean) {
  try {
    const profile = await prisma.profile.update({
      where: { id: studentId },
      data: { isActive },
    });
    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update access.' };
  }
}

export async function deleteStudentAction(studentId: string) {
  try {
    await prisma.profile.delete({
      where: { id: studentId },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete student.' };
  }
}

// ==========================================
// COURSE MATERIAL ACTIONS (CLOUDINARY STORAGE)
// ==========================================
export async function getMaterialsAction(batchId?: string) {
  try {
    const materials = await prisma.courseMaterial.findMany({
      where: batchId ? { batchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, materials };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch materials.' };
  }
}

export async function uploadMaterialAction(formData: FormData) {
  try {
    const batchId = formData.get('batchId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!file || !batchId || !title) {
      return { success: false, error: 'Missing required fields.' };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToCloudinary(fileBuffer, file.name, `materials/${batchId}`);

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || 'Cloudinary upload failed.' };
    }

    const material = await prisma.courseMaterial.create({
      data: {
        batchId,
        title,
        description: description || null,
        fileUrl: uploadResult.url,
        fileType: file.name.split('.').pop() || 'file',
        fileSizeBytes: uploadResult.bytes || file.size,
      },
    });

    return { success: true, material };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to upload material.' };
  }
}

export async function deleteMaterialAction(id: string) {
  try {
    await prisma.courseMaterial.delete({
      where: { id },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete material.' };
  }
}

// ==========================================
// HOMEWORK & GRADING ACTIONS
// ==========================================
export async function getSubmissionsAction() {
  try {
    const submissions = await prisma.homeworkSubmission.findMany({
      include: { student: true, assignment: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, submissions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch submissions.' };
  }
}

export async function gradeSubmissionAction(
  submissionId: string,
  teacherFeedback: string,
  scoreAwarded: number
) {
  try {
    const submission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        teacherFeedback,
        scoreAwarded,
      },
    });

    // Update student points in profile
    await prisma.profile.update({
      where: { id: submission.studentId },
      data: {
        points: { increment: scoreAwarded },
      },
    });

    return { success: true, submission };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to grade submission.' };
  }
}

// ==========================================
// LEADERBOARD ACTION
// ==========================================
export async function getLeaderboardAction() {
  try {
    const profiles = await prisma.profile.findMany({
      where: { role: 'STUDENT' },
      include: { batch: true },
      orderBy: { points: 'desc' },
    });
    return { success: true, profiles };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch leaderboard.' };
  }
}

// ==========================================
// QUIZ ACTIONS
// ==========================================
export async function getQuizzesAction(batchId?: string) {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: batchId ? { batchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, quizzes };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch quizzes.' };
  }
}

export async function submitQuizAction(quizId: string, pointsEarned: number, answersSubmitted: any = {}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId,
        studentId: user.id,
        score: pointsEarned,
        totalQuestions: 5,
        answersSubmitted: answersSubmitted || {},
      },
    });

    // Update student total points
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        points: { increment: pointsEarned },
      },
    });

    return { success: true, submission };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit quiz.' };
  }
}

// ==========================================
// STUDENT HOMEWORK & TIMELINE ACTIONS
// ==========================================
export async function getAssignmentsAction(batchId?: string) {
  try {
    const assignments = await prisma.assignment.findMany({
      where: batchId ? { batchId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, assignments };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch assignments.' };
  }
}

export async function submitHomeworkAction(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const assignmentId = formData.get('assignmentId') as string;
    const writtenResponse = formData.get('writtenResponse') as string;
    const file = formData.get('file') as File | null;

    let fileUrl: string | null = null;
    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await uploadToCloudinary(buffer, file.name, `homework/${user.id}`);
      if (uploadRes.success && uploadRes.url) {
        fileUrl = uploadRes.url;
      }
    }

    const submission = await prisma.homeworkSubmission.create({
      data: {
        assignmentId,
        studentId: user.id,
        submissionText: writtenResponse || null,
        fileUrl,
      },
    });

    return { success: true, submission };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit homework.' };
  }
}

// ==========================================
// PROFILE ACTION
// ==========================================
export async function getStudentProfileAction() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: { batch: true },
    });

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch student profile.' };
  }
}


