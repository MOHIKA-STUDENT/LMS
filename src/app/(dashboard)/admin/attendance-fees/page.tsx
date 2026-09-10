'use client';

import { useState, useEffect } from 'react';
import {
  getBatchesAction,
  getRosterAction,
  markAttendanceAction,
  getBatchAttendanceAction,
  updateFeeRecordAction,
  getBatchFeeRecordsAction,
} from '@/app/actions/lms-actions';
import {
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Eye,
  X,
  TrendingUp,
  UserCheck,
  FileText,
} from 'lucide-react';
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

  // Student Report Modal State
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any | null>(null);

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

  // Helper calculation for student history report modal
  const getStudentHistoryStats = (studentId: string) => {
    const atts = attendanceRecords.filter((r) => r.studentId === studentId);
    const totalDays = atts.length;
    const presentCount = atts.filter((r) => r.status === 'PRESENT').length;
    const lateCount = atts.filter((r) => r.status === 'LATE').length;
    const absentCount = atts.filter((r) => r.status === 'ABSENT').length;
    const presentPct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
    const currentFeeState = feeFormState[studentId] || {
      amount: 0,
      status: 'PENDING',
      dueDate: 'N/A',
      remarks: '',
    };

    return {
      atts,
      totalDays,
      presentCount,
      lateCount,
      absentCount,
      presentPct,
      currentFeeState,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
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

                      <button
                        onClick={() => setSelectedStudentForReport(student)}
                        className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ml-2"
                        title="View complete date-by-date attendance & fee history report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View History Report</span>
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

                      <div className="flex items-center space-x-3">
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

                        <button
                          onClick={() => setSelectedStudentForReport(student)}
                          className="px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View History Report</span>
                        </button>
                      </div>
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

      {/* STUDENT HISTORY REPORT MODAL */}
      {selectedStudentForReport && (() => {
        const stats = getStudentHistoryStats(selectedStudentForReport.id);
        const batchName = batches.find((b) => b.id === selectedBatchId)?.name || 'Unknown Batch';

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-theme-card border border-theme rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-theme flex items-center justify-between bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    {selectedStudentForReport.fullName?.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-theme-main">{selectedStudentForReport.fullName}</h2>
                    <p className="text-xs text-theme-sub">{selectedStudentForReport.email} • {batchName}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentForReport(null)}
                  className="p-2 rounded-xl text-theme-sub hover:text-theme-main hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-theme-card-sub border border-theme rounded-xl p-3.5 text-center">
                    <p className="text-[10px] uppercase font-bold text-theme-sub">Total Recorded</p>
                    <p className="text-xl font-black text-theme-main mt-1">{stats.totalDays} Days</p>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Present</p>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {stats.presentCount} ({stats.presentPct}%)
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-center">
                    <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Late</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.lateCount}</p>
                  </div>

                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-center">
                    <p className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Absent</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.absentCount}</p>
                  </div>
                </div>

                {/* Attendance Rate Progress Bar */}
                <div className="bg-theme-card-sub border border-theme rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-theme-main flex items-center space-x-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <span>Overall Attendance Score</span>
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{stats.presentPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
                    <div
                      style={{ width: `${stats.presentPct}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Current Fee Record Summary */}
                <div className="bg-theme-card-sub border border-theme rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    <span>Tuition Fee Status</span>
                  </h3>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-theme-sub">Tuition Amount: </span>
                      <span className="font-bold text-theme-main font-mono">${stats.currentFeeState.amount}</span>
                    </div>
                    <div>
                      <span className="text-theme-sub">Due Date: </span>
                      <span className="font-mono text-theme-main">{stats.currentFeeState.dueDate}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        stats.currentFeeState.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                          : stats.currentFeeState.status === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {stats.currentFeeState.status}
                    </span>
                  </div>
                </div>

                {/* Date-by-Date Attendance Log */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-theme-main uppercase tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>Date-by-Date Attendance Records</span>
                  </h3>

                  {stats.atts.length === 0 ? (
                    <p className="text-xs text-theme-sub italic py-4 text-center">No attendance logged for this student yet.</p>
                  ) : (
                    <div className="divide-y divide-theme border border-theme rounded-2xl overflow-hidden">
                      {stats.atts.map((record) => {
                        const dateFormatted = new Date(record.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });

                        return (
                          <div key={record.id} className="p-3.5 flex items-center justify-between bg-theme-card hover:bg-theme-card-sub transition-colors">
                            <span className="text-xs font-mono font-medium text-theme-main">{dateFormatted}</span>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 ${
                                record.status === 'PRESENT'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                                  : record.status === 'LATE'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {record.status === 'PRESENT' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                              {record.status === 'LATE' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                              {record.status === 'ABSENT' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                              <span>{record.status}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-theme bg-theme-card-sub flex justify-end">
                <button
                  onClick={() => setSelectedStudentForReport(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
