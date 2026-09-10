'use client';

import { useState, useEffect } from 'react';
import { getStudentProfileAction } from '@/app/actions/lms-actions';
import { Calendar, Video, ExternalLink, Clock, Award, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentTimelinePage() {
  const [profile, setProfile] = useState<any | null>(null);
  const [batch, setBatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      const res = await getStudentProfileAction();
      if (res.success && res.profile) {
        setProfile(res.profile);
        setBatch(res.profile.batch);
      }
      setLoading(false);
    };

    fetchStudentData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-mono font-bold tracking-wider">
            STUDENT PORTAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Welcome back, {profile?.fullName || 'Student'}! 👋
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Batch: <span className="font-semibold text-indigo-300">{batch?.name || 'Unassigned Batch'}</span> ({batch?.cefrLevel || 'CEFR Level Pending'})
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center space-x-4 self-start sm:self-auto">
          <Award className="w-10 h-10 text-amber-400" />
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Earned Points</div>
            <div className="text-2xl font-black text-amber-400 font-mono">{profile?.points || 0} PTS</div>
          </div>
        </div>
      </div>

      {/* Class Schedule & Live Zoom Button */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading batch schedule...</div>
      ) : !batch ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Batch Assigned Yet</h3>
          <p className="text-sm text-slate-500 mt-1">Please ask your teacher to assign you to a batch in the Roster manager.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Live Zoom Call Action Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Zoom Meeting Room</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{batch.name} Live Class</h2>
              <p className="text-sm text-slate-300">
                Click the button below to join your batch's interactive live video session.
              </p>
            </div>

            {batch.zoomLink ? (
              <a
                href={batch.zoomLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all group"
              >
                <Video className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-base">Join Live Zoom Class Now</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            ) : (
              <div className="p-4 bg-slate-800/60 rounded-xl text-xs text-slate-400 text-center border border-slate-700/50">
                Zoom link has not been posted by your teacher for this batch yet.
              </div>
            )}
          </div>

          {/* Schedule Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Weekly Class Schedule</span>
            </h2>

            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold">
                <Clock className="w-4 h-4" />
                <span>Timings Info</span>
              </div>
              <p className="text-base font-semibold text-white">
                {batch.scheduleInfo || 'No live schedule info specified.'}
              </p>
            </div>

            <div className="text-xs text-slate-400 space-y-1 pt-2">
              <p>💡 Tip: Ensure you arrive 5 minutes before class start time with your study notes ready.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
