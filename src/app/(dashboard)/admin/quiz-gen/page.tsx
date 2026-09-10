'use client';

import { useState, useEffect } from 'react';
import { generateQuizAction } from '@/app/actions/ai-actions';
import { getBatchesAction, getQuizzesAction, createManualQuizAction, getTeacherQuizAnalyticsAction } from '@/app/actions/lms-actions';
import { CEFRLevel } from '@prisma/client';
import { Sparkles, Bot, CheckCircle2, Plus, Eye, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizGenPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'analytics'>('ai');
  const [batches, setBatches] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analyticsSubmissions, setAnalyticsSubmissions] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [topic, setTopic] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual Quiz State
  const [manualTitle, setManualTitle] = useState('');
  const [manualTopic, setManualTopic] = useState('');
  const [manualQuestions, setManualQuestions] = useState<
    { question: string; options: string[]; correctAnswerIndex: number; explanation: string }[]
  >([
    {
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
    },
  ]);

  const fetchData = async () => {
    setLoading(true);
    const bRes = await getBatchesAction();
    const qRes = await getQuizzesAction();

    if (bRes.success && bRes.batches) {
      setBatches(bRes.batches);
      if (bRes.batches.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bRes.batches[0].id);
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      toast.error('Please select a target batch.');
      return;
    }
    if (!topic.trim()) {
      toast.error('Please enter a primary quiz topic.');
      return;
    }

    setGenerating(true);
    toast.info('Generating CEFR Quiz with Multi-Topic prompt...', { id: 'ai-gen' });

    try {
      const res = await generateQuizAction(selectedBatchId, cefrLevel, topic, customPrompt);
      if (!res.success) {
        toast.error(res.error || 'Failed to generate AI quiz.');
      } else {
        toast.success('Gemini Quiz Generated & Tagged to Batch!');
        setTopic('');
        setCustomPrompt('');
        fetchData();
      }
    } catch (err: any) {
      toast.error('Unexpected error generating quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManualQuestion = () => {
    if (manualQuestions.length >= 10) {
      toast.error('Maximum 10 questions per quiz.');
      return;
    }
    setManualQuestions([
      ...manualQuestions,
      { question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' },
    ]);
  };

  const handleCreateManualQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId || !manualTitle.trim() || !manualTopic.trim()) {
      toast.error('Please fill in batch, title, and topic.');
      return;
    }

    const formattedQuestions = manualQuestions.map((q, idx) => ({
      id: idx + 1,
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex,
      explanation: q.explanation || 'Option ' + String.fromCharCode(65 + q.correctAnswerIndex) + ' is correct.',
    }));

    const res = await createManualQuizAction({
      batchId: selectedBatchId,
      title: manualTitle,
      cefrLevel,
      topic: manualTopic,
      questions: formattedQuestions,
    });

    if (res.success) {
      toast.success('Custom Quiz Created & Published!');
      setManualTitle('');
      setManualTopic('');
      setManualQuestions([{ question: '', options: ['', '', '', ''], correctAnswerIndex: 0, explanation: '' }]);
      fetchData();
    } else {
      toast.error(res.error || 'Failed to create manual quiz.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-7 h-7 text-indigo-400" />
            <span>Quiz Studio & Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Generate AI quizzes with custom multi-topic prompts, upload manual tests, or inspect student mistakes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'ai'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Multi-Topic Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'manual'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Upload Custom Quiz</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Student Quiz Progress & Mistakes</span>
        </button>
      </div>

      {/* AI GENERATOR TAB */}
      {activeTab === 'ai' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>AI Quiz Prompt Parameters</span>
          </h2>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.cefrLevel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">CEFR Level</label>
              <select
                value={cefrLevel}
                onChange={(e) => setCefrLevel(e.target.value as CEFRLevel)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="A1">A1 - Beginner</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Mastery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Primary Topic</label>
              <input
                type="text"
                required
                placeholder="e.g. Past Perfect Tense"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Custom Multi-Topic Instructions / Prompt (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Include questions on Business English vocabulary + Prepositions of Place + Email etiquettes"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={generating}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'Generating Quiz...' : 'Generate 5-Question Multi-Topic Quiz'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MANUAL QUIZ CREATOR TAB */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <span>Create & Upload Custom Quiz</span>
          </h2>

          <form onSubmit={handleCreateManualQuiz} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.cefrLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Grammar & Vocab Test"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conditionals & Inversion"
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="font-bold text-white text-sm">Questions ({manualQuestions.length})</h3>

              {manualQuestions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">Question #{idx + 1}</span>
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Enter question text here..."
                    value={q.question}
                    onChange={(e) => {
                      const updated = [...manualQuestions];
                      updated[idx].question = e.target.value;
                      setManualQuestions(updated);
                    }}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{String.fromCharCode(65 + optIdx)}:</span>
                        <input
                          type="text"
                          required
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updated = [...manualQuestions];
                            updated[idx].options[optIdx] = e.target.value;
                            setManualQuestions(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Correct Option</label>
                      <select
                        value={q.correctAnswerIndex}
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[idx].correctAnswerIndex = parseInt(e.target.value);
                          setManualQuestions(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-semibold"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Answer Explanation</label>
                      <input
                        type="text"
                        placeholder="Explanation shown after student submits..."
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...manualQuestions];
                          updated[idx].explanation = e.target.value;
                          setManualQuestions(updated);
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add Another Question</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
                >
                  Publish Custom Quiz
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* STUDENT QUIZ MISTAKES ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Eye className="w-5 h-5 text-indigo-400" />
            <span>Student Quiz Submissions & Mistake Analysis</span>
          </h2>

          {analyticsSubmissions.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-500">No quiz submissions recorded yet.</p>
          ) : (
            <div className="space-y-4 divide-y divide-slate-800">
              {analyticsSubmissions.map((sub) => (
                <div key={sub.id} className="pt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-white text-sm">{sub.student?.fullName || 'Student'}</h3>
                      <p className="text-xs text-slate-400">{sub.quiz?.title} • {sub.student?.batch?.name}</p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono font-bold">
                        Score: {sub.score} pts
                      </span>
                      <span className="text-slate-500">{new Date(sub.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Published Quizzes Vault */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">All Published Batch Quizzes</h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No quizzes available. Generate or create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="p-5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                    {quiz.cefrLevel}
                  </span>
                  <span className="text-xs text-slate-400">{quiz.batch?.name || 'Batch'}</span>
                </div>

                <h3 className="font-bold text-white text-base">{quiz.title}</h3>
                <p className="text-xs text-slate-400">Topic: {quiz.topic}</p>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active for Students</span>
                  </span>
                  <span className="text-slate-500">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
