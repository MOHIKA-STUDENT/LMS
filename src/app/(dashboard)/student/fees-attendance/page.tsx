'use client';

import { useState, useEffect } from 'react';
import { getStudentAttendanceAction, getStudentFeeRecordsAction } from '@/app/actions/lms-actions';
import { Calendar, CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function StudentFeesAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const attRes = await getStudentAttendanceAction();
    if (attRes.success && attRes.records) {
      setAttendance(attRes.records);
    }
    const feeRes = await getStudentFeeRecordsAction();
    if (feeRes.success && feeRes.records) {
      setFees(feeRes.records);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalClasses = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <CreditCard className="w-7 h-7 text-indigo-400" />
          <span>My Fees & Attendance Status</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review your academy presence history and fee payment details</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Attendance Rate</p>
            <h2 className="text-3xl font-black text-white mt-1">{attendancePercentage}%</h2>
            <p className="text-xs text-slate-500 mt-1">{presentCount} present out of {totalClasses} classes</p>
          </div>
          <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Calendar className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Fee Status Dues</p>
            <h2 className="text-3xl font-black text-white mt-1">
              {fees.some((f) => f.status === 'PENDING' || f.status === 'OVERDUE') ? 'Dues Pending' : 'All Clear'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{fees.length} fee records logged</p>
          </div>
          <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <CreditCard className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <span>Attendance Log History</span>
        </h2>

        {loading ? (
          <div className="py-6 text-center text-slate-400 animate-pulse">Loading attendance history...</div>
        ) : attendance.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500">No attendance records marked yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {attendance.map((record) => (
              <div key={record.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white font-mono">{new Date(record.date).toLocaleDateString()}</span>
                  <span className="text-slate-400 ml-2">({record.batch?.name || 'Batch'})</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center space-x-1 ${
                      record.status === 'PRESENT'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : record.status === 'LATE'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {record.status === 'PRESENT' && <CheckCircle className="w-3 h-3" />}
                    {record.status === 'LATE' && <Clock className="w-3 h-3" />}
                    {record.status === 'ABSENT' && <XCircle className="w-3 h-3" />}
                    <span>{record.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          <span>Fee Records</span>
        </h2>

        {loading ? (
          <div className="py-6 text-center text-slate-400 animate-pulse">Loading fee records...</div>
        ) : fees.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500">No fee records issued yet.</p>
        ) : (
          <div className="divide-y divide-slate-800">
            {fees.map((fee) => (
              <div key={fee.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">${fee.amount.toFixed(2)} Tuition Fee</h4>
                  <p className="text-slate-400">Due Date: {new Date(fee.dueDate).toLocaleDateString()}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold w-fit ${
                    fee.status === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : fee.status === 'OVERDUE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {fee.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
