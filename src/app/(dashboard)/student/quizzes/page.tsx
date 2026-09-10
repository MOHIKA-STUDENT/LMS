'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { offlineDb } from '@/lib/db/offline-db';
import { Quiz, QuizQuestion } from '@/types/database';
import { Sparkles, CheckCircle2, XCircle, Award, HelpCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('batch_id')
        .eq('id', user.id)
        .single();

      if (profile?.batch_id) {
        const { data: qData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('batch_id', profile.batch_id)
          .order('created_at', { ascending: false });

        if (qData) setQuizzes(qData as Quiz[]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;

    // Calculate score
    let calculatedScore = 0;
    activeQuiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      quiz_id: activeQuiz.id,
      student_id: user.id,
      score: calculatedScore,
      total_questions: activeQuiz.questions.length,
      answers_submitted: selectedAnswers,
    };

    // Check online status for offline queue intercept
    if (!navigator.onLine) {
      // Save offline in IndexedDB
      await offlineDb.offlineQueue.add({
        type: 'SUBMIT_QUIZ',
        payload: payload,
        timestamp: Date.now(),
        synced: false,
      });

      toast.info('Saved quiz result locally in IndexedDB! Will sync when back online.', {
        description: `You earned ${calculatedScore * 10} points offline.`,
      });

      return;
    }

    try {
      // Submit directly to Supabase
      const { error } = await supabase.from('quiz_submissions').insert(payload);
      if (error) throw error;

      // Update student points in profiles
      const { data: pData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

      if (pData) {
        await supabase
          .from('profiles')
          .update({ points: (pData.points || 0) + calculatedScore * 10 })
          .eq('id', user.id);
      }

      toast.success(`Quiz Completed! +${calculatedScore * 10} points awarded!`);
    } catch (err: any) {
      toast.error('Failed to submit online. Backing up locally...');
      await offlineDb.offlineQueue.add({
        type: 'SUBMIT_QUIZ',
        payload: payload,
        timestamp: Date.now(),
        synced: false,
      });
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-indigo-400" />
          <span>Daily Quiz Arena</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Test your English skills with Gemini AI-generated quizzes for your batch and earn leaderboard points</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 animate-pulse">Loading batch quizzes...</div>
      ) : activeQuiz ? (
        /* Interactive Quiz Arena View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                {activeQuiz.cefr_level} LEVEL
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{activeQuiz.title}</h2>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg"
            >
              Exit Quiz
            </button>
          </div>

          {!isSubmitted ? (
            /* Active Question Card */
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span>Topic: {activeQuiz.topic}</span>
              </div>

              {(() => {
                const q = activeQuiz.questions[currentQuestionIndex];
                return (
                  <div key={q.id} className="space-y-4">
                    <h3 className="text-lg font-semibold text-white bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                      {q.question}
                    </h3>

                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>

                {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleQuizSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30"
                  >
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Results Score Card */
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Award className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
                <p className="text-sm text-slate-400 mt-1">
                  You scored <span className="text-amber-400 font-bold font-mono">{score} / {activeQuiz.questions.length}</span> ({score * 20}%)
                </p>
                <div className="text-lg font-bold text-emerald-400 mt-2 font-mono">
                  +{score * 10} Leaderboard Points Earned!
                </div>
              </div>

              {/* Explanations Review */}
              <div className="space-y-4 text-left border-t border-slate-800 pt-6">
                <h4 className="font-bold text-slate-200 text-sm">Question Explanations:</h4>
                {activeQuiz.questions.map((q, idx) => {
                  const studentAns = selectedAnswers[q.id];
                  const isCorrect = studentAns === q.correctAnswerIndex;
                  return (
                    <div key={q.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-300">Q{idx + 1}: {q.question}</span>
                        {isCorrect ? (
                          <span className="text-emerald-400 flex items-center space-x-1"><CheckCircle2 className="w-4 h-4" /><span>Correct</span></span>
                        ) : (
                          <span className="text-rose-400 flex items-center space-x-1"><XCircle className="w-4 h-4" /><span>Incorrect</span></span>
                        )}
                      </div>

                      <p className="text-slate-400">
                        Correct Answer: <span className="text-emerald-300 font-semibold">{q.options[q.correctAnswerIndex]}</span>
                      </p>
                      <p className="text-slate-400 italic bg-slate-900/60 p-2 rounded text-slate-300">
                        💡 {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setActiveQuiz(null)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30"
              >
                Back to Quizzes List
              </button>
            </div>
          )}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-300">No Quizzes Available</h3>
          <p className="text-sm text-slate-500 mt-1">There are no AI quizzes generated for your batch yet. Check back soon!</p>
        </div>
      ) : (
        /* Quiz Selection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                    {quiz.cefr_level}
                  </span>
                  <span className="text-xs text-slate-500">5 Questions</span>
                </div>

                <h3 className="font-bold text-white text-lg mb-1">{quiz.title}</h3>
                <p className="text-xs text-slate-400">Topic: {quiz.topic}</p>
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
