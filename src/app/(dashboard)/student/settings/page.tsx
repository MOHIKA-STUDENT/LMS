'use client';

import { UserProfile } from '@clerk/nextjs';

export default function StudentSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4 flex justify-center">
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
  );
}
