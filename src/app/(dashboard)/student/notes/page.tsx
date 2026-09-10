'use client';

import { useState, useEffect } from 'react';
import { getMaterialsAction } from '@/app/actions/lms-actions';
import { formatCloudinaryFileUrl } from '@/lib/utils/url-helper';
import { BookOpen, Download, FileText, File, Eye, X } from 'lucide-react';

export default function StudentNotesPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // In-App Preview Modal State
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);

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
            const fileUrl = formatCloudinaryFileUrl(m.fileUrl);
            const isPdf = fileType === 'pdf' || fileUrl.toLowerCase().endsWith('.pdf');
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
            const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

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
                  <button
                    onClick={() => setPreviewMaterial({ ...m, resolvedUrl: fileUrl, gDocsUrl, isImage, isPdf })}
                    className="w-full py-2 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>In-App Document Preview</span>
                  </button>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Open / Download Material</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Document Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-theme-main text-lg">{previewMaterial.title}</h3>
                <p className="text-xs text-theme-sub">{previewMaterial.description || 'Study Material Preview'}</p>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden min-h-[500px] border border-theme flex items-center justify-center relative">
              {previewMaterial.isImage ? (
                <img
                  src={previewMaterial.resolvedUrl}
                  alt={previewMaterial.title}
                  className="max-h-[600px] w-full object-contain mx-auto"
                />
              ) : (
                <iframe
                  src={previewMaterial.gDocsUrl}
                  className="w-full h-[600px] border-0"
                  title={previewMaterial.title}
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-theme-sub">Format: {previewMaterial.fileType.toUpperCase()}</span>
              <a
                href={previewMaterial.resolvedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Open Direct Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
