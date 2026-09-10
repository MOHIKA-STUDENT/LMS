'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Batch } from '@/types/database';
import { Users, Award, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RosterPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('*, batches(*)')
      .order('created_at', { ascending: false });

    const { data: batchesData } = await supabase
      .from('batches')
      .select('*')
      .order('name');

    if (studentsData) setStudents(studentsData as Profile[]);
    if (batchesData) setBatches(batchesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignBatch = async (studentId: string, batchId: string) => {
    const newBatchId = batchId === '' ? null : batchId;
    const { error } = await supabase
      .from('profiles')
      .update({ batch_id: newBatchId })
      .eq('id', studentId);

    if (error) {
      toast.error('Failed to update student batch.');
    } else {
      toast.success('Student batch updated!');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Users className="w-7 h-7 text-indigo-400" />
          <span>Student Roster & Batch Manager</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Assign enrolled students to custom batches and track total earned points</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading student roster...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Assigned Batch</th>
                  <th className="px-6 py-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span>{student.full_name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        student.role === 'TEACHER'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {student.role === 'TEACHER' ? <Shield className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {student.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.role === 'STUDENT' ? (
                        <select
                          value={student.batch_id || ''}
                          onChange={(e) => handleAssignBatch(student.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- No Batch --</option>
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.cefr_level})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500">N/A (Teacher)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-amber-400 font-mono">
                      <span className="inline-flex items-center space-x-1">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>{student.points} pts</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
