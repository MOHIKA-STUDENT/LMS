'use client';

import { useState, useEffect } from 'react';
import { getBatchesAction, getRosterAction, markAttendanceAction, getBatchAttendanceAction, updateFeeRecordAction, getBatchFeeRecordsAction } from '@/app/actions/lms-actions';
import { Calendar, CreditCard, CheckCircle, XCircle, Clock, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendanceFeesPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees'>('attendance');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'PRESENT' | 'ABSENT' | 'LATE' }>({});

  const [feeFormState, setFeeFormState] = useState<{
    [studentId: string]: {
      amount: number;
      status: 'PAID' | 'PENDING' | 'OVERDUE';
      dueDate: string;
      remarks: string;
    };
  }>({});

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

  useEffect(() => {
    loadData();
  }, []);

  const loadBatchRecords = async (batchId: string) => {
    if (!batchId) return;
    const attRes = await getBatchAttendanceAction(batchId);
    if (attRes.success && attRes.records) {
      setAttendanceRecords(attRes.records);
    }

    const feeRes = await getBatchFeeRecordsAction(batchId);
    if (feeRes.success && feeRes.records) {
      setFeeRecords(feeRes.records);
      const initialFeeState: any = {};
      feeRes.records.forEach((r: any) => {
        initialFeeState[r.studentId] = {
          amount: r.amount,
          status: r.status,
          dueDate: new Date(r.dueDate).toISOString().split('T')[0],
          remarks: r.remarks || '',
        };
      });
      setFeeFormState(initialFeeState);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      loadBatchRecords(selectedBatchId);
    }
  }, [selectedBatchId]);

  const batchStudents = students.filter((s) => s.batchId === selectedBatchId && s.role === 'STUDENT');

  const handleMarkAttendance = async (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
    const res = await markAttendanceAction({
      studentId,
      batchId: selectedBatchId,
      date: attendanceDate,
      status,
    });

    if (res.success) {
      toast.success(`Marked ${status} for student.`);
      loadBatchRecords(selectedBatchId);
    } else {
      toast.error(res.error || 'Failed to mark attendance.');
    }
  };

  const handleSaveFeeRecord = async (studentId: string) => {
    const state = feeFormState[studentId] || {
      amount: 150,
      status: 'PENDING',
      dueDate: new Date().toISOString().split('T')[0],
      remarks: '',
    };

    const res = await updateFeeRecordAction({
      studentId,
      batchId: selectedBatchId,
      amount: Number(state.amount),
      status: state.status,
      dueDate: state.dueDate,
      remarks: state.remarks,
    });

    if (res.success) {
      toast.success('Fee record updated successfully!');
      loadBatchRecords(selectedBatchId);
    } else {
      toast.error(res.error || 'Failed to update fee record.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <CreditCard className="w-7 h-7 text-indigo-500" />
            <span>Attendance & Fee Tracker</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">Manage batch presence records and student fee payments</p>
        </div>

        {/* Batch Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-theme-sub uppercase">Batch:</label>
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

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'attendance'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'fees'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fee Status Tracker</span>
        </button>
      </div>

      {/* ATTENDANCE PANEL */}
      {activeTab === 'attendance' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>Mark Student Attendance</span>
            </h2>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-theme-sub">Date:</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-mono"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-theme-sub animate-pulse">Loading batch roster...</div>
          ) : batchStudents.length === 0 ? (
            <p className="text-center py-6 text-sm text-theme-sub">No students assigned to this batch yet.</p>
          ) : (
            <div className="divide-y divide-theme">
              {batchStudents.map((student) => {
                const existingRec = attendanceRecords.find(
                  (r) => r.studentId === student.id && new Date(r.date).toISOString().split('T')[0] === attendanceDate
                );
                const currentStatus = attendanceState[student.id] || existingRec?.status || 'ABSENT';

                return (
                  <div key={student.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-theme-main text-sm">{student.fullName}</h3>
                      <p className="text-xs text-theme-sub">{student.email}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          currentStatus === 'PRESENT'
                            ? 'bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500'
                            : 'bg-theme-card-sub text-theme-sub hover:opacity-90 border border-theme'
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Present</span>
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student.id, 'LATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          currentStatus === 'LATE'
                            ? 'bg-amber-600/30 text-amber-600 dark:text-amber-300 border border-amber-500'
                            : 'bg-theme-card-sub text-theme-sub hover:opacity-90 border border-theme'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Late</span>
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          currentStatus === 'ABSENT'
                            ? 'bg-rose-600/30 text-rose-600 dark:text-rose-300 border border-rose-500'
                            : 'bg-theme-card-sub text-theme-sub hover:opacity-90 border border-theme'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Absent</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FEES PANEL */}
      {activeTab === 'fees' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            <span>Student Fee Records</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-theme-sub animate-pulse">Loading fee records...</div>
          ) : batchStudents.length === 0 ? (
            <p className="text-center py-6 text-sm text-theme-sub">No students in this batch.</p>
          ) : (
            <div className="space-y-4">
              {batchStudents.map((student) => {
                const state = feeFormState[student.id] || {
                  amount: 150,
                  status: 'PENDING',
                  dueDate: new Date().toISOString().split('T')[0],
                  remarks: '',
                };

                return (
                  <div key={student.id} className="p-4 bg-theme-card-sub border border-theme rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-theme-main text-sm">{student.fullName}</h3>
                        <p className="text-xs text-theme-sub">{student.email}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold w-fit ${
                          state.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                            : state.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {state.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Amount ($)</label>
                        <input
                          type="number"
                          value={state.amount}
                          onChange={(e) =>
                            setFeeFormState((prev) => ({
                              ...prev,
                              [student.id]: { ...state, amount: parseFloat(e.target.value) || 0 },
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-xs text-theme-main"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Payment Status</label>
                        <select
                          value={state.status}
                          onChange={(e) =>
                            setFeeFormState((prev) => ({
                              ...prev,
                              [student.id]: { ...state, status: e.target.value as any },
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-xs text-theme-main"
                        >
                          <option value="PAID">Paid</option>
                          <option value="PENDING">Pending</option>
                          <option value="OVERDUE">Overdue</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Due Date</label>
                        <input
                          type="date"
                          value={state.dueDate}
                          onChange={(e) =>
                            setFeeFormState((prev) => ({
                              ...prev,
                              [student.id]: { ...state, dueDate: e.target.value },
                            }))
                          }
                          className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-xs text-theme-main font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleSaveFeeRecord(student.id)}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Update Record</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
