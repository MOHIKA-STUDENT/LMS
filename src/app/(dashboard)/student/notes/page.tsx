'use client';

import { useState, useEffect, useMemo } from 'react';
import { getMaterialsAction } from '@/app/actions/lms-actions';
import { formatCloudinaryFileUrl } from '@/lib/utils/url-helper';
import {
  BookOpen,
  Download,
  FileText,
  File,
  Eye,
  X,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Search,
  Layers,
} from 'lucide-react';

export default function StudentNotesPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});

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

  const toggleTopicCollapse = (topicName: string) => {
    setCollapsedTopics((prev) => ({
      ...prev,
      [topicName]: !prev[topicName],
    }));
  };

  // Group materials by Topic -> Subtopic in sorted sequence
  const { groupedMaterials, orderedTopics } = useMemo(() => {
    let filtered = materials;

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

    const topics = Object.keys(topicMap).sort((a, b) => {
      return (topicMap[a].topicOrder ?? 0) - (topicMap[b].topicOrder ?? 0);
    });

    return { groupedMaterials: topicMap, orderedTopics: topics };
  }, [materials, searchQuery]);

  const totalTopicsCount = orderedTopics.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-indigo-500" />
            <span>Notes Vault & Study Guides</span>
          </h1>
          <p className="text-sm text-theme-sub mt-1">
            Browse structured lesson presentations, PDFs, and study guides arranged by Topic and Subtopic.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-sub" />
          <input
            type="text"
            placeholder="Search topics, subtopics, or guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading study notes vault...</div>
      ) : materials.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-sm">
          <File className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Course Materials Found</h3>
          <p className="text-sm text-theme-sub mt-1">Your teacher has not uploaded any study guides for your batch yet.</p>
        </div>
      ) : totalTopicsCount === 0 ? (
        <div className="p-10 text-center bg-theme-card border border-theme rounded-2xl shadow-sm text-theme-sub">
          <p className="text-sm">No notes matching &ldquo;{searchQuery}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orderedTopics.map((topicName) => {
            const data = groupedMaterials[topicName];
            if (!data) return null;
            const isCollapsed = !!collapsedTopics[topicName];
            const subtopicKeys = Object.keys(data.subtopics).sort((a, b) => {
              return (data.subtopics[a]?.subtopicOrder ?? 0) - (data.subtopics[b]?.subtopicOrder ?? 0);
            });

            return (
              <div
                key={topicName}
                className="border border-theme rounded-2xl bg-theme-card shadow-lg overflow-hidden transition-all"
              >
                {/* Topic Accordion Header */}
                <div
                  onClick={() => toggleTopicCollapse(topicName)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors border-b border-theme/50"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="p-2.5 bg-indigo-600/10 text-indigo-500 rounded-xl border border-indigo-500/20">
                      {isCollapsed ? <Folder className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="font-bold text-theme-main text-lg flex items-center space-x-2.5">
                        <span>{topicName}</span>
                        <span className="text-xs px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold rounded-full border border-indigo-500/20">
                          {data.total} item{data.total > 1 ? 's' : ''}
                        </span>
                      </h2>
                      <p className="text-xs text-theme-sub mt-0.5">
                        {subtopicKeys.length > 0
                          ? `Contains ${subtopicKeys.length} subtopic section${subtopicKeys.length > 1 ? 's' : ''}`
                          : 'General lesson materials'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-2 text-theme-sub hover:text-theme-main rounded-xl bg-theme-card-sub border border-theme"
                    >
                      {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Topic Body: Subtopics & Document Cards */}
                {!isCollapsed && (
                  <div className="p-5 space-y-6 bg-theme-card-sub/40">
                    {/* Render Each Subtopic Group */}
                    {subtopicKeys.map((subName) => {
                      const items = data.subtopics[subName]?.items || [];
                      return (
                        <div key={subName} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            <h3 className="text-sm font-bold text-theme-main uppercase tracking-wider">
                              Subtopic: {subName}
                            </h3>
                            <span className="text-xs text-theme-sub">({items.length} guide{items.length > 1 ? 's' : ''})</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((m) => renderMaterialCard(m))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Direct Items Without Subtopic */}
                    {data.direct.length > 0 && (
                      <div className="space-y-3">
                        {subtopicKeys.length > 0 && (
                          <h3 className="text-sm font-bold text-theme-sub uppercase tracking-wider">
                            General Topic Documents
                          </h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {data.direct.map((m) => renderMaterialCard(m))}
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

      {/* In-App Document Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded font-semibold">
                    {previewMaterial.topic} {previewMaterial.subtopic ? `> ${previewMaterial.subtopic}` : ''}
                  </span>
                </div>
                <h3 className="font-bold text-theme-main text-base sm:text-lg truncate">{previewMaterial.title}</h3>
                <p className="text-xs text-theme-sub truncate">{previewMaterial.description || 'Study Material Preview'}</p>
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

  // Helper renderer for student material cards
  function renderMaterialCard(m: any) {
    const fileType = (m.fileType || 'file').toLowerCase();
    const fileUrl = formatCloudinaryFileUrl(m.fileUrl);
    const isPdf = fileType === 'pdf' || fileUrl.toLowerCase().includes('.pdf');
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
    const gDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

    return (
      <div
        key={m.id}
        className="bg-theme-card border border-theme rounded-2xl p-5 shadow-md space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition-all"
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-600/20 text-indigo-500 rounded-xl border border-indigo-500/20 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="px-2 py-0.5 bg-theme-card-sub text-indigo-600 dark:text-indigo-300 border border-theme rounded text-[11px] font-mono font-bold">
                {fileType.toUpperCase()}
              </span>
              <h4 className="font-bold text-theme-main text-sm mt-1 truncate" title={m.title}>
                {m.title}
              </h4>
            </div>
          </div>

          <p className="text-xs text-theme-sub line-clamp-2">{m.description || 'No additional details provided.'}</p>
          <div className="text-[11px] text-theme-sub opacity-75">
            Size: {(m.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1 border-t border-theme/60">
          <button
            onClick={() => setPreviewMaterial({ ...m, resolvedUrl: fileUrl, gDocsUrl, isImage, isPdf })}
            className="w-full py-2 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all whitespace-nowrap"
          >
            <Eye className="w-4 h-4" />
            <span>In-App Preview</span>
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Open / Download</span>
          </a>
        </div>
      </div>
    );
  }
}
