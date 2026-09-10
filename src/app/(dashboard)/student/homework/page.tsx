'use client';

import { useState, useEffect } from 'react';
import { proofreadHomeworkAction } from '@/app/actions/ai-actions';
import { getAssignmentsAction, getSubmissionsAction, submitHomeworkAction } from '@/app/actions/lms-actions';
import { processAndValidateFileUpload } from '@/lib/utils/asset-shield';
import { offlineDb } from '@/lib/db/offline-db';
import { AIProofreadReport } from '@/types/database';
import { FileText, Bot, UploadCloud, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentHomeworkPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [aiReport, setAiReport] = useState<AIProofreadReport | null>(null);
  const [proofreading, setProofreading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const aRes = await getAssignmentsAction();
    const sRes = await getSubmissionsAction();

    if (aRes.success && aRes.assignments) {
      setAssignments(aRes.assignments);
      if (aRes.assignments.length > 0 && !selectedAssignmentId) {
        setSelectedAssignmentId(aRes.assignments[0].id);
      }
    }
    if (sRes.success && sRes.submissions) {
      setSubmissions(sRes.submissions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAIProofread = async () => {
    if (!submissionText.trim() || submissionText.trim().length < 10) {
      toast.error('Please enter at least 10 characters of text to proofread.');
      return;
    }

    const assignmentTitle = assignments.find((a) => a.id === selectedAssignmentId)?.title || 'English Exercise';
    setProofreading(true);
    toast.info('Gemini AI is analyzing grammar and structure...', { id: 'proofread-toast' });

    try {
      const res = await proofreadHomeworkAction(submissionText, assignmentTitle);
      if (!res.success || !res.report) {
        toast.error(res.error || 'Failed to proofread assignment.');
      } else {
        setAiReport(res.report);
        toast.success('AI Proofreader Report generated!');
      }
    } catch (err: any) {
      toast.error('AI Proofread failed.');
    } finally {
      setProofreading(false);
    }
  };

  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignmentId) {
      toast.error('Please select an assignment.');
      return;
    }

    setSubmitting(true);

    try {
      let fileToUpload: File | null = null;
      if (file) {
        const validation = await processAndValidateFileUpload(file);
        if (!validation.valid || !validation.processedFile) {
          toast.error(validation.error || 'File validation failed.');
          setSubmitting(false);
          return;
        }
        fileToUpload = validation.processedFile;
      }

      // Check online status for offline queue
      if (!navigator.onLine) {
        await offlineDb.offlineQueue.add({
          type: 'SUBMIT_HOMEWORK',
          payload: {
            assignmentId: selectedAssignmentId,
            writtenResponse: submissionText,
          },
          timestamp: Date.now(),
          synced: false,
        });

        toast.info('Saved homework submission locally in IndexedDB! Will sync when back online.');
        setSubmissionText('');
        setFile(null);
        setAiReport(null);
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('assignmentId', selectedAssignmentId);
      formData.append('writtenResponse', submissionText);
      if (fileToUpload) {
        formData.append('file', fileToUpload);
      }

      const res = await submitHomeworkAction(formData);
      if (!res.success) throw new Error(res.error);

      toast.success('Homework submitted successfully to your teacher!');
      setSubmissionText('');
      setFile(null);
      setAiReport(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting homework.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <FileText className="w-7 h-7 text-indigo-500" />
          <span>Homework Upload Terminal & AI Proofreader</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Submit text essays or files and get instant AI grammar feedback powered by Gemini</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading homework terminal...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Input Terminal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-theme-main">New Submission</h2>

              <form onSubmit={handleSubmitHomework} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Select Assignment</label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {assignments.length === 0 ? (
                      <option value="">No active assignments for your batch</option>
                    ) : (
                      assignments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} {a.dueDate ? `(Due: ${new Date(a.dueDate).toLocaleDateString()})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-theme-sub uppercase">Write Your Homework Text</label>
                    <button
                      type="button"
                      onClick={handleAIProofread}
                      disabled={proofreading || !submissionText}
                      className="px-3 py-1 bg-purple-600/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all disabled:opacity-50"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${proofreading ? 'animate-spin' : ''}`} />
                      <span>{proofreading ? 'AI Analyzing...' : 'Run Gemini AI Proofreader'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    placeholder="Type your essay or reading exercise text response here..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-theme-main text-sm font-serif focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Attach Finished Document (Optional - Max 5MB)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.png,.jpg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Homework to Teacher'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* AI Proofreader Report Card */}
            {aiReport && (
              <div className="bg-gradient-to-br from-purple-900/30 to-theme-card border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-theme pb-3">
                  <h3 className="font-bold text-theme-main text-base flex items-center space-x-2">
                    <Bot className="w-6 h-6 text-purple-500" />
                    <span>AI Proofreader Analysis Report</span>
                  </h3>

                  <span className="px-3 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-full font-mono font-bold text-xs">
                    Grammar Score: {aiReport.grammar_score}%
                  </span>
                </div>

                <p className="text-xs text-theme-sub italic">{aiReport.overall_feedback}</p>

                {aiReport.corrections.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-300 uppercase">Suggested Grammar Corrections:</h4>
                    {aiReport.corrections.map((c, i) => (
                      <div key={i} className="p-3 bg-theme-card-sub rounded-xl border border-theme text-xs space-y-1">
                        <div className="text-rose-500 line-through">"{c.original}"</div>
                        <div className="text-emerald-500 font-semibold">"{c.suggestion}"</div>
                        <div className="text-theme-sub text-[11px]">💡 {c.reason}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-emerald-500 uppercase mb-1">Polished Version Suggestion:</h4>
                  <div className="p-3 bg-theme-card-sub rounded-xl border border-theme text-xs text-theme-main font-serif">
                    {aiReport.improved_version}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submission History Sidebar */}
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-theme-main">Your Past Submissions</h2>

            {submissions.length === 0 ? (
              <p className="text-xs text-theme-sub text-center py-4">No past homework submissions found.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-theme-card-sub border border-theme rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-theme-main">{sub.assignment?.title || 'Assignment'}</span>
                      <span className="text-amber-500 font-mono font-semibold">
                        {sub.scoreAwarded > 0 ? `+${sub.scoreAwarded} pts` : 'Pending'}
                      </span>
                    </div>

                    {sub.teacherFeedback && (
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-600 dark:text-indigo-200">
                        💬 Teacher: "{sub.teacherFeedback}"
                      </div>
                    )}

                    <div className="text-[11px] text-theme-sub">{new Date(sub.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

