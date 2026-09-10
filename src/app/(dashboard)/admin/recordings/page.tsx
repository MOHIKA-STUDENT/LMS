'use client';

import { useState, useEffect } from 'react';
import {
  getBatchesAction,
  getRosterAction,
  createRecordedSessionAction,
  updateRecordedSessionAction,
  deleteRecordedSessionAction,
  getRecordedSessionsAction,
  uploadMaterialAction,
} from '@/app/actions/lms-actions';
import { formatEmbedVideoUrl, getYouTubeThumbnail, isYouTubeOrVimeo } from '@/lib/utils/video-helper';
import { processAndValidateFileUpload } from '@/lib/utils/asset-shield';
import { Video, Plus, CheckCircle2, Clock, Eye, Trash2, Edit3, UploadCloud, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordingsAdminPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url');
  const [isGlobal, setIsGlobal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [submitting, setSubmitting] = useState(false);

  // Edit State
  const [editingSession, setEditingSession] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editIsGlobal, setEditIsGlobal] = useState(false);
  const [editBatchId, setEditBatchId] = useState('');

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
    if (!title.trim()) {
      toast.error('Please enter a session title.');
      return;
    }
    if (!isGlobal && !selectedBatchId) {
      toast.error('Please select a target batch or check All Batches.');
      return;
    }

    setSubmitting(true);
    let finalVideoUrl = videoUrl;

    try {
      if (inputMode === 'file') {
        if (!videoFile) {
          toast.error('Please select a video file to upload.');
          setSubmitting(false);
          return;
        }

        // Validate and upload video using asset shield
        const validation = await processAndValidateFileUpload(videoFile);
        if (!validation.valid || !validation.processedFile) {
          toast.error(validation.error || 'Video file validation failed.');
          setSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('batchId', isGlobal ? '' : selectedBatchId);
        formData.append('isGlobal', isGlobal ? 'true' : 'false');
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', validation.processedFile);

        const uploadRes = await uploadMaterialAction(formData);
        if (!uploadRes.success || !uploadRes.material?.fileUrl) {
          throw new Error(uploadRes.error || 'Video upload failed.');
        }
        finalVideoUrl = uploadRes.material.fileUrl;
      }

      if (!finalVideoUrl) {
        toast.error('Please provide a valid video URL or upload a video file.');
        setSubmitting(false);
        return;
      }

      const formattedUrl = formatEmbedVideoUrl(finalVideoUrl);
      const res = await createRecordedSessionAction({
        batchId: isGlobal ? null : selectedBatchId,
        isGlobal,
        title,
        description,
        videoUrl: formattedUrl,
        durationSeconds: durationMinutes * 60,
      });

      if (res.success) {
        toast.success('Recorded class session published successfully!');
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setVideoFile(null);
        loadSessions(selectedBatchId);
      } else {
        toast.error(res.error || 'Failed to post session recording.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish recording.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class recording?')) return;
    const res = await deleteRecordedSessionAction(id);
    if (res.success) {
      toast.success('Recording deleted.');
      loadSessions(selectedBatchId);
    } else {
      toast.error(res.error || 'Failed to delete recording.');
    }
  };

  const handleEditSave = async () => {
    if (!editingSession) return;
    const res = await updateRecordedSessionAction({
      id: editingSession.id,
      batchId: editIsGlobal ? null : editBatchId,
      isGlobal: editIsGlobal,
      title: editTitle,
      description: editDescription,
      videoUrl: formatEmbedVideoUrl(editVideoUrl),
    });

    if (res.success) {
      toast.success('Recording updated successfully!');
      setEditingSession(null);
      loadSessions(selectedBatchId);
    } else {
      toast.error(res.error || 'Failed to update recording.');
    }
  };

  const batchStudents = students.filter((s) => s.batchId === selectedBatchId && s.role === 'STUDENT');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <Video className="w-7 h-7 text-indigo-500" />
            <span>Recorded Class Sessions & Engagement Analytics</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">Post lecture recordings (YouTube embeds or direct uploads) and track student watch time</p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-theme-sub uppercase">Batch Filter:</label>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            <span>Publish Lecture Recording</span>
          </h2>

          <div className="flex items-center space-x-2 bg-theme-card-sub p-1 border border-theme rounded-xl">
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'url'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-theme-sub hover:text-theme-main'
              }`}
            >
              YouTube / Video Link
            </button>
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                inputMode === 'file'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-theme-sub hover:text-theme-main'
              }`}
            >
              Upload Video File
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Scope</label>
            <div className="flex items-center space-x-3 pt-1">
              <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">All Batches (Global)</span>
              </label>

              {!isGlobal && (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefrLevel})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Session Title</label>
            <input
              type="text"
              required
              placeholder="e.g. CEFR B2 - Nouns & Pronouns Master Class"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {inputMode === 'url' ? (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">
                Video Link (YouTube, Vimeo, Cloudinary, or Direct Stream URL)
              </label>
              <input
                type="url"
                required={inputMode === 'url'}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">
                Upload Video File (.mp4, .webm - Max 5MB Limit Enforced)
              </label>
              <input
                type="file"
                accept="video/*"
                required={inputMode === 'file'}
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description / Notes</label>
            <input
              type="text"
              placeholder="Brief overview of concepts covered..."
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
              <UploadCloud className="w-4 h-4" />
              <span>{submitting ? 'Publishing Recording...' : 'Publish Lecture Recording'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Posted Sessions List & Video Cards */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
          <Video className="w-5 h-5 text-indigo-500" />
          <span>Published Class Recordings & Video Cards</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading recorded sessions...</div>
        ) : sessions.length === 0 ? (
          <p className="text-center py-6 text-sm text-theme-sub">No recorded sessions published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session) => {
              const watchedLogs = session.watchLogs || [];
              const totalBatchStudents = batchStudents.length;
              const watchedCount = watchedLogs.length;
              const batchName = batches.find((b) => b.id === session.batchId)?.name || (session.isGlobal ? 'All Batches (Global)' : 'Batch Recording');
              const embedUrl = formatEmbedVideoUrl(session.videoUrl);
              const ytThumbnail = getYouTubeThumbnail(session.videoUrl);
              const isEmbeddable = isYouTubeOrVimeo(session.videoUrl);

              return (
                <div key={session.id} className="bg-theme-card-sub border border-theme rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-mono font-bold">
                        {batchName}
                      </span>
                      <span className="text-xs text-theme-sub font-mono">
                        {Math.round(session.durationSeconds / 60)} mins
                      </span>
                    </div>

                    <h3 className="font-bold text-theme-main text-base">{session.title}</h3>
                    {session.description && <p className="text-xs text-theme-sub">{session.description}</p>}

                    {/* Inline Video Player / Card */}
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-theme shadow-inner mt-2">
                      {isEmbeddable ? (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={session.title}
                        />
                      ) : (
                        <video
                          src={session.videoUrl}
                          controls
                          className="w-full h-full object-contain"
                          poster={ytThumbnail || undefined}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-theme pt-3">
                    <button
                      onClick={() =>
                        setSelectedSessionForAnalytics(
                          selectedSessionForAnalytics?.id === session.id ? null : session
                        )
                      }
                      className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Watch Analytics ({watchedCount}/{totalBatchStudents})</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingSession(session);
                          setEditTitle(session.title);
                          setEditDescription(session.description || '');
                          setEditVideoUrl(session.videoUrl);
                          setEditIsGlobal(session.isGlobal);
                          setEditBatchId(session.batchId || '');
                        }}
                        className="p-2 text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Recording"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Analytics Modal Drawer */}
                  {selectedSessionForAnalytics?.id === session.id && (
                    <div className="mt-2 p-4 bg-theme-card border border-indigo-500/30 rounded-xl space-y-3">
                      <h4 className="font-bold text-indigo-600 dark:text-indigo-300 text-xs uppercase tracking-wider flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Student Watch Engagement</span>
                      </h4>

                      <div className="divide-y divide-theme max-h-48 overflow-y-auto">
                        {batchStudents.length === 0 ? (
                          <p className="text-xs text-theme-sub py-2">No students enrolled in this batch yet.</p>
                        ) : (
                          batchStudents.map((student) => {
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

                                <div>
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
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Recording Modal */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-theme-main">Edit Recorded Class Session</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Session Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Video Stream Link</label>
                <input
                  type="url"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsGlobal}
                    onChange={(e) => setEditIsGlobal(e.target.checked)}
                    className="rounded border-theme text-indigo-600"
                  />
                  <span className="font-semibold text-indigo-600 dark:text-indigo-300">All Batches (Global)</span>
                </label>

                {!editIsGlobal && (
                  <select
                    value={editBatchId}
                    onChange={(e) => setEditBatchId(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.cefrLevel})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-theme">
              <button
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-theme-main rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
