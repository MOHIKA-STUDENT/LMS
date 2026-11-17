'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getBatchesAction,
  getMaterialsAction,
  uploadMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
  reorderTopicsAction,
  reorderSubtopicsAction,
  reorderMaterialsAction,
} from '@/app/actions/lms-actions';
import { processAndValidateFileUpload } from '@/lib/utils/asset-shield';
import { formatCloudinaryFileUrl } from '@/lib/utils/url-helper';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Eye,
  Edit3,
  X,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function MaterialsPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isGlobal, setIsGlobal] = useState(false);

  // Form states
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [filterBatch, setFilterBatch] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [reordering, setReordering] = useState(false);

  // In-App Preview Modal State
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);

  // Edit Material Modal State
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [editTopic, setEditTopic] = useState('');
  const [editSubtopic, setEditSubtopic] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsGlobal, setEditIsGlobal] = useState(false);
  const [editBatchId, setEditBatchId] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

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

  // Collect unique existing topics for datalist suggestions
  const existingTopics = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.topic && m.topic.trim()) set.add(m.topic.trim());
    });
    return Array.from(set);
  }, [materials]);

  // Collect unique subtopics for currently typed topic
  const existingSubtopics = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (
        topic &&
        m.topic &&
        m.topic.trim().toLowerCase() === topic.trim().toLowerCase() &&
        m.subtopic &&
        m.subtopic.trim()
      ) {
        set.add(m.subtopic.trim());
      }
    });
    return Array.from(set);
  }, [materials, topic]);

  const toggleTopicExpand = (topicName: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicName]: !prev[topicName],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload.');
      return;
    }
    if (!isGlobal && !selectedBatchId) {
      toast.error('Please select a target batch or check All Batches.');
      return;
    }

    setUploading(true);

    try {
      const validatedFiles: File[] = [];
      for (const f of selectedFiles) {
        const validation = await processAndValidateFileUpload(f);
        if (!validation.valid || !validation.processedFile) {
          toast.error(`File "${f.name}": ${validation.error || 'Validation failed.'}`);
          setUploading(false);
          return;
        }
        validatedFiles.push(validation.processedFile);
      }

      const formData = new FormData();
      formData.append('batchId', isGlobal ? '' : selectedBatchId);
      formData.append('isGlobal', isGlobal ? 'true' : 'false');
      formData.append('topic', topic.trim() || 'General');
      formData.append('subtopic', subtopic.trim());
      formData.append('title', title.trim());
      formData.append('description', description.trim());

      for (const vf of validatedFiles) {
        formData.append('files', vf);
      }

      const res = await uploadMaterialAction(formData);
      if (!res.success) throw new Error(res.error);

      toast.success(
        `Successfully uploaded ${res.count || validatedFiles.length} file(s) under "${topic.trim() || 'General'}"!`
      );
      setTitle('');
      setDescription('');
      setSelectedFiles([]);
      const fileInput = document.getElementById('material-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleEditOpen = (m: any) => {
    setEditingMaterial(m);
    setEditTopic(m.topic || 'General');
    setEditSubtopic(m.subtopic || '');
    setEditTitle(m.title || '');
    setEditDescription(m.description || '');
    setEditIsGlobal(!!m.isGlobal);
    setEditBatchId(m.batchId || (batches[0]?.id || ''));
    setEditFile(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    if (!editTitle.trim()) {
      toast.error('Material title is required.');
      return;
    }

    setUpdating(true);

    try {
      let replacementFile: File | null = null;
      if (editFile) {
        const validation = await processAndValidateFileUpload(editFile);
        if (!validation.valid || !validation.processedFile) {
          toast.error(validation.error || 'Replacement file validation failed.');
          setUpdating(false);
          return;
        }
        replacementFile = validation.processedFile;
      }

      const formData = new FormData();
      formData.append('id', editingMaterial.id);
      formData.append('topic', editTopic.trim() || 'General');
      formData.append('subtopic', editSubtopic.trim());
      formData.append('title', editTitle.trim());
      formData.append('description', editDescription.trim());
      formData.append('isGlobal', editIsGlobal ? 'true' : 'false');
      formData.append('batchId', editIsGlobal ? '' : editBatchId);
      if (replacementFile) {
        formData.append('file', replacementFile);
      }

      const res = await updateMaterialAction(formData);
      if (!res.success) throw new Error(res.error || 'Failed to update material.');

      toast.success('Course material updated successfully!');
      setEditingMaterial(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update material');
    } finally {
      setUpdating(false);
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

  // Group materials by Topic -> Subtopic in sorted sequence
  const { groupedMaterials, topicOrderList } = useMemo(() => {
    let filtered = materials;

    // Filter by Batch
    if (filterBatch !== 'ALL') {
      if (filterBatch === 'GLOBAL') {
        filtered = filtered.filter((m) => m.isGlobal);
      } else {
        filtered = filtered.filter((m) => m.batchId === filterBatch || m.isGlobal);
      }
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.topic && m.topic.toLowerCase().includes(q)) ||
          (m.subtopic && m.subtopic.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q))
      );
    }

    const topicMap: Record<
      string,
      {
        topicOrder: number;
        subtopics: Record<string, { subtopicOrder: number; items: any[] }>;
        direct: any[];
        total: number;
      }
    > = {};

    filtered.forEach((m) => {
      const t = m.topic?.trim() || 'General';
      if (!topicMap[t]) {
        topicMap[t] = {
          topicOrder: m.topicOrder ?? 0,
          subtopics: {},
          direct: [],
          total: 0,
        };
      }
      topicMap[t].total += 1;

      if (m.subtopic && m.subtopic.trim()) {
        const sub = m.subtopic.trim();
        if (!topicMap[t].subtopics[sub]) {
          topicMap[t].subtopics[sub] = {
            subtopicOrder: m.subtopicOrder ?? 0,
            items: [],
          };
        }
        topicMap[t].subtopics[sub].items.push(m);
      } else {
        topicMap[t].direct.push(m);
      }
    });

    // Sort items inside each subtopic & direct items by order
    Object.values(topicMap).forEach((tData) => {
      Object.values(tData.subtopics).forEach((subData) => {
        subData.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });
      tData.direct.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });

    // Sort topics strictly by topicOrder
    const orderedTopics = Object.keys(topicMap).sort((a, b) => {
      return (topicMap[a].topicOrder ?? 0) - (topicMap[b].topicOrder ?? 0);
    });

    return { groupedMaterials: topicMap, topicOrderList: orderedTopics };
  }, [materials, filterBatch, searchQuery]);

  // -------------------------------------------------------------
  // REORDERING HANDLERS
  // -------------------------------------------------------------

  // 1. Reorder Main Topics
  const handleMoveTopic = async (topicName: string, direction: 'up' | 'down') => {
    const idx = topicOrderList.indexOf(topicName);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === topicOrderList.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...topicOrderList];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    // Optimistically update local materials
    setMaterials((prev) => {
      return prev.map((m) => {
        const t = m.topic?.trim() || 'General';
        const newPos = newOrder.indexOf(t);
        if (newPos >= 0) {
          return { ...m, topicOrder: newPos };
        }
        return m;
      });
    });

    try {
      setReordering(true);
      const res = await reorderTopicsAction(newOrder);
      if (!res.success) throw new Error(res.error);
      toast.success(`Moved "${topicName}" ${direction}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save topic order');
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  // 2. Reorder Subtopics within a Main Topic
  const handleMoveSubtopic = async (topicName: string, subtopicName: string, direction: 'up' | 'down') => {
    const topicData = groupedMaterials[topicName];
    if (!topicData) return;

    // Subtopics sorted by subtopicOrder
    const subtopics = Object.keys(topicData.subtopics).sort((a, b) => {
      return (topicData.subtopics[a].subtopicOrder ?? 0) - (topicData.subtopics[b].subtopicOrder ?? 0);
    });
    const idx = subtopics.indexOf(subtopicName);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === subtopics.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newOrder = [...subtopics];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    // Optimistically update local materials
    setMaterials((prev) => {
      return prev.map((m) => {
        const t = m.topic?.trim() || 'General';
        const sub = m.subtopic?.trim();
        if (t === topicName && sub) {
          const newPos = newOrder.indexOf(sub);
          if (newPos >= 0) {
            return { ...m, subtopicOrder: newPos };
          }
        }
        return m;
      });
    });

    try {
      setReordering(true);
      const res = await reorderSubtopicsAction(topicName, newOrder);
      if (!res.success) throw new Error(res.error);
      toast.success(`Moved subtopic "${subtopicName}" ${direction}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subtopic order');
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  // 3. Reorder Individual Note / Material inside a Subtopic or Direct Topic
  const handleMoveMaterial = async (
    topicName: string,
    subtopicName: string | null,
    materialId: string,
    direction: 'up' | 'down'
  ) => {
    const topicData = groupedMaterials[topicName];
    if (!topicData) return;

    let itemsList: any[] = [];
    if (subtopicName) {
      itemsList = [...(topicData.subtopics[subtopicName]?.items || [])];
    } else {
      itemsList = [...(topicData.direct || [])];
    }
    itemsList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const idx = itemsList.findIndex((m) => m.id === materialId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === itemsList.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newItems = [...itemsList];
    const temp = newItems[idx];
    newItems[idx] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    const newIds = newItems.map((m) => m.id);

    // Optimistically update
    setMaterials((prev) => {
      return prev.map((m) => {
        const pos = newIds.indexOf(m.id);
        if (pos >= 0) {
          return { ...m, order: pos };
        }
        return m;
      });
    });

    try {
      setReordering(true);
      const res = await reorderMaterialsAction(newIds);
      if (!res.success) throw new Error(res.error);
      toast.success(`Note reordered ${direction}!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note order');
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <BookOpen className="w-7 h-7 text-indigo-500" />
          <span>Lesson Materials & Topic Vault</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">
          Organize study guides by Main Topic (e.g., Unit / Module) and Subtopics. Reorder Main Topics, Subtopics, and individual notes using the up/down controls.
        </p>
      </div>

      {/* Uploader Form */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-theme pb-3">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" />
            <span>Upload Materials (Topic Hierarchy)</span>
          </h2>
          <span className="text-xs px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold rounded-full border border-indigo-500/20">
            Multi-File Upload Supported
          </span>
        </div>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Scope */}
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Batch Scope</label>
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

          {/* Main Topic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-theme-sub uppercase">
                Main Topic / Module <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-theme-sub">e.g. Unit 1: Foundations</span>
            </div>
            <input
              type="text"
              required
              list="existing-topics-list"
              placeholder="e.g. Unit 1: English Grammar Basics"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
            <datalist id="existing-topics-list">
              {existingTopics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Subtopic */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-theme-sub uppercase">
                Subtopic / Section (Optional)
              </label>
              <span className="text-[11px] text-theme-sub">e.g. Present Perfect Tense</span>
            </div>
            <input
              type="text"
              list="existing-subtopics-list"
              placeholder="e.g. Irregular Verbs & Practice"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
            <datalist id="existing-subtopics-list">
              {existingSubtopics.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          </div>

          {/* Material Title */}
          <div>
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">
              Title / Document Label (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Complete Lecture Slides (Defaults to file name)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description / Notes (Optional)</label>
            <input
              type="text"
              placeholder="Brief instructions or summary of what these files contain..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Multiple File Upload input */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-theme-sub uppercase">
                Upload File(s) (.pdf, .ppt, .pptx, .docx, images - Max 5MB each) <span className="text-rose-500">*</span>
              </label>
              {selectedFiles.length > 0 && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedFiles.length} file(s) selected (Total: {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB)
                </span>
              )}
            </div>
            <input
              id="material-file-input"
              type="file"
              multiple
              required
              accept=".pdf,.ppt,.pptx,.docx,.doc,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
            />
            {selectedFiles.length > 1 && (
              <p className="text-xs text-theme-sub mt-1">
                Tip: All {selectedFiles.length} selected files will be uploaded together under{' '}
                <strong className="text-indigo-600 dark:text-indigo-300">
                  {topic.trim() || 'General'}{subtopic.trim() ? ` > ${subtopic.trim()}` : ''}
                </strong>
                .
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <UploadCloud className="w-5 h-5" />
              <span>{uploading ? 'Processing & Uploading...' : `Upload to Topic (${selectedFiles.length || 1} File${selectedFiles.length > 1 ? 's' : ''})`}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Materials Explorer Header with Filter & Search */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              <span>Hierarchical Notes Explorer</span>
            </h2>
            <p className="text-xs text-theme-sub mt-0.5 flex items-center space-x-1.5">
              <span>Use</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-theme-card-sub border border-theme text-[10px] font-mono">
                <ArrowUp className="w-3 h-3 inline mr-0.5" />
                <ArrowDown className="w-3 h-3 inline" />
              </span>
              <span>arrows to reorder Main Topics, Subtopics, and individual files.</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-sub" />
              <input
                type="text"
                placeholder="Search topics, files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Batch Filter */}
            <div className="flex items-center space-x-1">
              <Filter className="w-4 h-4 text-theme-sub" />
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs"
              >
                <option value="ALL">All Batches & Global</option>
                <option value="GLOBAL">Global Materials Only</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.cefrLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Hierarchical Topics Accordion List */}
        {loading ? (
          <div className="py-12 text-center text-theme-sub animate-pulse">Loading study topics and documents...</div>
        ) : topicOrderList.length === 0 ? (
          <div className="text-center py-10 text-theme-sub">
            <Folder className="w-10 h-10 mx-auto mb-2 opacity-50 text-indigo-400" />
            <p className="text-sm font-semibold">No materials found.</p>
            <p className="text-xs mt-1">Upload a PDF or document above to create your first Topic & Subtopic folder!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topicOrderList.map((topicName, topicIdx) => {
              const data = groupedMaterials[topicName];
              if (!data) return null;
              const isExpanded = !!expandedTopics[topicName];
              const subtopicKeys = Object.keys(data.subtopics).sort((a, b) => {
                return (data.subtopics[a]?.subtopicOrder ?? 0) - (data.subtopics[b]?.subtopicOrder ?? 0);
              });

              return (
                <div
                  key={topicName}
                  className="border border-theme rounded-2xl bg-theme-card-sub overflow-hidden shadow-sm transition-all"
                >
                  {/* Topic Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                    <div
                      onClick={() => toggleTopicExpand(topicName)}
                      className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="p-2 bg-indigo-600/10 text-indigo-500 rounded-xl border border-indigo-500/20 shrink-0">
                        {isExpanded ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-theme-main text-base flex items-center space-x-2 truncate">
                          <span className="truncate">{topicName}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold rounded-full shrink-0">
                            {data.total} file{data.total > 1 ? 's' : ''}
                          </span>
                        </h3>
                        <p className="text-xs text-theme-sub">
                          {subtopicKeys.length > 0
                            ? `${subtopicKeys.length} Subtopic${subtopicKeys.length > 1 ? 's' : ''}`
                            : 'Direct study guides'}
                        </p>
                      </div>
                    </div>

                    {/* Topic Reorder Controls & Collapse */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[11px] text-theme-sub font-semibold uppercase mr-1 hidden sm:inline">
                        Topic Order:
                      </span>
                      <button
                        type="button"
                        disabled={reordering || topicIdx === 0}
                        onClick={() => handleMoveTopic(topicName, 'up')}
                        className="p-1.5 text-theme-sub hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Topic Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={reordering || topicIdx === topicOrderList.length - 1}
                        onClick={() => handleMoveTopic(topicName, 'down')}
                        className="p-1.5 text-theme-sub hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Move Topic Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-theme mx-1" />

                      <button
                        type="button"
                        onClick={() => toggleTopicExpand(topicName)}
                        className="p-1.5 text-theme-sub hover:text-theme-main rounded-lg"
                        title={isExpanded ? 'Collapse Topic' : 'Expand Topic'}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Topic Content Body (Subtopics & Files) - Hidden by default until toggled */}
                  {isExpanded && (
                    <div className="p-4 pt-1 space-y-4 border-t border-theme bg-theme-card">
                      {/* Subtopic Sections */}
                      {subtopicKeys.map((subName, subIdx) => {
                        const items = data.subtopics[subName].items;
                        return (
                          <div
                            key={subName}
                            className="bg-theme-card-sub border border-theme rounded-xl p-3.5 space-y-3"
                          >
                            {/* Subtopic Header with Reorder Arrows */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme/60 pb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center space-x-1.5">
                                <Folder className="w-3.5 h-3.5" />
                                <span>Subtopic: {subName}</span>
                                <span className="text-[10px] text-theme-sub font-normal">({items.length} files)</span>
                              </h4>

                              <div className="flex items-center space-x-1">
                                <span className="text-[10px] text-theme-sub font-semibold uppercase mr-1 hidden xs:inline sm:inline">
                                  Subtopic Order:
                                </span>
                                <button
                                  type="button"
                                  disabled={reordering || subIdx === 0}
                                  onClick={() => handleMoveSubtopic(topicName, subName, 'up')}
                                  className="p-1.5 text-theme-sub hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Subtopic Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={reordering || subIdx === subtopicKeys.length - 1}
                                  onClick={() => handleMoveSubtopic(topicName, subName, 'down')}
                                  className="p-1.5 text-theme-sub hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                  title="Move Subtopic Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="divide-y divide-theme">
                              {items.map((m, mIdx) =>
                                renderMaterialRow(m, topicName, subName, mIdx, items.length)
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Direct items without subtopic */}
                      {data.direct.length > 0 && (
                        <div className="space-y-2">
                          {subtopicKeys.length > 0 && (
                            <h4 className="text-xs font-semibold uppercase text-theme-sub px-1">
                              General Documents (No Subtopic)
                            </h4>
                          )}
                          <div className="divide-y divide-theme bg-theme-card-sub border border-theme rounded-xl p-3">
                            {data.direct.map((m, mIdx) =>
                              renderMaterialRow(m, topicName, null, mIdx, data.direct.length)
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-5 sm:p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-theme-main text-lg flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                <span>Edit Course Material</span>
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Target Scope</label>
                <div className="flex items-center space-x-3 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsGlobal}
                      onChange={(e) => setEditIsGlobal(e.target.checked)}
                      className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">All Batches (Global)</span>
                  </label>

                  {!editIsGlobal && (
                    <select
                      value={editBatchId}
                      onChange={(e) => setEditBatchId(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Main Topic</label>
                  <input
                    type="text"
                    required
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Subtopic (Optional)</label>
                  <input
                    type="text"
                    value={editSubtopic}
                    onChange={(e) => setEditSubtopic(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Material Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Replace File (Optional - Max 5MB)</label>
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,.docx,.doc,.png,.jpg,.jpeg"
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 bg-theme-input border border-theme rounded-xl text-theme-main text-sm file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
                />
                <p className="text-[11px] text-theme-sub mt-1">Leave empty to keep existing file: {editingMaterial.fileType?.toUpperCase()}</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 bg-theme-card-sub border border-theme rounded-xl text-xs font-semibold text-theme-main"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1 transition-all disabled:opacity-50"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{updating ? 'Saving...' : 'Save Material Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Document Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded font-semibold">
                    {previewMaterial.topic} {previewMaterial.subtopic ? `> ${previewMaterial.subtopic}` : ''}
                  </span>
                </div>
                <h3 className="font-bold text-theme-main text-base sm:text-lg truncate mt-1">{previewMaterial.title}</h3>
                <p className="text-xs text-theme-sub truncate">{previewMaterial.description || 'Document Preview'}</p>
              </div>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden min-h-[250px] sm:min-h-[500px] border border-theme flex items-center justify-center relative">
              {previewMaterial.isImage || previewMaterial.isPdf || previewMaterial.resolvedUrl.includes('/f_jpg/') ? (
                <img
                  src={previewMaterial.resolvedUrl}
                  alt={previewMaterial.title}
                  className="max-h-[60vh] sm:max-h-[600px] w-full object-contain mx-auto rounded-lg"
                />
              ) : (
                <iframe
                  src={previewMaterial.gDocsUrl}
                  className="w-full h-[350px] sm:h-[600px] border-0"
                  title={previewMaterial.title}
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-theme-sub">Format: {previewMaterial.fileType?.toUpperCase()}</span>
              <a
                href={previewMaterial.resolvedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 shadow transition-all whitespace-nowrap"
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

  // Helper renderer for a single material item row with Up/Down note reordering
  function renderMaterialRow(
    m: any,
    topicName: string,
    subtopicName: string | null,
    itemIdx: number,
    totalItems: number
  ) {
    const batchName = batches.find((b) => b.id === m.batchId)?.name || (m.isGlobal ? 'All Batches (Global)' : 'General');
    const fileType = (m.fileType || 'file').toLowerCase();
    const fileUrl = formatCloudinaryFileUrl(m.fileUrl);
    const isPdf = fileType === 'pdf' || fileUrl.toLowerCase().includes('.pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
    const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    return (
      <div
        key={m.id}
        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Note Reorder Arrows */}
          <div className="flex flex-col items-center justify-center space-y-1 shrink-0 bg-theme-input p-1 rounded-lg border border-theme">
            <button
              type="button"
              disabled={reordering || itemIdx === 0}
              onClick={() => handleMoveMaterial(topicName, subtopicName, m.id, 'up')}
              className="p-1 text-theme-sub hover:text-indigo-600 disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-theme-card-sub transition-colors"
              title="Move Note Up"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={reordering || itemIdx === totalItems - 1}
              onClick={() => handleMoveMaterial(topicName, subtopicName, m.id, 'down')}
              className="p-1 text-theme-sub hover:text-indigo-600 disabled:opacity-20 disabled:pointer-events-none rounded hover:bg-theme-card-sub transition-colors"
              title="Move Note Down"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-2.5 bg-indigo-600/20 text-indigo-500 rounded-xl border border-indigo-500/20 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-theme-main text-sm truncate">{m.title}</h4>
            <div className="flex flex-wrap items-center gap-2 text-xs text-theme-sub mt-0.5">
              <span className="px-1.5 py-0.5 bg-theme-input text-indigo-600 dark:text-indigo-300 font-mono font-bold rounded text-[10px]">
                {fileType.toUpperCase()}
              </span>
              <span>•</span>
              <span>{(m.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-medium">{batchName}</span>
              {m.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[200px] text-theme-sub italic">{m.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-2 sm:pt-0 shrink-0">
          <button
            onClick={() => setPreviewMaterial({ ...m, resolvedUrl: fileUrl, gDocsUrl, isPdf, isImage })}
            className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all whitespace-nowrap"
            title="In-App Document Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => handleEditOpen(m)}
            className="px-3 py-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all whitespace-nowrap"
            title="Edit Material Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow transition-colors whitespace-nowrap"
            title="Open / View File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Open</span>
          </a>
          <button
            onClick={() => handleDelete(m.id)}
            className="p-1.5 text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Delete Material"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
}
