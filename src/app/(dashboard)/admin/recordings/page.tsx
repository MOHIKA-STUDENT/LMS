'use client';

import { useState, useEffect } from 'react';
import { getBatchesAction, getRosterAction, createRecordedSessionAction, getRecordedSessionsAction } from '@/app/actions/lms-actions';
import { Video, Plus, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordingsAdminPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSessionForAnalytics, setSelectedSessionForAnalytics] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const bRes = await getBatchesAction();
    const rRes = await getRosterAction();

    if (bRes.success && bRes.batches) {
      setBatches(bRes.batches);
      if (bRes.batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bRes.batches[0].id);
      }
    }
    if (rRes.success && rRes.profiles) {
      setStudents(rRes.profiles);
    }
    setLoading(false);
  };

  const loadSessions = async (batchId?: string) => {
    const sRes = await getRecordedSessionsAction(batchId);
    if (sRes.success && sRes.sessions) {
      setSessions(sRes.sessions);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadSessions(selectedBatchId);
    }
  }, [selectedBatchId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !title.trim() || !videoUrl.trim()) {
      toast.error('Please fill in required fields (batch, title, video link).');
      return;
    }

    setSubmitting(true);
    const res = await createRecordedSessionAction({
      batchId: selectedBatchId,
      title,
      description,
      videoUrl,
      durationSeconds: durationMinutes * 60,
    });

    if (res.success) {
      toast.success('Recorded class session posted successfully!');
      setTitle('');
      setDescription('');
      setVideoUrl('');
      loadSessions(selectedBatchId);
    } else {
      toast.error(res.error || 'Failed to post session recording.');
    }
    setSubmitting(false);
  };

  const batchStudents = students.filter((s) => s.batchId === selectedBatchId && s.role === 'STUDENT');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <Video className="w-7 h-7 text-indigo-500" />
            <span>Recorded Class Sessions & Analytics</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">Post class recordings and monitor student watch engagement</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-theme-sub uppercase">Batch:</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500 font-semibold"
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.cefrLevel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Post Recording Form */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <Plus className="w-5 h-5 text-indigo-500" />
          <span>Post Recorded Session Link</span>
        </h2>

        <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Session Title</label>
            <input
              type="text"
              required
              placeholder="e.g. CEFR B1 - Present Perfect & Business Fluency Class"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Video Stream Link (Cloudinary / YouTube / Vimeo / Direct URL)</label>
            <input
              type="url"
              required
              placeholder="https://res.cloudinary.com/... or https://youtube.com/embed/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Session Description / Notes</label>
            <input
              type="text"
              placeholder="Brief summary of what was covered in this recording..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              max="300"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>{submitting ? 'Posting Recording...' : 'Publish Recording to Batch'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Posted Sessions & Watch Analytics */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <Eye className="w-5 h-5 text-indigo-500" />
          <span>Batch Recorded Sessions & Student Engagement</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading recorded sessions...</div>
        ) : sessions.length === 0 ? (
          <p className="text-center py-6 text-sm text-theme-sub">No recorded sessions published for this batch yet.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const watchedLogs = session.watchLogs || [];
              const totalBatchStudents = batchStudents.length;
              const watchedCount = watchedLogs.length;

              return (
                <div key={session.id} className="p-5 bg-theme-card-sub border border-theme rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-theme-main text-base">{session.title}</h3>
                      {session.description && <p className="text-xs text-theme-sub mt-1">{session.description}</p>}
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-lg font-mono font-bold">
                        {Math.round(session.durationSeconds / 60)} mins
                      </span>
                      <button
                        onClick={() =>
                          setSelectedSessionForAnalytics(
                            selectedSessionForAnalytics?.id === session.id ? null : session
                          )
                        }
                        className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white font-semibold rounded-lg flex items-center space-x-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Watch Analytics ({watchedCount}/{totalBatchStudents})</span>
                      </button>
                    </div>
                  </div>

                  {/* Analytics Modal Drawer */}
                  {selectedSessionForAnalytics?.id === session.id && (
                    <div className="mt-4 p-4 bg-theme-card border border-indigo-500/30 rounded-xl space-y-3">
                      <h4 className="font-bold text-indigo-600 dark:text-indigo-300 text-xs uppercase tracking-wider flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Student Watch Breakdown</span>
                      </h4>

                      <div className="divide-y divide-theme">
                        {batchStudents.map((student) => {
                          const log = watchedLogs.find((w: any) => w.studentId === student.id);
                          const watchedMinutes = log ? Math.round(log.watchedSeconds / 60) : 0;
                          const totalMinutes = Math.round(session.durationSeconds / 60) || 45;
                          const pct = Math.min(100, Math.round((watchedMinutes / totalMinutes) * 100));

                          return (
                            <div key={student.id} className="py-2 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-theme-main">{student.fullName}</span>
                                <span className="text-[10px] text-theme-sub ml-2">({student.email})</span>
                              </div>

                              <div className="flex items-center space-x-3">
                                {log ? (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
                                    Watched {watchedMinutes}m ({pct}%)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 rounded text-[10px] font-mono font-bold">
                                    Not Watched Yet
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
