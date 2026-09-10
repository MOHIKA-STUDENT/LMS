'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Batch, CEFRLevel } from '@/types/database';
import { Plus, Users, Calendar, Video, BookOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [scheduleInfo, setScheduleInfo] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchBatches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('batches').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load batches');
    } else {
      setBatches(data || []);
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
      const { error } = await supabase.from('batches').insert({
        name,
        description,
        cefr_level: cefrLevel,
        schedule_info: scheduleInfo,
        zoom_link: zoomLink,
      });

      if (error) throw error;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-7 h-7 text-indigo-400" />
            <span>Batch Engine & Groups</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage academy batches, time schedules, and virtual Zoom links</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Batch</span>
        </button>
      </div>

      {/* Batches Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading academy batches...</div>
      ) : batches.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Batches Found</h3>
          <p className="text-sm text-slate-500 mt-1">Click "Create New Batch" to add your first academy group.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold">
                    {batch.cefr_level} LEVEL
                  </span>
                  <span className="text-xs text-slate-500">
                    ID: {batch.id.substring(0, 8)}...
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{batch.name}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{batch.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{batch.schedule_info || 'Schedule pending'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  {batch.zoom_link ? (
                    <a href={batch.zoom_link} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline truncate">
                      {batch.zoom_link}
                    </a>
                  ) : (
                    <span className="text-slate-500">No Zoom link attached</span>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">Create New Academy Batch</h2>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Batch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic English - Batch A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">CEFR Level</label>
                <select
                  value={cefrLevel}
                  onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Target audience or focus areas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Class Schedule Info</label>
                <input
                  type="text"
                  placeholder="e.g. Mon, Wed, Fri at 6:00 PM EST"
                  value={scheduleInfo}
                  onChange={(e) => setScheduleInfo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Live Zoom Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/123456789"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-sm font-semibold"
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
    </div>
  );
}
