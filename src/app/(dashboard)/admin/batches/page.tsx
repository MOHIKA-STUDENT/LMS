import { useState, useEffect } from 'react';
import {
  getBatchesAction,
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
  broadcastZoomLinkToAllBatchesAction,
} from '@/app/actions/lms-actions';
import { CEFRLevel } from '@prisma/client';
import { Plus, Users, Calendar, Video, BookOpen, Layers, Edit, Trash2, Radio, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Create Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [scheduleInfo, setScheduleInfo] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editingBatch, setEditingBatch] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCefrLevel, setEditCefrLevel] = useState<CEFRLevel>('B1');
  const [editScheduleInfo, setEditScheduleInfo] = useState('');
  const [editZoomLink, setEditZoomLink] = useState('');

  // Broadcast Form State
  const [broadcastZoomLink, setBroadcastZoomLink] = useState('');
  const [broadcastScheduleInfo, setBroadcastScheduleInfo] = useState('');

  const fetchBatches = async () => {
    setLoading(true);
    const res = await getBatchesAction();
    if (!res.success) {
      toast.error(res.error || 'Failed to load batches');
    } else {
      setBatches(res.batches || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await createBatchAction({
        name,
        description,
        cefrLevel,
        scheduleInfo,
        zoomLink,
      });

      if (!res.success) throw new Error(res.error);

      toast.success('Batch created successfully!');
      setShowModal(false);
      setName('');
      setDescription('');
      setScheduleInfo('');
      setZoomLink('');
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Error creating batch');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (batch: any) => {
    setEditingBatch(batch);
    setEditName(batch.name);
    setEditDescription(batch.description || '');
    setEditCefrLevel(batch.cefrLevel || 'B1');
    setEditScheduleInfo(batch.scheduleInfo || '');
    setEditZoomLink(batch.zoomLink || '');
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    setSubmitting(true);

    try {
      const res = await updateBatchAction(editingBatch.id, {
        name: editName,
        description: editDescription,
        cefrLevel: editCefrLevel,
        scheduleInfo: editScheduleInfo,
        zoomLink: editZoomLink,
      });

      if (!res.success) throw new Error(res.error);

      toast.success(`Batch "${editName}" updated successfully!`);
      setEditingBatch(null);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (batch: any) => {
    if (!confirm(`Are you sure you want to delete batch "${batch.name}"? Enrolled students will become unassigned.`)) {
      return;
    }

    try {
      const res = await deleteBatchAction(batch.id);
      if (!res.success) throw new Error(res.error);

      toast.success(`Batch "${batch.name}" deleted.`);
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete batch.');
    }
  };

  const handleBroadcastZoomLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastZoomLink) return;
    setSubmitting(true);

    try {
      const res = await broadcastZoomLinkToAllBatchesAction(broadcastZoomLink, broadcastScheduleInfo);
      if (!res.success) throw new Error(res.error);

      toast.success('Broadcasted Zoom link to ALL batches!');
      setShowBroadcastModal(false);
      setBroadcastZoomLink('');
      setBroadcastScheduleInfo('');
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to broadcast link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <Layers className="w-7 h-7 text-indigo-500" />
            <span>Batch Engine & Groups</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">Manage academy batches, edit schedules, delete batches, or broadcast Zoom links to all students</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-semibold rounded-xl flex items-center space-x-2 transition-all"
            title="Broadcast 1 Zoom Link to ALL Batches for a Joint Masterclass"
          >
            <Radio className="w-4 h-4 text-purple-500" />
            <span>Broadcast Link to All Batches</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading academy batches...</div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-sm">
          <BookOpen className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Batches Found</h3>
          <p className="text-sm text-theme-sub mt-1">Click "Create New Batch" to add your first academy group.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-theme-card border border-theme hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold">
                    {batch.cefrLevel} LEVEL
                  </span>

                  <div className="flex items-center space-x-2">
                    {batch.joinCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(batch.joinCode);
                          toast.success(`Copied join code: ${batch.joinCode}`);
                        }}
                        className="px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-bold hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                        title="Click to copy student join code"
                      >
                        <span>Code: {batch.joinCode}</span>
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-1 text-theme-sub hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Batch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      className="p-1 text-theme-sub hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-theme-main mb-2">{batch.name}</h3>
                <p className="text-sm text-theme-sub mb-4 line-clamp-2">{batch.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-2 border-t border-theme pt-4 text-xs text-theme-sub">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>{batch.scheduleInfo || 'Schedule pending'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-emerald-500" />
                  {batch.zoomLink ? (
                    <a href={batch.zoomLink} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline truncate font-medium">
                      {batch.zoomLink}
                    </a>
                  ) : (
                    <span className="text-theme-sub opacity-70">No Zoom link attached</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-theme-main">Create New Academy Batch</h2>
              <button onClick={() => setShowModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic English - Batch A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">CEFR Level</label>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Target audience or focus areas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Class Schedule Info</label>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri at 6:00 PM EST"
                  value={scheduleInfo}
                  onChange={(e) => setScheduleInfo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Live Zoom Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/123456789"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-theme-card-sub text-theme-main hover:opacity-90 rounded-xl text-sm font-semibold border border-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-theme-main">Edit Batch Details</h2>
              <button onClick={() => setEditingBatch(null)} className="text-theme-sub hover:text-theme-main">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">CEFR Level</label>
                <select
                  value={editCefrLevel}
                  onChange={(e) => setEditCefrLevel(e.target.value as CEFRLevel)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Mastery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Class Schedule Info</label>
                <input
                  type="text"
                  value={editScheduleInfo}
                  onChange={(e) => setEditScheduleInfo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Live Zoom Meeting Link</label>
                <input
                  type="url"
                  value={editZoomLink}
                  onChange={(e) => setEditZoomLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 bg-theme-card-sub text-theme-main hover:opacity-90 rounded-xl text-sm font-semibold border border-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Masterclass Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-theme-main flex items-center space-x-2">
                <Radio className="w-5 h-5 text-purple-500" />
                <span>Broadcast Link to ALL Batches</span>
              </h2>
              <button onClick={() => setShowBroadcastModal(false)} className="text-theme-sub hover:text-theme-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-theme-sub">
              Use this when hosting a joint Masterclass session or special webinar for all students across all your batches.
            </p>

            <form onSubmit={handleBroadcastZoomLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Masterclass Zoom / Video Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://zoom.us/j/999888777"
                  value={broadcastZoomLink}
                  onChange={(e) => setBroadcastZoomLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Masterclass Timing Info (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. SPECIAL MASTERCLASS: Today at 7:00 PM EST"
                  value={broadcastScheduleInfo}
                  onChange={(e) => setBroadcastScheduleInfo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-theme-card-sub text-theme-main hover:opacity-90 rounded-xl text-sm font-semibold border border-theme"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 disabled:opacity-50 flex items-center space-x-1"
                >
                  <Radio className="w-4 h-4" />
                  <span>{submitting ? 'Broadcasting...' : 'Broadcast to All Students'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
