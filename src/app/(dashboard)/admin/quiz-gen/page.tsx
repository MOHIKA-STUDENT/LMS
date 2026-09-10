'use client';

import { useState, useEffect } from 'react';
import { generateQuizAction, parseRawQuizTextAction } from '@/app/actions/ai-actions';
import { getBatchesAction, getQuizzesAction, createManualQuizAction, getTeacherQuizAnalyticsAction } from '@/app/actions/lms-actions';
import { CEFRLevel } from '@prisma/client';
import { Sparkles, Bot, CheckCircle2, Plus, Eye, BookOpen, Send, Edit3, Globe, Trash2, FileCode } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizGenPage() {
  const [activeTab, setActiveTab] = useState<'chat_ai' | 'google_forms' | 'manual' | 'analytics'>('chat_ai');
  const [batches, setBatches] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analyticsSubmissions, setAnalyticsSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chat AI Assistant State
  const [userPrompt, setUserPrompt] = useState('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [generating, setGenerating] = useState(false);

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

  // 1. Generate AI Quiz Draft
  const handleChatGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      toast.error('Please enter a topic or prompt for Gemini AI.');
      return;
    }

    setGenerating(true);
    toast.info('Gemini AI is crafting your quiz draft...', { id: 'ai-gen' });

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

  // 2. Parse Google Forms / Pasted Text
  const handleParseRawText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      toast.error('Please paste your quiz text or Google Forms questions.');
      return;
    }

    setParsing(true);
    toast.info('Parsing quiz questions into editable format...', { id: 'parse-quiz' });

    try {
      const res = await parseRawQuizTextAction(rawText, cefrLevel);
      if (!res.success || !res.quizDraft) {
        toast.error(res.error || 'Failed to parse quiz text.');
      } else {
        toast.success('Quiz questions parsed successfully! Review & edit below.');
        setDraftQuiz(res.quizDraft as any);
        setRawText('');
      }
    } catch (err: any) {
      toast.error('Failed to parse text.');
    } finally {
      setParsing(false);
    }
  };

  // 3. Publish Quiz Draft to Database
  const handlePublishQuiz = async () => {
    if (!draftQuiz || draftQuiz.questions.length === 0) {
      toast.error('No valid quiz questions to publish.');
      return;
    }
    if (!isGlobal && !targetBatchId) {
      toast.error('Please select a target batch or check All Batches.');
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
      toast.success(isGlobal ? 'Quiz published to ALL Batches!' : 'Quiz published to batch!');
      setDraftQuiz(null);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to publish quiz.');
    }
    setPublishing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-indigo-500" />
          <span>Quiz Studio & AI Assistant</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Chat with Gemini AI, parse Google Forms, build manual tests, edit draft previews, and publish for All or Specific Batches</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('chat_ai')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'chat_ai'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Gemini AI Chat Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('google_forms')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'google_forms'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Google Forms / Paste Text</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Manual Builder</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-bold'
              : 'text-theme-sub hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-theme-main'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Student Scores & Results</span>
        </button>
      </div>

      {/* CHAT AI ASSISTANT TAB */}
      {activeTab === 'chat_ai' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <Bot className="w-5 h-5 text-indigo-500" />
            <span>Chat with Gemini AI to Craft Quizzes</span>
          </h2>
          <p className="text-xs text-theme-sub">Describe any topic, grammar rule, or CEFR level. Gemini will generate a draft for you to review & edit before publishing.</p>

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

            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                placeholder="Ask Gemini: e.g. Create a 5-question test on Third Conditionals and Business Negotiations..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="flex-1 px-4 py-3 bg-theme-input border border-theme rounded-xl text-theme-main text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={generating}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{generating ? 'Gemini is Thinking...' : 'Generate Draft'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GOOGLE FORMS / PASTE TEXT TAB */}
      {activeTab === 'google_forms' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-indigo-500" />
            <span>Parse Google Forms or Pasted Quiz Text</span>
          </h2>
          <p className="text-xs text-theme-sub">Copy questions & choices directly from Google Forms or documents and paste below. Gemini will structure it into an editable quiz!</p>

          <form onSubmit={handleParseRawText} className="space-y-4">
            <textarea
              rows={6}
              required
              placeholder="Paste raw text here... e.g. 1. What is the correct past tense of go? A) Went B) Gone C) Going D) Goes"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full px-4 py-3 bg-theme-input border border-theme rounded-xl text-theme-main text-xs font-mono focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={parsing}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{parsing ? 'Parsing Questions...' : 'Parse into Editable Quiz'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL BUILDER TAB */}
      {activeTab === 'manual' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            <span>Create Custom Blank Quiz</span>
          </h2>
          <button
            onClick={() =>
              setDraftQuiz({
                title: 'Custom Grammar Test',
                topic: 'General Proficiency',
                cefrLevel: 'B1',
                questions: [
                  {
                    id: 1,
                    question: 'Type your question here...',
                    options: ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswerIndex: 0,
                    explanation: 'Option A is correct.',
                  },
                ],
              })
            }
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Open Blank Quiz Draft Editor</span>
          </button>
        </div>
      )}

      {/* INTERACTIVE QUIZ DRAFT PREVIEW & EDITOR */}
      {draftQuiz && (
        <div className="bg-theme-card border-2 border-indigo-500/50 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme pb-4">
            <div>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                DRAFT PREVIEW MODE
              </span>
              <h2 className="text-xl font-bold text-theme-main mt-1">Review & Edit Quiz Questions</h2>
            </div>

            <button
              onClick={() => setDraftQuiz(null)}
              className="text-xs text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 font-semibold"
            >
              Discard Draft
            </button>
          </div>

          {/* Draft General Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-theme-card-sub p-4 rounded-xl border border-theme">
            <div>
              <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Quiz Title</label>
              <input
                type="text"
                value={draftQuiz.title}
                onChange={(e) => setDraftQuiz({ ...draftQuiz, title: e.target.value })}
                className="w-full px-3 py-2 bg-theme-input border border-theme rounded-lg text-xs text-theme-main font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Topic / Category</label>
              <input
                type="text"
                value={draftQuiz.topic}
                onChange={(e) => setDraftQuiz({ ...draftQuiz, topic: e.target.value })}
                className="w-full px-3 py-2 bg-theme-input border border-theme rounded-lg text-xs text-theme-main font-semibold"
              />
            </div>
          </div>

          {/* Editable Questions List */}
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

                <input
                  type="text"
                  value={q.question}
                  onChange={(e) => {
                    const updated = [...draftQuiz.questions];
                    updated[qIdx].question = e.target.value;
                    setDraftQuiz({ ...draftQuiz, questions: updated });
                  }}
                  className="w-full px-3 py-2 bg-theme-input border border-theme rounded-lg text-theme-main text-xs font-semibold"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-theme-sub">{String.fromCharCode(65 + optIdx)}:</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...draftQuiz.questions];
                          updated[qIdx].options[optIdx] = e.target.value;
                          setDraftQuiz({ ...draftQuiz, questions: updated });
                        }}
                        className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-theme-main text-xs"
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
                      className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-theme-main text-xs font-semibold"
                    >
                      <option value={0}>Option A: {q.options[0]}</option>
                      <option value={1}>Option B: {q.options[1]}</option>
                      <option value={2}>Option C: {q.options[2]}</option>
                      <option value={3}>Option D: {q.options[3]}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-theme-sub uppercase mb-1">Answer Explanation</label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => {
                        const updated = [...draftQuiz.questions];
                        updated[qIdx].explanation = e.target.value;
                        setDraftQuiz({ ...draftQuiz, questions: updated });
                      }}
                      className="w-full px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-theme-main text-xs"
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

          {/* Publishing Controls */}
          <div className="pt-4 border-t border-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
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
                  <select
                    value={targetBatchId}
                    onChange={(e) => setTargetBatchId(e.target.value)}
                    className="px-3 py-1.5 bg-theme-input border border-theme rounded-lg text-theme-main text-xs"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.cefrLevel})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handlePublishQuiz}
              disabled={publishing}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{publishing ? 'Publishing...' : 'Publish Quiz Live to Students'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STUDENT SCORES & RESULTS TAB */}
      {activeTab === 'analytics' && (
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            <span>Student Quiz Submissions & Score Log</span>
          </h2>

          {analyticsSubmissions.length === 0 ? (
            <p className="text-center py-6 text-sm text-theme-sub">No quiz submissions recorded yet.</p>
          ) : (
            <div className="space-y-4 divide-y divide-theme">
              {analyticsSubmissions.map((sub) => (
                <div key={sub.id} className="pt-4 flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-theme-main text-sm">{sub.student?.fullName || 'Student'}</h3>
                    <p className="text-theme-sub">{sub.quiz?.title} • {sub.student?.batch?.name}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 rounded-full font-mono font-bold">
                      Score: {sub.score} pts
                    </span>
                    <span className="text-theme-sub">{new Date(sub.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Published Quizzes Vault */}
      <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-theme-main">Published Batch Quizzes</h2>

        {loading ? (
          <div className="py-8 text-center text-theme-sub animate-pulse">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-theme-sub text-center py-6">No published quizzes available. Use the studio above to generate or parse a quiz!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-5 bg-theme-card-sub border border-theme rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                    {quiz.cefrLevel}
                  </span>
                  <span className="text-xs text-theme-sub">
                    {quiz.isGlobal ? 'ALL BATCHES' : quiz.batch?.name || 'Batch'}
                  </span>
                </div>

                <h3 className="font-bold text-theme-main text-base">{quiz.title}</h3>
                <p className="text-xs text-theme-sub">Topic: {quiz.topic} • {(quiz.questions as any[])?.length || 5} Questions</p>

                <div className="pt-2 border-t border-theme flex items-center justify-between text-xs text-theme-sub">
                  <span className="flex items-center space-x-1 text-emerald-500 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Live for Students</span>
                  </span>
                  <span className="text-theme-sub opacity-75">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
