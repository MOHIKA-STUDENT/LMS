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
    const user = await currentUser();
    let whereClause: any = undefined;

    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile?.role === 'TEACHER') {
        // Teacher sees their own batches or unassigned teacherId batches
        whereClause = {
          OR: [
            { teacherId: user.id },
            { teacherId: null },
          ],
        };
      }
    }

    const batches = await prisma.batch.findMany({
      where: whereClause,
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
    if (!user) return { success: false, error: 'Unauthorized.' };

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    const role = (user.publicMetadata as any)?.role || profile?.role || 'STUDENT';
    if (role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized. Teachers only.' };
    }

    const cleanNamePrefix = data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ENG';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const joinCode = `${cleanNamePrefix}-${randomNum}`;

    const batch = await prisma.batch.create({
      data: {
        teacherId: user.id,
        joinCode,
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

export async function updateBatchAction(
  batchId: string,
  data: {
    name: string;
    description?: string;
    cefrLevel: CEFRLevel;
    scheduleInfo?: string;
    zoomLink?: string;
  }
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const batch = await prisma.batch.update({
      where: { id: batchId },
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
    return { success: false, error: err.message || 'Failed to update batch.' };
  }
}

export async function deleteBatchAction(batchId: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    await prisma.batch.delete({
      where: { id: batchId },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete batch.' };
  }
}

export async function broadcastZoomLinkToAllBatchesAction(
  zoomLink: string,
  scheduleInfo?: string
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    await prisma.batch.updateMany({
      where: { teacherId: user.id },
      data: {
        zoomLink,
        ...(scheduleInfo ? { scheduleInfo } : {}),
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to broadcast Zoom link.' };
  }
}

export async function updateBatchScheduleAction(
  batchId: string,
  scheduleInfo: string,
  zoomLink: string
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

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

export async function joinBatchByCodeAction(joinCode: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    if (!joinCode || joinCode.trim().length < 3) {
      return { success: false, error: 'Please enter a valid Batch Join Code.' };
    }

    const cleanCode = joinCode.trim().toUpperCase();
    const batch = await prisma.batch.findFirst({
      where: { joinCode: cleanCode },
    });

    if (!batch) {
      return { success: false, error: 'Invalid Batch Join Code. Please check with your teacher.' };
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: { batchId: batch.id },
      include: { batch: true },
    });

    return { success: true, batch, profile: updatedProfile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to join batch with code.' };
  }
}

// ==========================================
// ROSTER & PROFILE ACTIONS
// ==========================================
export async function getRosterAction() {
  try {
    const user = await currentUser();
    let whereClause: any = undefined;

    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile?.role === 'TEACHER') {
        // Teacher ONLY sees students in their own batches OR unassigned students
        whereClause = {
          role: 'STUDENT',
          OR: [
            { batch: { teacherId: user.id } },
            { batchId: null },
            { batch: { teacherId: null } },
          ],
        };
      }
    }

    const profiles = await prisma.profile.findMany({
      where: whereClause,
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
// COURSE MATERIAL ACTIONS (CLOUDINARY STORAGE & GLOBAL/BATCH SCOPE)
// ==========================================
export async function getMaterialsAction(batchId?: string) {
  try {
    const user = await currentUser();
    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile && profile.isActive === false) {
        return { success: false, error: 'Access revoked. Your account is inactive.' };
      }
    }

    const materials = await prisma.courseMaterial.findMany({
      where: batchId
        ? {
            OR: [
              { batchId },
              { isGlobal: true },
            ],
          }
        : undefined,
      include: { batch: true },
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
    const isGlobal = formData.get('isGlobal') === 'true';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!file || (!batchId && !isGlobal) || !title) {
      return { success: false, error: 'Missing required fields.' };
    }

    const targetFolder = isGlobal ? 'materials/global' : `materials/${batchId}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToCloudinary(fileBuffer, file.name, targetFolder);

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || 'Cloudinary upload failed.' };
    }

    const material = await prisma.courseMaterial.create({
      data: {
        batchId: isGlobal ? null : batchId,
        isGlobal,
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
// LEADERBOARD ACTION (STUDENTS ONLY)
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
// QUIZ & MANUAL UPLOAD ACTIONS
// ==========================================
export async function getQuizzesAction(batchId?: string) {
  try {
    const user = await currentUser();
    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile && profile.isActive === false) {
        return { success: false, error: 'Access revoked. Your account is inactive.' };
      }
    }

    const quizzes = await prisma.quiz.findMany({
      where: batchId
        ? {
            OR: [
              { batchId },
              { isGlobal: true },
            ],
          }
        : undefined,
      include: { batch: true },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, quizzes };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch quizzes.' };
  }
}

export async function createManualQuizAction(data: {
  batchId?: string | null;
  isGlobal?: boolean;
  title: string;
  cefrLevel: CEFRLevel;
  topic: string;
  questions: any[];
}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const quiz = await prisma.quiz.create({
      data: {
        batchId: data.isGlobal ? null : (data.batchId || null),
        isGlobal: !!data.isGlobal,
        title: data.title,
        cefrLevel: data.cefrLevel,
        topic: data.topic,
        questions: data.questions,
      },
    });

    return { success: true, quiz };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create quiz.' };
  }
}

export async function submitQuizAction(quizId: string, pointsEarned: number, answersSubmitted: any = {}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const previousAttemptsCount = await prisma.quizSubmission.count({
      where: {
        quizId,
        studentId: user.id,
      },
    });

    const attemptNumber = previousAttemptsCount + 1;

    const submission = await prisma.quizSubmission.create({
      data: {
        quizId,
        studentId: user.id,
        score: pointsEarned,
        totalQuestions: 5,
        answersSubmitted: answersSubmitted || {},
        attemptNumber,
      },
    });

    // Update student total points
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        points: { increment: pointsEarned },
      },
    });

    return { success: true, submission, attemptNumber };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit quiz.' };
  }
}

export async function updateQuizAction(data: {
  id: string;
  batchId?: string | null;
  isGlobal?: boolean;
  title: string;
  cefrLevel: CEFRLevel;
  topic: string;
  questions?: any[];
}) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const quiz = await prisma.quiz.update({
      where: { id: data.id },
      data: {
        batchId: data.isGlobal ? null : (data.batchId || null),
        isGlobal: !!data.isGlobal,
        title: data.title,
        cefrLevel: data.cefrLevel,
        topic: data.topic,
        ...(data.questions ? { questions: data.questions } : {}),
      },
    });

    return { success: true, quiz };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update quiz.' };
  }
}

export async function deleteQuizAction(id: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    await prisma.quiz.delete({
      where: { id },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete quiz.' };
  }
}

export async function getStudentQuizSubmissionsAction() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const submissions = await prisma.quizSubmission.findMany({
      where: { studentId: user.id },
      include: { quiz: true },
      orderBy: { completedAt: 'desc' },
    });

    return { success: true, submissions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch student quiz history.' };
  }
}

export async function getTeacherQuizAnalyticsAction(quizId?: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const submissions = await prisma.quizSubmission.findMany({
      where: quizId ? { quizId } : undefined,
      include: {
        student: { include: { batch: true } },
        quiz: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    return { success: true, submissions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch quiz analytics.' };
  }
}

// ==========================================
// ATTENDANCE ACTIONS
// ==========================================
export async function markAttendanceAction(data: {
  studentId: string;
  batchId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  notes?: string;
}) {
  try {
    const dateObj = new Date(data.date);
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        studentId: data.studentId,
        batchId: data.batchId,
        date: dateObj,
      },
    });

    let record;
    if (existing) {
      record = await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: data.status, notes: data.notes || null },
      });
    } else {
      record = await prisma.attendanceRecord.create({
        data: {
          studentId: data.studentId,
          batchId: data.batchId,
          date: dateObj,
          status: data.status,
          notes: data.notes || null,
        },
      });
    }

    return { success: true, record };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to mark attendance.' };
  }
}

export async function getBatchAttendanceAction(batchId: string) {
  try {
    const records = await prisma.attendanceRecord.findMany({
      where: { batchId },
      include: { student: true },
      orderBy: { date: 'desc' },
    });
    return { success: true, records };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch attendance.' };
  }
}

export async function getStudentAttendanceAction() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: user.id },
      include: { batch: true },
      orderBy: { date: 'desc' },
    });
    return { success: true, records };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch student attendance.' };
  }
}

// ==========================================
// FEE RECORD ACTIONS
// ==========================================
export async function updateFeeRecordAction(data: {
  studentId: string;
  batchId: string;
  amount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  remarks?: string;
}) {
  try {
    const existing = await prisma.feeRecord.findFirst({
      where: {
        studentId: data.studentId,
        batchId: data.batchId,
      },
    });

    let record;
    if (existing) {
      record = await prisma.feeRecord.update({
        where: { id: existing.id },
        data: {
          amount: data.amount,
          status: data.status,
          dueDate: new Date(data.dueDate),
          paidDate: data.paidDate ? new Date(data.paidDate) : null,
          remarks: data.remarks || null,
        },
      });
    } else {
      record = await prisma.feeRecord.create({
        data: {
          studentId: data.studentId,
          batchId: data.batchId,
          amount: data.amount,
          status: data.status,
          dueDate: new Date(data.dueDate),
          paidDate: data.paidDate ? new Date(data.paidDate) : null,
          remarks: data.remarks || null,
        },
      });
    }

    return { success: true, record };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update fee record.' };
  }
}

export async function getBatchFeeRecordsAction(batchId: string) {
  try {
    const records = await prisma.feeRecord.findMany({
      where: { batchId },
      include: { student: true },
      orderBy: { dueDate: 'desc' },
    });
    return { success: true, records };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch fee records.' };
  }
}

export async function getStudentFeeRecordsAction() {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const records = await prisma.feeRecord.findMany({
      where: { studentId: user.id },
      include: { batch: true },
      orderBy: { dueDate: 'desc' },
    });
    return { success: true, records };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch student fees.' };
  }
}

// ==========================================
// RECORDED SESSIONS & WATCH ANALYTICS ACTIONS
// ==========================================
export async function createRecordedSessionAction(data: {
  batchId?: string | null;
  isGlobal?: boolean;
  title: string;
  description?: string;
  videoUrl: string;
  durationSeconds?: number;
}) {
  try {
    const session = await prisma.recordedSession.create({
      data: {
        batchId: data.isGlobal ? null : (data.batchId || null),
        isGlobal: !!data.isGlobal,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl,
        durationSeconds: data.durationSeconds || 0,
      },
    });
    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create recorded session.' };
  }
}

export async function updateRecordedSessionAction(data: {
  id: string;
  batchId?: string | null;
  isGlobal?: boolean;
  title: string;
  description?: string;
  videoUrl: string;
  durationSeconds?: number;
}) {
  try {
    const session = await prisma.recordedSession.update({
      where: { id: data.id },
      data: {
        batchId: data.isGlobal ? null : (data.batchId || null),
        isGlobal: !!data.isGlobal,
        title: data.title,
        description: data.description || null,
        videoUrl: data.videoUrl,
        durationSeconds: data.durationSeconds || 0,
      },
    });
    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update recorded session.' };
  }
}

export async function deleteRecordedSessionAction(id: string) {
  try {
    await prisma.recordedSession.delete({
      where: { id },
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete recorded session.' };
  }
}

export async function getRecordedSessionsAction(batchId?: string) {
  try {
    const user = await currentUser();
    if (user) {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile && profile.isActive === false) {
        return { success: false, error: 'Access revoked. Your account is inactive.' };
      }
    }

    const sessions = await prisma.recordedSession.findMany({
      where: batchId
        ? {
            OR: [
              { batchId },
              { isGlobal: true },
            ],
          }
        : undefined,
      include: {
        batch: true,
        watchLogs: { include: { student: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, sessions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to fetch recorded sessions.' };
  }
}

export async function logVideoWatchProgressAction(
  sessionId: string,
  watchedSeconds: number,
  isCompleted: boolean
) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const log = await prisma.sessionWatchLog.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: user.id,
        },
      },
      update: {
        watchedSeconds,
        isCompleted,
        lastWatchedAt: new Date(),
      },
      create: {
        sessionId,
        studentId: user.id,
        watchedSeconds,
        isCompleted,
      },
    });

    return { success: true, log };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to log watch progress.' };
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
// PROFILE ACTIONS & DISPLAY NAME UPDATE
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

export async function updateProfileNameAction(fullName: string) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    if (!fullName || fullName.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters.' };
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: { fullName: fullName.trim() },
    });

    return { success: true, profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update profile name.' };
  }
}

export async function updateProfileAvatarAction(formData: FormData) {
  try {
    const user = await currentUser();
    if (!user) return { success: false, error: 'Unauthorized.' };

    const file = formData.get('avatar') as File;
    if (!file) return { success: false, error: 'No avatar image uploaded.' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await uploadToCloudinary(buffer, file.name, `avatars/${user.id}`);

    if (!uploadRes.success || !uploadRes.url) {
      return { success: false, error: uploadRes.error || 'Failed to upload avatar image.' };
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: { avatarUrl: uploadRes.url },
    });

    return { success: true, avatarUrl: uploadRes.url, profile };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update avatar.' };
  }
}


