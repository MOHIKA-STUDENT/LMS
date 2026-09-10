'use client';

import { useState, useEffect } from 'react';
import { UserProfile } from '@clerk/nextjs';
import { getStudentProfileAction, updateProfileNameAction } from '@/app/actions/lms-actions';
import { User, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentSettingsPage() {
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudentProfileAction().then((res) => {
      if (res.success && res.profile) {
        setFullName(res.profile.fullName || '');
      }
    });
  }, []);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    const res = await updateProfileNameAction(fullName);
    if (res.success) {
      toast.success('Display name updated successfully!');
    } else {
      toast.error(res.error || 'Failed to update name.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Display Name Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <User className="w-5 h-5 text-indigo-400" />
          <span>Edit Academy Display Name</span>
        </h2>
        <p className="text-xs text-slate-400">Change how your name appears on class rosters, leaderboards, and homework reports</p>

        <form onSubmit={handleSaveName} className="flex items-center space-x-3 pt-2">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name..."
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Name'}</span>
          </button>
        </form>
      </div>

      <div className="flex justify-center">
        <UserProfile
          appearance={{
            elements: {
              card: 'bg-slate-900 border border-slate-800 shadow-2xl text-white',
              navbar: 'border-r border-slate-800 bg-slate-950/50',
              navbarButton: 'text-slate-300 hover:text-white',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-slate-400',
              profileSectionTitleText: 'text-slate-200 font-semibold',
              userPreviewMainIdentifier: 'text-white font-bold',
              userPreviewSecondaryIdentifier: 'text-slate-400',
              formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
            },
          }}
        />
      </div>
    </div>
  );
}
