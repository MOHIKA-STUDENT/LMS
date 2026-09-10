'use client';

import { useState, useEffect } from 'react';
import { getLeaderboardAction } from '@/app/actions/lms-actions';
import { useUser } from '@clerk/nextjs';
import { formatStudentDisplayName } from '@/lib/utils/format-name';
import { Award, Trophy, Medal, Crown, Filter } from 'lucide-react';

export default function StudentLeaderboardPage() {
  const { user } = useUser();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentUserBatchId, setCurrentUserBatchId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'GLOBAL' | 'BATCH'>('GLOBAL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const res = await getLeaderboardAction();
      if (res.success && res.profiles) {
        setProfiles(res.profiles);
        const myProfile = res.profiles.find((p) => p.id === user?.id);
        if (myProfile) {
          setCurrentUserBatchId(myProfile.batchId);
        }
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [user?.id]);

  const displayedProfiles = filterMode === 'BATCH' && currentUserBatchId
    ? profiles.filter((p) => p.batchId === currentUserBatchId)
    : profiles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Gamified Scoreboard & Leaderboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Compete with fellow English academy students by completing quizzes and homework</p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setFilterMode('GLOBAL')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'GLOBAL'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Global Academy Rank
          </button>

          <button
            onClick={() => setFilterMode('BATCH')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'BATCH'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Batch Rank
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading academy leaderboard...</div>
      ) : displayedProfiles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          No students ranked in this view yet.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-2">
          {/* Top 3 Podium Highlights */}
          {displayedProfiles.length >= 1 && (
            <div className="p-6 bg-gradient-to-b from-indigo-950/40 to-slate-900 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {displayedProfiles.slice(0, 3).map((p, rankIdx) => {
                const colors = [
                  'from-amber-500/20 to-yellow-600/10 border-amber-500/40 text-amber-300',
                  'from-slate-400/20 to-slate-500/10 border-slate-400/40 text-slate-200',
                  'from-amber-700/20 to-amber-800/10 border-amber-700/40 text-amber-400',
                ];
                const icons = [Crown, Medal, Award];
                const Icon = icons[rankIdx];
                const studentName = formatStudentDisplayName(p.fullName, p.email);

                return (
                  <div key={p.id} className={`p-4 rounded-xl border bg-gradient-to-b ${colors[rankIdx]} flex flex-col items-center text-center space-y-2 relative`}>
                    <div className="absolute top-2 left-3 font-mono font-black text-xs opacity-75">
                      #{rankIdx + 1}
                    </div>
                    <Icon className="w-8 h-8" />
                    <div>
                      <h4 className="font-bold text-white text-base">{studentName}</h4>
                      <p className="text-xs opacity-80">{p.batch?.name || 'Academy Student'}</p>
                    </div>
                    <div className="font-mono font-black text-lg text-amber-400">{p.points} PTS</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Rank</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Batch</th>
                  <th className="px-6 py-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedProfiles.map((p, index) => {
                  const isCurrent = p.id === user?.id;
                  const studentName = formatStudentDisplayName(p.fullName, p.email);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-indigo-600/20 font-semibold text-white border-l-4 border-l-indigo-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-xs text-slate-400">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-white flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {studentName.charAt(0).toUpperCase()}
                        </div>
                        <span>{studentName} {isCurrent && '(You)'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {p.batch?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-400 font-mono">
                        {p.points} PTS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
