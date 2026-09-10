'use client';

import { useState, useEffect } from 'react';
import { generateQuizAction, generateQuizFromPPTAction, parseRawQuizTextAction } from '@/app/actions/ai-actions';
import {
  getBatchesAction,
  getQuizzesAction,
  createManualQuizAction,
  updateQuizAction,
  deleteQuizAction,
  getTeacherQuizAnalyticsAction,
} from '@/app/actions/lms-actions';
import { CEFRLevel } from '@prisma/client';
import { Sparkles, Bot, CheckCircle2, Plus, Eye, BookOpen, Send, Edit3, Globe, Trash2, FileCode, Presentation, UploadCloud, X, Award, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizGenPage() {
  const [activeTab, setActiveTab] = useState<'chat_ai' | 'ppt_slides' | 'google_forms' | 'manual' | 'analytics'>('chat_ai');
  const [batches, setBatches] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analyticsSubmissions, setAnalyticsSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat AI Assistant State
  const [userPrompt, setUserPrompt] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [generating, setGenerating] = useState(false);

  // PPT / Slide Content State
  const [pptText, setPptText] = useState('');
  const [generatingPPT, setGeneratingPPT] = useState(false);

  const handlePPTFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const clean = text.replace(/[\x00-\x09\x0B-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
        setPptText(clean.slice(0, 4000));
        toast.success(`Loaded "${file.name}" into PPT builder! Click Generate below.`);
      }
    };
    reader.readAsText(file);
  };

  // Google Forms / Raw Text State
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);

  // Interactive Quiz Draft Preview & Editor
  const [draftQuiz, setDraftQuiz] = useState<{
    title: string;
    topic: string;
    cefrLevel: CEFRLevel;
    questions: any[];
  } | null>(null);

  // Publishing Controls
  const [isGlobal, setIsGlobal] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);

  // Modal States
  const [previewPublishedQuiz, setPreviewPublishedQuiz] = useState<any | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTopic, setEditTopic] = useState('');
  const [editCefr, setEditCefr] = useState<CEFRLevel>('B1');
  const [editIsGlobal, setEditIsGlobal] = useState(false);
  const [editBatchId, setEditBatchId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const bRes = await getBatchesAction();
    const qRes = await getQuizzesAction();

    if (bRes.success && bRes.batches) {
      setBatches(bRes.batches);
      if (bRes.batches.length > 0 && !targetBatchId) {
        setTargetBatchId(bRes.batches[0].id);
      }
    }
    if (qRes.success && qRes.quizzes) {
      setQuizzes(qRes.quizzes);
    }
    setLoading(false);
  };

  const loadAnalytics = async () => {
    const res = await getTeacherQuizAnalyticsAction();
    if (res.success && res.submissions) {
      setAnalyticsSubmissions(res.submissions);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab]);

  // 1. Generate AI Quiz Draft via Prompt
  const handleChatGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      toast.error('Please enter a topic or prompt for Gemini AI.');
      return;
    }

    setGenerating(true);
    toast.info('Gemini AI Master Professor is crafting your quiz draft...', { id: 'ai-gen' });

    try {
      const res = await generateQuizAction(userPrompt, cefrLevel);
      if (!res.success || !res.quizDraft) {
        toast.error(res.error || 'Failed to generate AI quiz.');
      } else {
        toast.success('Quiz Draft generated! Review & edit below before publishing.');
        setDraftQuiz(res.quizDraft as any);
      }
    } catch (err: any) {
      toast.error('Unexpected error generating quiz.');
    } finally {
      setGenerating(false);
    }
  };

  // 2. Generate Quiz from PPT Content
  const handleGenerateFromPPT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pptText.trim() || pptText.trim().length < 20) {
      toast.error('Please paste or enter at least 20 characters of PPT slide content.');
      return;
    }

    setGeneratingPPT(true);
    toast.info('Gemini AI is analyzing your PPT slides to build a quiz...', { id: 'ppt-gen' });

    try {
      const res = await generateQuizFromPPTAction(pptText, cefrLevel);
      if (!res.success || !res.quizDraft) {
        toast.error(res.error || 'Failed to generate quiz from PPT.');
      } else {
        toast.success('PPT Quiz Draft generated! Review & edit questions below.');
        setDraftQuiz(res.quizDraft as any);
      }
    } catch (err: any) {
      toast.error('Unexpected error parsing PPT content.');
    } finally {
      setGeneratingPPT(false);
    }
  };

  // 3. Parse Google Forms / Raw Text
  const handleParseRawText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() || rawText.trim().length < 15) {
      toast.error('Please paste raw text containing at least 1-2 questions.');
      return;
    }

    setParsing(true);
    toast.info('Parsing Google Forms / Text into questions...', { id: 'parse-text' });

    try {
      const res = await parseRawQuizTextAction(rawText, cefrLevel);
      if (!res.success || !res.quizDraft) {
        toast.error(res.error || 'Failed to parse text.');
      } else {
        toast.success('Text parsed successfully! Review draft below.');
        setDraftQuiz(res.quizDraft as any);
      }
    } catch (err: any) {
      toast.error('Error parsing text into questions.');
    } finally {
      setParsing(false);
    }
  };

  // 4. Create Empty Manual Draft
  const handleStartManualDraft = () => {
    setDraftQuiz({
      title: `${cefrLevel} Custom Grammar Test`,
      topic: 'Manual Test',
      cefrLevel,
      questions: [
        {
          id: 1,
          question: 'Write your question text here...',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: 0,
          explanation: 'Option A is correct.',
        },
      ],
    });
    toast.success('Manual draft started! Fill in questions below.');
  };

  // 5. Publish Quiz Live to Students
  const handlePublishQuiz = async () => {
    if (!draftQuiz || draftQuiz.questions.length === 0) {
      toast.error('Cannot publish an empty quiz.');
      return;
    }
    if (!isGlobal && !targetBatchId) {
      toast.error('Please select a Target Batch or check "Publish to ALL Batches".');
      return;
    }

    setPublishing(true);
    const res = await createManualQuizAction({
      batchId: isGlobal ? null : targetBatchId,
      isGlobal,
      title: draftQuiz.title,
      cefrLevel: draftQuiz.cefrLevel,
      topic: draftQuiz.topic,
      questions: draftQuiz.questions,
    });

    if (res.success) {
      toast.success('Quiz published live to students!');
      setDraftQuiz(null);
      setUserPrompt('');
      setRawText('');
      setPptText('');
      fetchData();
    } else {
      toast.error(res.error || 'Failed to publish quiz.');
    }
    setPublishing(false);
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this published quiz?')) return;
    const res = await deleteQuizAction(id);
    if (res.success) {
      toast.success('Quiz deleted.');
      fetchData();
    } else {
      toast.error(res.error || 'Failed to delete quiz.');
    }
  };

  const handleEditQuizSave = async () => {
    if (!editingQuiz) return;
    const res = await updateQuizAction({
      id: editingQuiz.id,
      batchId: editIsGlobal ? null : editBatchId,
      isGlobal: editIsGlobal,
      title: editTitle,
      topic: editTopic,
      cefrLevel: editCefr,
    });

    if (res.success) {
      toast.success('Quiz updated successfully!');
      setEditingQuiz(null);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to update quiz.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-indigo-500" />
          <span>Quiz Studio & All-Rounder AI Master Professor</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">
          Chat with All-Rounder Master AI, convert PPT slides into quizzes, parse Google Forms, build manual tests, and inspect student score & attempt analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('chat_ai')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'chat_ai'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-500" />
          <span>Gemini AI Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('ppt_slides')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'ppt_slides'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Presentation className="w-4 h-4 text-purple-500" />
          <span>PPT / Slide AI Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('google_forms')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'google_forms'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <FileCode className="w-4 h-4 text-emerald-500" />
          <span>Google Forms / Text</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Plus className="w-4 h-4 text-amber-500" />
          <span>Manual Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Award className="w-4 h-4 text-cyan-500" />
          <span>Student Scores & Attempts</span>
        </button>
      </div>

      {/* CHAT AI ASSISTANT TAB */}
      {activeTab === 'chat_ai' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
            <Bot className="w-5 h-5 text-indigo-500 shrink-0" />
            <span>Chat with All-Rounder AI Master Professor</span>
          </h2>
          <p className="text-xs text-theme-sub">
            Describe any subject, topic, or grammar rule. Our All-Rounder Master Professor AI will generate a professional draft for you to review & edit before publishing.
          </p>

          <form onSubmit={handleChatGenerate} className="space-y-4 pt-2">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-theme-sub uppercase shrink-0">Level:</label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                className="px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-semibold"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                required
                placeholder="Ask AI Professor: e.g. Create a test on Nouns & Pronouns or Business Writing..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-xs sm:text-sm text-theme-main focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={generating}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{generating ? 'Prof. AI Thinking...' : 'Generate Quiz Draft'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PPT / SLIDE AI BUILDER TAB */}
      {activeTab === 'ppt_slides' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
            <Presentation className="w-5 h-5 text-purple-500 shrink-0" />
            <span>Generate Quiz from PPT Slides & Lesson Notes</span>
          </h2>
          <p className="text-xs text-theme-sub">
            Upload or paste text from PowerPoint slides, PDF study guides, or lesson notes below. AI will analyze the concepts and generate a custom quiz matching your slides!
          </p>

          <form onSubmit={handleGenerateFromPPT} className="space-y-4 pt-2">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-theme-sub uppercase shrink-0">Level:</label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                className="px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-semibold"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload PPT / Document File</span>
                </p>
                <p className="text-[10px] text-theme-sub mt-0.5">Select a .pptx, .pdf, .docx, or .txt file to automatically extract text into quiz generator</p>
              </div>
              <label className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shrink-0">
                <span>Browse File</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.pptx,.ppt,.docx"
                  onChange={handlePPTFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              required
              rows={6}
              placeholder="Paste your PowerPoint slide text, lesson notes, or study guide content here..."
              value={pptText}
              onChange={(e) => setPptText(e.target.value)}
              className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-xs sm:text-sm text-theme-main focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />

            <button
              type="submit"
              disabled={generatingPPT}
              className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingPPT ? 'Analyzing PPT Content...' : 'Generate Quiz from PPT Content'}</span>
            </button>
          </form>
        </div>
      )}

      {/* GOOGLE FORMS / RAW TEXT TAB */}
      {activeTab === 'google_forms' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Parse Google Forms / Raw Quiz Text</span>
          </h2>
          <p className="text-xs text-theme-sub">
            Paste raw text from Google Forms, ChatGPT, or Word documents. Gemini will convert it into an interactive quiz draft.
          </p>

          <form onSubmit={handleParseRawText} className="space-y-4 pt-2">
            <textarea
              required
              rows={6}
              placeholder="Paste raw quiz text here (e.g. 1. What is the past tense of run? A) ran B) run C) running...)"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-xs sm:text-sm text-theme-main focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />

            <button
              type="submit"
              disabled={parsing}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <FileCode className="w-4 h-4" />
              <span>{parsing ? 'Parsing Text...' : 'Parse Text into Interactive Quiz'}</span>
            </button>
          </form>
        </div>
      )}

      {/* MANUAL BUILDER TAB */}
      {activeTab === 'manual' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
            <Plus className="w-5 h-5 text-amber-500 shrink-0" />
            <span>Manual Quiz Builder</span>
          </h2>
          <p className="text-xs text-theme-sub">Start with a blank quiz draft and write questions, options, and step-by-step answer explanations manually.</p>

          <button
            onClick={handleStartManualDraft}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-2 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Create Blank Manual Quiz Draft</span>
          </button>
        </div>
      )}

      {/* INTERACTIVE DRAFT PREVIEW & EDITOR */}
      {draftQuiz && (
        <div className="bg-theme-card border-2 border-indigo-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                Draft Preview Mode
              </span>
              <h2 className="text-lg font-bold text-theme-main mt-1">Review & Edit Quiz Questions</h2>
            </div>

            <button
              onClick={() => setDraftQuiz(null)}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold self-start sm:self-auto"
            >
              Discard Draft
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-theme-card-sub p-4 rounded-xl border border-theme">
            <div>
              <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Quiz Title</label>
              <textarea
                rows={1}
                value={draftQuiz.title}
                onChange={(e) => setDraftQuiz({ ...draftQuiz, title: e.target.value })}
                className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-xs text-theme-main font-bold leading-relaxed break-words focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Topic / Category</label>
              <textarea
                rows={1}
                value={draftQuiz.topic}
                onChange={(e) => setDraftQuiz({ ...draftQuiz, topic: e.target.value })}
                className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-xs text-theme-main font-semibold leading-relaxed break-words focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-theme-main text-sm">Questions ({draftQuiz.questions.length})</h3>

            {draftQuiz.questions.map((q: any, qIdx: number) => (
              <div key={qIdx} className="p-4 bg-theme-card-sub border border-theme rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500">Question #{qIdx + 1}</span>
                  <button
                    onClick={() => {
                      const updated = draftQuiz.questions.filter((_, i) => i !== qIdx);
                      setDraftQuiz({ ...draftQuiz, questions: updated });
                    }}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    Delete Question
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Question Text</label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...draftQuiz.questions];
                      updated[qIdx].question = e.target.value;
                      setDraftQuiz({ ...draftQuiz, questions: updated });
                    }}
                    className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {q.options.map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-theme-sub">
                        Option {String.fromCharCode(65 + optIdx)}:
                      </label>
                      <textarea
                        rows={2}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...draftQuiz.questions];
                          updated[qIdx].options[optIdx] = e.target.value;
                          setDraftQuiz({ ...draftQuiz, questions: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-xl text-theme-main text-xs leading-relaxed break-words whitespace-pre-wrap focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Correct Answer</label>
                    <select
                      value={q.correctAnswerIndex}
                      onChange={(e) => {
                        const updated = [...draftQuiz.questions];
                        updated[qIdx].correctAnswerIndex = parseInt(e.target.value);
                        setDraftQuiz({ ...draftQuiz, questions: updated });
                      }}
                      className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-semibold"
                    >
                      <option value={0}>Option A: {q.options[0]}</option>
                      <option value={1}>Option B: {q.options[1]}</option>
                      <option value={2}>Option C: {q.options[2]}</option>
                      <option value={3}>Option D: {q.options[3]}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Answer Explanation</label>
                    <textarea
                      rows={2}
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const updated = [...draftQuiz.questions];
                        updated[qIdx].explanation = e.target.value;
                        setDraftQuiz({ ...draftQuiz, questions: updated });
                      }}
                      className="w-full px-3 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-xs leading-relaxed break-words whitespace-pre-wrap focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                const updated = [
                  ...draftQuiz.questions,
                  {
                    id: draftQuiz.questions.length + 1,
                    question: 'New question text...',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswerIndex: 0,
                    explanation: 'Option A is correct.',
                  },
                ];
                setDraftQuiz({ ...draftQuiz, questions: updated });
              }}
              className="px-4 py-2 bg-theme-card-sub hover:opacity-90 text-theme-main border border-theme font-semibold rounded-xl text-xs flex items-center space-x-1"
            >
              <Plus className="w-4 h-4 text-indigo-500" />
              <span>Add Question to Draft</span>
            </button>
          </div>

          <div className="pt-4 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobal}
                  onChange={(e) => setIsGlobal(e.target.checked)}
                  className="rounded border-theme text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-indigo-600 dark:text-indigo-300 flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish to ALL Batches (Global)</span>
                </span>
              </label>

              {!isGlobal && (
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-theme-sub font-semibold uppercase">Target Batch:</label>
                  {batches.length === 0 ? (
                    <span className="text-xs text-amber-500 font-semibold italic bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30">
                      No batches found (Create a batch first)
                    </span>
                  ) : (
                    <select
                      value={targetBatchId}
                      onChange={(e) => setTargetBatchId(e.target.value)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-indigo-500/40 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px] shadow-sm"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium py-1">
                          {b.name} ({b.cefrLevel})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handlePublishQuiz}
              disabled={publishing}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{publishing ? 'Publishing...' : 'Publish Quiz Live to Students'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PUBLISHED QUIZZES LIST */}
      <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
          <span>Published Batch Quizzes & Preview Studio</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading published quizzes...</div>
        ) : quizzes.length === 0 ? (
          <p className="text-center py-6 text-xs sm:text-sm text-theme-sub">No published quizzes available. Use the studio above to generate or parse a quiz!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div key={q.id} className="p-4 bg-theme-card-sub border border-theme rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                      {q.cefrLevel}
                    </span>
                    <span className="text-[10px] text-theme-sub font-mono">
                      {q.isGlobal ? 'Global (All Batches)' : q.batch?.name || 'Specific Batch'}
                    </span>
                  </div>
                  <h3 className="font-bold text-theme-main text-sm leading-snug">{q.title}</h3>
                  <p className="text-xs text-theme-sub mt-0.5">Topic: {q.topic} • {(q.questions as any[])?.length || 0} Questions</p>
                </div>

                <div className="flex items-center justify-end space-x-2 border-t border-theme pt-3">
                  <button
                    onClick={() => setPreviewPublishedQuiz(q)}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Quiz</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingQuiz(q);
                      setEditTitle(q.title);
                      setEditTopic(q.topic);
                      setEditCefr(q.cefrLevel);
                      setEditIsGlobal(q.isGlobal);
                      setEditBatchId(q.batchId || '');
                    }}
                    className="p-1.5 text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Quiz Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(q.id)}
                    className="p-1.5 text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* STUDENT SCORES & ATTEMPTS ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-theme-main flex items-center space-x-2">
              <Award className="w-5 h-5 text-cyan-500 shrink-0" />
              <span>Detailed Student Quiz Attempts & Roster Breakdown</span>
            </h2>
            <p className="text-xs text-theme-sub mt-0.5">Track student attempt counts (Attempt #1, Attempt #2), highest scores, and date of completion</p>
          </div>

          {analyticsSubmissions.length === 0 ? (
            <p className="text-center py-6 text-xs sm:text-sm text-theme-sub">No student quiz attempts recorded yet.</p>
          ) : (
            <div className="divide-y divide-theme border border-theme rounded-xl overflow-hidden shadow-sm">
              {analyticsSubmissions.map((sub) => (
                <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-card hover:bg-theme-card-sub transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-theme-main text-sm">{sub.student?.fullName || sub.student?.email}</h4>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-mono font-bold">
                        Attempt #{sub.attemptNumber || 1}
                      </span>
                    </div>
                    <p className="text-xs text-theme-sub">
                      Quiz: <span className="font-semibold text-theme-main">{sub.quiz?.title}</span> • Batch: {sub.student?.batch?.name || 'No Batch'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 self-start sm:self-auto">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      Score: {sub.score} / {sub.totalQuestions || 5} pts ({Math.round((sub.score / (sub.totalQuestions || 5)) * 100)}%)
                    </span>
                    <span className="text-[10px] text-theme-sub font-mono">
                      {new Date(sub.completedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PREVIEW PUBLISHED QUIZ MODAL */}
      {previewPublishedQuiz && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                  {previewPublishedQuiz.cefrLevel}
                </span>
                <h3 className="font-bold text-theme-main text-lg mt-1">{previewPublishedQuiz.title}</h3>
                <p className="text-xs text-theme-sub">Topic: {previewPublishedQuiz.topic}</p>
              </div>
              <button
                onClick={() => setPreviewPublishedQuiz(null)}
                className="p-2 text-theme-sub hover:text-theme-main bg-theme-card-sub rounded-xl border border-theme"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {((previewPublishedQuiz.questions as any[]) || []).map((q: any, idx: number) => (
                <div key={idx} className="p-4 bg-theme-card-sub border border-theme rounded-xl space-y-3">
                  <h4 className="font-bold text-theme-main text-sm flex items-start space-x-2">
                    <span className="text-indigo-500">Q{idx + 1}.</span>
                    <span>{q.question}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(q.options || []).map((opt: string, optIdx: number) => {
                      const isCorrect = optIdx === q.correctAnswerIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                            isCorrect
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-theme-input border-theme text-theme-sub'
                          }`}
                        >
                          <span className="font-mono font-bold mr-1">{String.fromCharCode(65 + optIdx)}:</span> {opt}
                          {isCorrect && <span className="ml-2 text-[10px] text-emerald-500 uppercase font-mono">(Correct)</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-500/20 italic">
                      <span className="font-bold not-italic">Explanation: </span>{q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-theme">
              <button
                onClick={() => setPreviewPublishedQuiz(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PUBLISHED QUIZ MODAL */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-2xl w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-theme-main">Edit Published Quiz Details</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">Topic / Category</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-sub uppercase mb-1">CEFR Level</label>
                <select
                  value={editCefr}
                  onChange={(e) => setEditCefr(e.target.value as CEFRLevel)}
                  className="w-full px-4 py-2 bg-theme-input border border-theme rounded-xl text-theme-main text-sm font-semibold"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced</option>
                  <option value="C2">C2 - Mastery</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <label className="flex items-center space-x-2 text-xs text-theme-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsGlobal}
                    onChange={(e) => setEditIsGlobal(e.target.checked)}
                    className="rounded border-theme text-indigo-600"
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

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-theme">
              <button
                onClick={() => setEditingQuiz(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-theme-main rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEditQuizSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
