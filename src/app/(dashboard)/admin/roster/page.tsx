'use client';

import { useState, useEffect } from 'react';
import {
  getRosterAction,
  getBatchesAction,
  updateStudentBatchAction,
  updateStudentAccessAction,
  deleteStudentAction,
} from '@/app/actions/lms-actions';
import { formatStudentDisplayName } from '@/lib/utils/format-name';
import { Users, Award, Shield, CheckCircle2, Edit, Trash2, UserX, UserCheck, Search, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RosterPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBatchId, setEditBatchId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const rosterRes = await getRosterAction();
    const batchRes = await getBatchesAction();

    if (rosterRes.success && rosterRes.profiles) {
      setStudents(rosterRes.profiles);
    }
    if (batchRes.success && batchRes.batches) {
      setBatches(batchRes.batches);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignBatch = async (studentId: string, batchId: string) => {
    const res = await updateStudentBatchAction(studentId, batchId || null);
    if (!res.success) {
      toast.error(res.error || 'Failed to update student batch.');
    } else {
      toast.success('Student batch updated!');
      fetchData();
    }
  };

  const handleToggleAccess = async (student: any) => {
    const newStatus = !(student.isActive !== false);
    const res = await updateStudentAccessAction(student.id, newStatus);

    if (!res.success) {
      toast.error(res.error || 'Failed to update access status.');
    } else {
      toast.success(`Access ${newStatus ? 'granted' : 'suspended'} for ${student.fullName}.`);
      fetchData();
    }
  };

  const handleDeleteStudent = async (student: any) => {
    if (!confirm(`Are you sure you want to remove student "${student.fullName}" from the academy? This action cannot be undone.`)) {
      return;
    }

    const res = await deleteStudentAction(student.id);
    if (!res.success) {
      toast.error(res.error || 'Failed to remove student profile.');
    } else {
      toast.success(`Student ${student.fullName} removed.`);
      fetchData();
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setEditName(student.fullName);
    setEditEmail(student.email);
    setEditBatchId(student.batchId || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setSaving(true);
    try {
      const res = await updateStudentBatchAction(editingStudent.id, editBatchId || null);
      if (!res.success) throw new Error(res.error);

      toast.success('Student details updated successfully!');
      setEditingStudent(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update student.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-7 h-7 text-indigo-400" />
            <span>Student Roster & Permissions Manager</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage student accounts, edit details, assign batches, toggle portal permissions, or remove students</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
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
                  <th className="px-6 py-4">Status & Access</th>
                  <th className="px-6 py-4">Assigned Batch</th>
                  <th className="px-6 py-4">Points</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                        {formatStudentDisplayName(student.fullName, student.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{formatStudentDisplayName(student.fullName, student.email)}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{student.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        student.isActive !== false
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {student.isActive !== false ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1 text-rose-400" />
                            <span>Suspended</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.role === 'STUDENT' ? (
                        <select
                          value={student.batchId || ''}
                          onChange={(e) => handleAssignBatch(student.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- No Batch --</option>
                          {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.cefrLevel})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-slate-500">N/A (Teacher)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-amber-400 font-mono text-xs">
                      {student.points} pts
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Student Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleAccess(student)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          student.isActive !== false
                            ? 'text-amber-400 hover:bg-slate-800'
                            : 'text-emerald-400 hover:bg-slate-800'
                        }`}
                        title={student.isActive !== false ? 'Suspend Access' : 'Grant Access'}
                      >
                        {student.isActive !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Remove Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Student Profile</h2>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assigned Batch</label>
                <select
                  value={editBatchId}
                  onChange={(e) => setEditBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- No Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefr_level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
