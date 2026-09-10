'use client';

import { useState, useEffect } from 'react';
import {
  getBatchesAction,
  getMaterialsAction,
  uploadMaterialAction,
  deleteMaterialAction,
} from '@/app/actions/lms-actions';
import { processAndValidateFileUpload } from '@/lib/utils/asset-shield';
import { BookOpen, UploadCloud, FileText, Trash2, Download, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

export default function MaterialsPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // In-App Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const bRes = await getBatchesAction();
    const mRes = await getMaterialsAction();

    if (bRes.success && bRes.batches) {
      setBatches(bRes.batches);
      if (bRes.batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bRes.batches[0].id);
      }
    }
    if (mRes.success && mRes.materials) {
      setMaterials(mRes.materials);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [isGlobal, setIsGlobal] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }
    if (!isGlobal && !selectedBatchId) {
      toast.error('Please select a target batch or check All Batches.');
      return;
    }

    setUploading(true);

    try {
      const validation = await processAndValidateFileUpload(file);
      if (!validation.valid || !validation.processedFile) {
        toast.error(validation.error || 'File validation failed.');
        setUploading(false);
        return;
      }

      const fileToUpload = validation.processedFile;

      const formData = new FormData();
      formData.append('batchId', isGlobal ? '' : selectedBatchId);
      formData.append('isGlobal', isGlobal ? 'true' : 'false');
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', fileToUpload);

      const res = await uploadMaterialAction(formData);
      if (!res.success) throw new Error(res.error);

      toast.success('Course material uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setIsGlobal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    const res = await deleteMaterialAction(id);
    if (!res.success) {
      toast.error(res.error || 'Failed to delete material.');
    } else {
      toast.success('Material deleted.');
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-indigo-500" />
          <span>Lesson Material Uploads</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Upload PPT, PDF, and DOCX study guides filtered by target student batch (5MB max limit enforced)</p>
      </div>

      {/* Uploader Form */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-theme-main mb-4">Upload New Material</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Scope</label>
            <div className="flex items-center space-x-3 pt-1">
              <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">All Batches (Global)</span>
              </label>

              {!isGlobal && (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefrLevel})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Material Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Unit 3 Grammar & Syntax Guide"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="Brief description of the material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Upload File (.pdf, .ppt, .docx - Max 5MB)</label>
            <input
              type="file"
              required
              accept=".pdf,.ppt,.pptx,.docx,.doc,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <UploadCloud className="w-5 h-5" />
              <span>{uploading ? 'Compressing & Uploading...' : 'Upload Material'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main">Uploaded Course Materials</h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading materials...</div>
        ) : materials.length === 0 ? (
          <p className="text-sm text-theme-sub text-center py-6">No materials uploaded yet.</p>
        ) : (
          <div className="divide-y divide-theme">
            {materials.map((m) => {
              const batchName = batches.find((b) => b.id === m.batchId)?.name || (m.isGlobal ? 'All Batches (Global)' : 'Unknown Batch');
              const fileType = (m.fileType || 'file').toLowerCase();
              let fileUrl = m.fileUrl || '#';
              if (fileType === 'pdf' && fileUrl.endsWith('.pdf')) {
                fileUrl = `${fileUrl}.jpg`;
              }
              const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

              return (
                <div key={m.id} className="py-4 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/30 px-3 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-600/20 text-indigo-500 rounded-xl border border-indigo-500/20">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-theme-main text-sm">{m.title}</h4>
                      <p className="text-xs text-theme-sub mt-0.5">
                        Batch: <span className="text-indigo-600 dark:text-indigo-300 font-medium">{batchName}</span> • {(m.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewMaterial({ ...m, resolvedUrl: fileUrl, gDocsUrl })}
                      className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                      title="In-App Document Preview"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-colors"
                      title="Open / View File"
                    >
                      <Download className="w-4 h-4" />
                      <span>Open File</span>
                    </a>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Material"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-App Document Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <h3 className="font-bold text-theme-main text-lg">{previewMaterial.title}</h3>
                <p className="text-xs text-theme-sub">{previewMaterial.description || 'Document Preview'}</p>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden min-h-[500px] border border-theme flex items-center justify-center relative">
              {previewMaterial.resolvedUrl.endsWith('.jpg') || previewMaterial.resolvedUrl.endsWith('.png') ? (
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
