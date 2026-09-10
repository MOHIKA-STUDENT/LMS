'use client';

import { useState, useEffect } from 'react';
import { getMaterialsAction } from '@/app/actions/lms-actions';
import { BookOpen, Download, FileText, File } from 'lucide-react';

export default function StudentNotesPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      const res = await getMaterialsAction();
      if (res.success && res.materials) {
        setMaterials(res.materials);
      }
      setLoading(false);
    };

    fetchNotes();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-indigo-500" />
          <span>Notes Vault & Study Guides</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Access and download lesson presentations, PDFs, and study guides for your batch</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading study notes...</div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-sm">
          <File className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Course Materials Found</h3>
          <p className="text-sm text-theme-sub mt-1">Your teacher has not uploaded any study guides for your batch yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((m) => {
            const fileType = (m.fileType || 'file').toLowerCase();
            let formattedUrl = m.fileUrl || '#';
            if (fileType && !formattedUrl.toLowerCase().endsWith(`.${fileType}`)) {
              formattedUrl = `${formattedUrl}.${fileType}`;
            }
            const isPdf = fileType === 'pdf' || formattedUrl.toLowerCase().endsWith('.pdf');
            const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(formattedUrl)}`;

            return (
              <div key={m.id} className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-600/20 text-indigo-500 rounded-xl border border-indigo-500/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-theme-card-sub text-indigo-600 dark:text-indigo-300 border border-theme rounded text-xs font-mono font-bold">
                        {fileType.toUpperCase()}
                      </span>
                      <h3 className="font-bold text-theme-main text-base mt-1">{m.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs text-theme-sub">{m.description || 'No additional details.'}</p>
                  <div className="text-xs text-theme-sub opacity-75">Size: {(m.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={formattedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open / Download Material</span>
                  </a>
                  {isPdf && (
                    <a
                      href={gDocsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-theme-main hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                    >
                      <span>Preview in Online Viewer</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
