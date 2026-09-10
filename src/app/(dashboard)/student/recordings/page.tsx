'use client';

import { useState, useEffect } from 'react';
import { getRecordedSessionsAction, logVideoWatchProgressAction, getStudentProfileAction } from '@/app/actions/lms-actions';
import { formatEmbedVideoUrl, getYouTubeThumbnail, isYouTubeOrVimeo } from '@/lib/utils/video-helper';
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
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <Video className="w-7 h-7 text-indigo-500" />
          <span>Recorded Class Sessions</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Watch recorded live classes and lecture videos for your batch anytime</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading class recordings...</div>
      ) : activeSession ? (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between border-b border-theme pb-3">
            <h2 className="text-lg font-bold text-theme-main">{activeSession.title}</h2>
            <button
              onClick={() => setActiveSession(null)}
              className="text-xs font-semibold text-theme-sub hover:text-theme-main bg-theme-card-sub border border-theme px-3 py-1.5 rounded-lg"
            >
              Close Video
            </button>
          </div>

          <div className="aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center border border-theme shadow-2xl">
            {isYouTubeOrVimeo(activeSession.videoUrl) ? (
              <iframe
                src={formatEmbedVideoUrl(activeSession.videoUrl)}
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
            <p className="text-xs text-theme-sub bg-theme-card-sub p-4 rounded-xl border border-theme">
              {activeSession.description}
            </p>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-sm">
          <Video className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Recordings Posted Yet</h3>
          <p className="text-sm text-theme-sub mt-1">Your teacher has not uploaded any class recordings for your batch yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((session) => {
            const isEmbed = isYouTubeOrVimeo(session.videoUrl);
            const embedUrl = formatEmbedVideoUrl(session.videoUrl);
            const ytThumbnail = getYouTubeThumbnail(session.videoUrl);

            return (
              <div
                key={session.id}
                className="bg-theme-card border border-theme hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                      {session.batch?.name || (session.isGlobal ? 'All Batches (Global)' : 'Batch Class')}
                    </span>
                    <span className="text-xs text-theme-sub font-mono">
                      {Math.round(session.durationSeconds / 60)} mins
                    </span>
                  </div>

                  <h3 className="font-bold text-theme-main text-lg">{session.title}</h3>
                  {session.description && <p className="text-xs text-theme-sub">{session.description}</p>}

                  {/* Embedded Video Card Player */}
                  <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-theme shadow-inner">
                    {isEmbed ? (
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

                <button
                  onClick={() => handleStartWatch(session)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Full Class Recording</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
