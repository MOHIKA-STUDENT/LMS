'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateQuizAction } from '@/app/actions/ai-actions';
import { Batch, CEFRLevel, Quiz } from '@/types/database';
import { Sparkles, Bot, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizGenPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('B1');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const { data: bData } = await supabase.from('batches').select('*').order('name');
    const { data: qData } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });

    if (bData) {
      setBatches(bData);
      if (bData.length > 0 && !selectedBatchId) {
        setSelectedBatchId(bData[0].id);
      }
    }
    if (qData) setQuizzes(qData as Quiz[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) {
      toast.error('Please select a target batch.');
      return;
    }
    if (!topic.trim()) {
      toast.error('Please enter a quiz topic.');
      return;
    }

    setGenerating(true);
    toast.info('Asking Gemini AI to generate 5 CEFR questions...', { id: 'ai-gen' });

    try {
      const res = await generateQuizAction(selectedBatchId, cefrLevel, topic);
      if (!res.success) {
        toast.error(res.error || 'Failed to generate AI quiz.');
      } else {
        toast.success('5-Question Gemini Quiz Generated & Tagged to Batch!');
        setTopic('');
        fetchData();
      }
    } catch (err: any) {
      toast.error('Unexpected error generating quiz.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-indigo-400" />
          <span>AI Quiz Generator (Gemini Engine)</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Generate 5-question CEFR-aligned English quizzes using server-side Gemini AI</p>
      </div>

      {/* Generator Control Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <span>Gemini Prompt Parameters</span>
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
                  {b.name} ({b.cefr_level})
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
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Topic / Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Past Perfect vs Past Continuous"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end pt-2">
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Gemini is Generating Quiz...' : 'Generate 5-Question AI Quiz'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Quizzes Vault */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">Generated Batch Quizzes</h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse">Loading generated quizzes...</div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No AI quizzes generated yet. Use the panel above to generate your first quiz!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const batchName = batches.find((b) => b.id === quiz.batch_id)?.name || 'Unknown Batch';
              return (
                <div key={quiz.id} className="p-5 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                      {quiz.cefr_level}
                    </span>
                    <span className="text-xs text-slate-400">{batchName}</span>
                  </div>

                  <h3 className="font-bold text-white text-base">{quiz.title}</h3>
                  <p className="text-xs text-slate-400">Topic: {quiz.topic} • 5 Questions</p>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready for Students</span>
                    </span>
                    <span className="text-slate-500">{new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
