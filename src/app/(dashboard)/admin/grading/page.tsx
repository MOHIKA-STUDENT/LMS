'use client';

import { useState, useEffect } from 'react';
import { getSubmissionsAction, gradeSubmissionAction } from '@/app/actions/lms-actions';
import { CheckSquare, Award, MessageSquare, ExternalLink, Bot, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function GradingPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    const res = await getSubmissionsAction();
    if (!res.success) {
      toast.error(res.error || 'Failed to load submissions.');
    } else {
      setSubmissions(res.submissions || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openGradingModal = (sub: any) => {
    setActiveSubmission(sub);
    setFeedback(sub.teacherFeedback || '');
    setScore(sub.scoreAwarded || 100);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setSaving(true);
    try {
      const res = await gradeSubmissionAction(activeSubmission.id, feedback, score);
      if (!res.success) throw new Error(res.error);

      toast.success(`Graded! ${score} points awarded to student.`);
      setActiveSubmission(null);
      fetchSubmissions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to grade submission');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <CheckSquare className="w-7 h-7 text-indigo-500" />
          <span>Grading & Feedback Panel</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Review student submissions, view AI Proofreader reports, write teacher feedback, and award points</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading homework submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-sm">
          <CheckSquare className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Submissions Found</h3>
          <p className="text-sm text-theme-sub mt-1">Students have not submitted any homework tasks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
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

                {sub.writtenResponse && (
                  <p className="text-xs text-theme-sub bg-theme-card-sub p-3 rounded-xl line-clamp-3 font-serif italic border border-theme">
                    "{sub.writtenResponse}"
                  </p>
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
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{sub.scoreAwarded > 0 ? 'Edit Grade' : 'Grade Homework'}</span>
                </button>
              </div>
            </div>
          ))}
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
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Submit Score & Feedback'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
