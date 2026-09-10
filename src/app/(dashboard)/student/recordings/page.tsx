'use client';

import { useState, useEffect } from 'react';
import { getRecordedSessionsAction, logVideoWatchProgressAction, getStudentProfileAction } from '@/app/actions/lms-actions';
import { Video, Play, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentRecordingsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [studentProfile, setStudentProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const pRes = await getStudentProfileAction();
    if (pRes.success && pRes.profile) {
      setStudentProfile(pRes.profile);
      const sRes = await getRecordedSessionsAction(pRes.profile.batchId || undefined);
      if (sRes.success && sRes.sessions) {
        setSessions(sRes.sessions);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartWatch = async (session: any) => {
    setActiveSession(session);
    const totalSecs = session.durationSeconds || 2700;
    await logVideoWatchProgressAction(session.id, totalSecs, true);
    toast.success(`Playing recording: ${session.title}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Video className="w-7 h-7 text-indigo-400" />
          <span>Recorded Class Sessions</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Watch recorded live classes for your batch and catch up on lesson material anytime</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading class recordings...</div>
      ) : activeSession ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">{activeSession.title}</h2>
            <button
              onClick={() => setActiveSession(null)}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg"
            >
              Close Video
            </button>
          </div>

          <div className="aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-800">
            {activeSession.videoUrl.includes('youtube') || activeSession.videoUrl.includes('vimeo') ? (
              <iframe
                src={activeSession.videoUrl}
                className="w-full h-full"
                allowFullScreen
                title={activeSession.title}
              />
            ) : (
              <video
                src={activeSession.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                onEnded={() => {
                  logVideoWatchProgressAction(activeSession.id, activeSession.durationSeconds, true);
                  toast.success('Session completed!');
                }}
              />
            )}
          </div>

          {activeSession.description && (
            <p className="text-xs text-slate-300 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              {activeSession.description}
            </p>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Recordings Posted Yet</h3>
          <p className="text-sm text-slate-500 mt-1">Your teacher has not uploaded any class recordings for your batch yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                    {session.batch?.name || 'Batch'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {Math.round(session.durationSeconds / 60)} mins
                  </span>
                </div>

                <h3 className="font-bold text-white text-lg mb-1">{session.title}</h3>
                {session.description && <p className="text-xs text-slate-400">{session.description}</p>}
              </div>

              <button
                onClick={() => handleStartWatch(session)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Class Recording</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
