'use client';

import { useState, useEffect } from 'react';
import { getBatchesAction, updateBatchScheduleAction } from '@/app/actions/lms-actions';
import { Calendar, Video, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function SchedulePage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [scheduleInfo, setScheduleInfo] = useState('');
  const [zoomLink, setZoomLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    const res = await getBatchesAction();
    if (res.success && res.batches) {
      setBatches(res.batches);
      if (res.batches.length > 0) {
        setSelectedBatchId(res.batches[0].id);
        setScheduleInfo(res.batches[0].scheduleInfo || '');
        setZoomLink(res.batches[0].zoomLink || '');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((item) => item.id === batchId);
    if (b) {
      setScheduleInfo(b.scheduleInfo || '');
      setZoomLink(b.zoomLink || '');
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;

    setSaving(true);
    try {
      const res = await updateBatchScheduleAction(selectedBatchId, scheduleInfo, zoomLink);
      if (!res.success) throw new Error(res.error);

      toast.success('Schedule & Zoom link updated for batch!');
      fetchBatches();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Calendar className="w-7 h-7 text-indigo-400" />
          <span>Schedule Planner & Virtual Zoom Hub</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Set live class days/times and update static Zoom meeting URLs for student batches</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading schedule engine...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Select & Edit Schedule Panel */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white">Edit Batch Class Timings</h2>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefrLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Weekly Live Class Days & Time</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Every Mon & Wed from 7:00 PM to 8:30 PM UTC"
                  value={scheduleInfo}
                  onChange={(e) => setScheduleInfo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Static Zoom Meeting Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://zoom.us/j/987654321"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? 'Saving...' : 'Update Schedule'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Current Live Links Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Video className="w-5 h-5 text-emerald-400" />
              <span>Active Batch Zoom Links</span>
            </h2>

            <div className="space-y-3">
              {batches.map((b) => (
                <div key={b.id} className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{b.name}</span>
                    <span className="text-indigo-300 font-mono">{b.cefrLevel}</span>
                  </div>

                  <p className="text-xs text-slate-400">{b.scheduleInfo || 'No schedule set'}</p>

                  {b.zoomLink ? (
                    <a
                      href={b.zoomLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs text-emerald-400 hover:underline pt-1 font-semibold"
                    >
                      <span>Join Zoom Room</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500 block pt-1">No Zoom link attached</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
