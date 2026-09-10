'use client';

import { useState, useEffect } from 'react';
import {
  getBatchesAction,
  getAssignmentsAction,
  createAssignmentAction,
  updateAssignmentAction,
  deleteAssignmentAction,
  getSubmissionsAction,
  gradeSubmissionAction,
} from '@/app/actions/lms-actions';
import {
  CheckSquare,
  Award,
  Bot,
  Check,
  Plus,
  Calendar,
  Edit3,
  Trash2,
  FileText,
  X,
  BookOpen,
  Download,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function GradingPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment State
  const [createBatchId, setCreateBatchId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  // Edit Assignment State
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editBatchId, setEditBatchId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  // Filter State
  const [filterBatchId, setFilterBatchId] = useState<string>('ALL');

  // Grading Modal State
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number>(100);
  const [savingGrade, setSavingGrade] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    const bRes = await getBatchesAction();
    const aRes = await getAssignmentsAction();
    const sRes = await getSubmissionsAction();

    if (bRes.success && bRes.batches) {
      setBatches(bRes.batches);
      if (bRes.batches.length > 0 && !createBatchId) {
        setCreateBatchId(bRes.batches[0].id);
      }
    }
    if (aRes.success && aRes.assignments) {
      setAssignments(aRes.assignments);
    }
    if (sRes.success && sRes.submissions) {
      setSubmissions(sRes.submissions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      toast.error('Assignment title is required.');
      return;
    }
    if (!createBatchId) {
      toast.error('Please select a target student batch.');
      return;
    }
    if (!createDueDate) {
      toast.error('Please select a due date for the assignment.');
      return;
    }

    setSubmittingAssignment(true);

    try {
      const res = await createAssignmentAction({
        batchId: createBatchId,
        title: createTitle,
        description: createDescription,
        dueDate: createDueDate,
      });

      if (!res.success) throw new Error(res.error || 'Failed to create assignment.');

      toast.success('Homework assignment published successfully!');
      setCreateTitle('');
      setCreateDescription('');
      setCreateDueDate('');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // Handle Edit Assignment Open
  const handleEditAssignmentOpen = (a: any) => {
    setEditingAssignment(a);
    setEditBatchId(a.batchId || '');
    setEditTitle(a.title || '');
    setEditDescription(a.description || '');
    setEditDueDate(a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '');
  };

  // Handle Save Assignment Edit
  const handleEditAssignmentSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    setUpdatingAssignment(true);
    try {
      const res = await updateAssignmentAction({
        id: editingAssignment.id,
        batchId: editBatchId,
        title: editTitle,
        description: editDescription,
        dueDate: editDueDate,
      });

      if (!res.success) throw new Error(res.error || 'Failed to update assignment.');

      toast.success('Assignment updated successfully!');
      setEditingAssignment(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update assignment');
    } finally {
      setUpdatingAssignment(false);
    }
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment and all associated student submissions?')) return;
    const res = await deleteAssignmentAction(id);
    if (!res.success) {
      toast.error(res.error || 'Failed to delete assignment.');
    } else {
      toast.success('Assignment deleted.');
      fetchAllData();
    }
  };

  // Grading Modal Handlers
  const openGradingModal = (sub: any) => {
    setActiveSubmission(sub);
    setFeedback(sub.teacherFeedback || '');
    setScore(sub.scoreAwarded || 100);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setSavingGrade(true);
    try {
      const res = await gradeSubmissionAction(activeSubmission.id, feedback, score);
      if (!res.success) throw new Error(res.error);

      toast.success(`Graded! ${score} points awarded to student.`);
      setActiveSubmission(null);
      fetchAllData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grade submission');
    } finally {
      setSavingGrade(false);
    }
  };

  const filteredAssignments = assignments.filter(
    (a) => filterBatchId === 'ALL' || a.batchId === filterBatchId
  );

  const filteredSubmissions = submissions.filter(
    (sub) => filterBatchId === 'ALL' || sub.assignment?.batchId === filterBatchId
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <CheckSquare className="w-7 h-7 text-indigo-500" />
            <span>Assignments & Homework Grading Hub</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">
            Create homework tasks for student batches, view submitted essays & files, and grade with AI assistance
          </p>
        </div>

        {/* Filter View */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-theme-sub uppercase whitespace-nowrap">Filter Batch:</label>
          <select
            value={filterBatchId}
            onChange={(e) => setFilterBatchId(e.target.value)}
            className="px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.cefrLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. Create New Homework Assignment Form */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <Plus className="w-5 h-5 text-indigo-500" />
          <span>Publish New Homework Assignment</span>
        </h2>

        <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Student Batch</label>
            <select
              value={createBatchId}
              onChange={(e) => setCreateBatchId(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500 font-semibold"
            >
              {batches.length === 0 ? (
                <option value="">No batches created yet</option>
              ) : (
                batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.cefrLevel})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Assignment Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 3 Grammar & Essay Writing Exercise"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Instructions / Description</label>
            <input
              type="text"
              placeholder="Detailed instructions or prompt for students..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Due Date</label>
            <input
              type="date"
              required
              value={createDueDate}
              onChange={(e) => setCreateDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={submittingAssignment}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submittingAssignment ? 'Publishing...' : 'Publish Homework Assignment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Posted Assignments List */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span>Active Posted Homework Assignments ({filteredAssignments.length})</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading posted assignments...</div>
        ) : filteredAssignments.length === 0 ? (
          <p className="text-sm text-theme-sub text-center py-6">No homework assignments created for this batch view yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((a) => {
              const batchName = a.batch?.name || 'Unknown Batch';
              const submissionCount = a.submissions?.length || 0;
              const formattedDueDate = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No Due Date';

              return (
                <div key={a.id} className="p-4 bg-theme-card-sub border border-theme rounded-xl space-y-3 flex flex-col justify-between shadow">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                        {batchName}
                      </span>
                      <span className="text-xs text-amber-500 font-mono font-semibold flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {formattedDueDate}</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-theme-main text-sm">{a.title}</h3>
                    {a.description && <p className="text-xs text-theme-sub line-clamp-2">{a.description}</p>}
                  </div>

                  <div className="flex items-center justify-between border-t border-theme pt-3 text-xs">
                    <span className="text-theme-sub font-mono">
                      Submissions: <strong className="text-indigo-600 dark:text-indigo-300">{submissionCount}</strong>
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditAssignmentOpen(a)}
                        className="p-1.5 text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Assignment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="p-1.5 text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Student Homework Submissions & Grading Section */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <Award className="w-5 h-5 text-indigo-500" />
          <span>Student Submissions & Grading Terminal ({filteredSubmissions.length})</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading homework submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center bg-theme-card-sub border border-theme rounded-xl">
            <CheckSquare className="w-10 h-10 text-theme-sub mx-auto mb-2" />
            <h3 className="text-base font-semibold text-theme-main">No Submissions Found</h3>
            <p className="text-xs text-theme-sub mt-1">Students have not submitted any homework tasks for this batch view yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((sub) => (
              <div key={sub.id} className="bg-theme-card-sub border border-theme rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                      {sub.student?.fullName || 'Student'}
                    </span>
                    <span className="text-xs text-amber-500 font-mono font-semibold">
                      {sub.scoreAwarded > 0 ? `+${sub.scoreAwarded} pts` : 'Pending Grade'}
                    </span>
                  </div>

                  <h3 className="font-bold text-theme-main text-base">{sub.assignment?.title || 'Homework Assignment'}</h3>

                  {sub.submissionText && (
                    <p className="text-xs text-theme-sub bg-theme-card p-3 rounded-xl line-clamp-3 font-serif italic border border-theme">
                      "{sub.submissionText}"
                    </p>
                  )}

                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-500 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View Student Attachment File</span>
                    </a>
                  )}

                  {sub.aiProofreadReport && (
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between text-purple-600 dark:text-purple-300 font-bold">
                        <span className="flex items-center space-x-1">
                          <Bot className="w-3.5 h-3.5 text-purple-500" />
                          <span>AI Grammar Score</span>
                        </span>
                        <span>{sub.aiProofreadReport.grammar_score}%</span>
                      </div>
                      <p className="text-theme-sub line-clamp-2">{sub.aiProofreadReport.overall_feedback}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-theme flex items-center justify-between">
                  <span className="text-xs text-theme-sub opacity-75">{new Date(sub.createdAt).toLocaleDateString()}</span>

                  <button
                    onClick={() => openGradingModal(sub)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-all whitespace-nowrap"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{sub.scoreAwarded > 0 ? 'Edit Grade' : 'Grade Homework'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-theme-main text-lg flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                <span>Edit Homework Assignment</span>
              </h3>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAssignmentSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Student Batch</label>
                <select
                  value={editBatchId}
                  onChange={(e) => setEditBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-semibold"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefrLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Instructions / Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 bg-theme-card-sub border border-theme rounded-xl text-xs font-semibold text-theme-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAssignment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1 transition-all disabled:opacity-50"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{updatingAssignment ? 'Saving...' : 'Save Assignment Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade & Feedback Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-theme-main flex items-center space-x-2">
              <Award className="w-6 h-6 text-indigo-500" />
              <span>Grade Submission - {activeSubmission.student?.fullName}</span>
            </h2>

            {/* Submission Content */}
            <div className="bg-theme-card-sub p-4 rounded-xl space-y-2 text-sm border border-theme">
              <h4 className="font-semibold text-theme-main">Student Submission Text:</h4>
              <p className="text-theme-main whitespace-pre-wrap font-serif bg-theme-input p-3 rounded-lg border border-theme">
                {activeSubmission.writtenResponse || 'No text submitted.'}
              </p>
            </div>

            {/* AI Proofreader Breakdown if available */}
            {activeSubmission.aiProofreadReport && (
              <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-purple-600 dark:text-purple-300 flex items-center space-x-1 text-sm">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <span>AI Proofreader Analysis ({activeSubmission.aiProofreadReport.grammar_score}% Score)</span>
                </h4>
                <p className="text-theme-sub">{activeSubmission.aiProofreadReport.overall_feedback}</p>
                <div className="font-semibold text-purple-600 dark:text-purple-300 pt-1">AI Improved Version:</div>
                <div className="bg-theme-input p-2.5 rounded text-emerald-600 dark:text-emerald-300 font-serif border border-theme">
                  {activeSubmission.aiProofreadReport.improved_version}
                </div>
              </div>
            )}

            {/* Grade Input Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Award Score / Points</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  required
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Teacher Written Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Provide personalized advice and encouragement..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="px-4 py-2 bg-theme-card-sub text-theme-main hover:opacity-90 rounded-xl text-sm font-semibold border border-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingGrade ? 'Saving...' : 'Submit Score & Feedback'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
