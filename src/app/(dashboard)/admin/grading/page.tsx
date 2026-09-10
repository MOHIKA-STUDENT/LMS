'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { HomeworkSubmission } from '@/types/database';
import { CheckSquare, Award, MessageSquare, ExternalLink, Bot, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function GradingPage() {
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState<HomeworkSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number>(100);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('homework_submissions')
      .select('*, profiles(*), assignments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load submissions.');
    } else {
      setSubmissions((data as HomeworkSubmission[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const openGradingModal = (sub: HomeworkSubmission) => {
    setActiveSubmission(sub);
    setFeedback(sub.teacher_feedback || '');
    setScore(sub.score_awarded || 100);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;

    setSaving(true);
    try {
      // 1. Update submission record
      const { error: subError } = await supabase
        .from('homework_submissions')
        .update({
          teacher_feedback: feedback,
          score_awarded: score,
        })
        .eq('id', activeSubmission.id);

      if (subError) throw subError;

      // 2. Award points to student profile
      const studentId = activeSubmission.student_id;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', studentId)
        .single();

      if (profileData) {
        const newPoints = (profileData.points || 0) + score;
        await supabase
          .from('profiles')
          .update({ points: newPoints })
          .eq('id', studentId);
      }

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
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <CheckSquare className="w-7 h-7 text-indigo-400" />
          <span>Grading & Feedback Panel</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review student submissions, view AI Proofreader reports, write teacher feedback, and award points</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading homework submissions...</div>
      ) : submissions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Submissions Found</h3>
          <p className="text-sm text-slate-500 mt-1">Students have not submitted any homework tasks yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                    {sub.profiles?.full_name || 'Student'}
                  </span>
                  <span className="text-xs text-amber-400 font-mono font-semibold">
                    {sub.score_awarded > 0 ? `+${sub.score_awarded} pts` : 'Pending Grade'}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base">{sub.assignments?.title || 'Homework Assignment'}</h3>

                {sub.submission_text && (
                  <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl line-clamp-3 font-serif italic border border-slate-700/50">
                    "{sub.submission_text}"
                  </p>
                )}

                {sub.ai_proofread_report && (
                  <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-purple-300 font-bold">
                      <span className="flex items-center space-x-1">
                        <Bot className="w-3.5 h-3.5 text-purple-400" />
                        <span>AI Grammar Score</span>
                      </span>
                      <span>{sub.ai_proofread_report.grammar_score}%</span>
                    </div>
                    <p className="text-slate-400 line-clamp-2">{sub.ai_proofread_report.overall_feedback}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500">{new Date(sub.created_at).toLocaleDateString()}</span>

                <button
                  onClick={() => openGradingModal(sub)}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{sub.score_awarded > 0 ? 'Edit Grade' : 'Grade Homework'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade & Feedback Modal */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Grade Submission - {activeSubmission.profiles?.full_name}</span>
            </h2>

            {/* Submission Content */}
            <div className="bg-slate-800/60 p-4 rounded-xl space-y-2 text-sm">
              <h4 className="font-semibold text-slate-300">Student Submission Text:</h4>
              <p className="text-slate-200 whitespace-pre-wrap font-serif bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                {activeSubmission.submission_text || 'No text submitted.'}
              </p>
            </div>

            {/* AI Proofreader Breakdown if available */}
            {activeSubmission.ai_proofread_report && (
              <div className="bg-purple-950/30 border border-purple-800/50 p-4 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-purple-300 flex items-center space-x-1 text-sm">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>AI Proofreader Analysis ({activeSubmission.ai_proofread_report.grammar_score}% Score)</span>
                </h4>
                <p className="text-slate-300">{activeSubmission.ai_proofread_report.overall_feedback}</p>
                <div className="font-semibold text-purple-200 pt-1">AI Improved Version:</div>
                <div className="bg-slate-950/60 p-2.5 rounded text-emerald-300 font-serif">
                  {activeSubmission.ai_proofread_report.improved_version}
                </div>
              </div>
            )}

            {/* Grade Input Form */}
            <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Award Score / Points</label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  required
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Teacher Written Feedback</label>
                <textarea
                  rows={3}
                  placeholder="Provide personalized advice and encouragement..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSubmission(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-semibold"
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
