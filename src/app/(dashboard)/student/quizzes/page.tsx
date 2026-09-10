'use client';

import { useState, useEffect } from 'react';
import { getQuizzesAction, submitQuizAction, getStudentQuizSubmissionsAction } from '@/app/actions/lms-actions';
import { offlineDb } from '@/lib/db/offline-db';
import { Sparkles, CheckCircle2, XCircle, Award, HelpCircle, ArrowRight, RotateCcw, Clock, History } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [lastAttemptNumber, setLastAttemptNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchQuizzesAndHistory = async () => {
    setLoading(true);
    const res = await getQuizzesAction();
    const subRes = await getStudentQuizSubmissionsAction();

    if (res.success && res.quizzes) {
      setQuizzes(res.quizzes);
    }
    if (subRes.success && subRes.submissions) {
      setSubmissions(subRes.submissions);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzesAndHistory();
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

    const questionsList = (activeQuiz.questions as any[]) || [];
    let calculatedScore = 0;
    questionsList.forEach((q: any) => {
      if (selectedAnswers[q.id] === q.correctAnswerIndex) {
        calculatedScore++;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const pointsEarned = calculatedScore * 10;

    if (!navigator.onLine) {
      await offlineDb.offlineQueue.add({
        type: 'SUBMIT_QUIZ',
        payload: { quizId: activeQuiz.id, scoreAwarded: pointsEarned },
        timestamp: Date.now(),
        synced: false,
      });

      toast.info('Saved quiz result locally in IndexedDB! Will sync when back online.', {
        description: `You earned ${pointsEarned} points offline.`,
      });
      return;
    }

    try {
      const res = await submitQuizAction(activeQuiz.id, pointsEarned, selectedAnswers);
      if (!res.success) throw new Error(res.error);

      setLastAttemptNumber(res.attemptNumber || 1);
      toast.success(`Quiz Completed! (Attempt #${res.attemptNumber || 1}) +${pointsEarned} points awarded!`);
      fetchQuizzesAndHistory();
    } catch (err: any) {
      toast.error('Failed to submit online. Backing up locally...');
      await offlineDb.offlineQueue.add({
        type: 'SUBMIT_QUIZ',
        payload: { quizId: activeQuiz.id, scoreAwarded: pointsEarned },
        timestamp: Date.now(),
        synced: false,
      });
    }
  };

  const startQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-theme-main flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-indigo-500" />
          <span>Daily Quiz Arena & Score History</span>
        </h1>
        <p className="text-sm text-theme-sub mt-1">Test your English skills with Gemini AI quizzes, re-attempt tests to improve your score, and track attempt history</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-theme-sub animate-pulse">Loading batch quizzes & score history...</div>
      ) : activeQuiz ? (
        /* Interactive Quiz Arena View */
        <div className="bg-theme-card border border-theme rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-theme pb-4">
            <div>
              <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                {activeQuiz.cefrLevel} LEVEL
              </span>
              <h2 className="text-xl font-bold text-theme-main mt-1">{activeQuiz.title}</h2>
            </div>
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-theme-sub hover:text-theme-main bg-theme-card-sub px-3 py-1.5 rounded-lg border border-theme"
            >
              Exit Quiz
            </button>
          </div>

          {!isSubmitted ? (
            /* Active Question Card */
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-theme-sub font-semibold">
                <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                <span>Topic: {activeQuiz.topic}</span>
              </div>

              {(() => {
                const q = activeQuiz.questions[currentQuestionIndex];
                return (
                  <div key={q.id || currentQuestionIndex} className="space-y-4">
                    <h3 className="text-lg font-semibold text-theme-main bg-theme-card-sub p-4 rounded-xl border border-theme">
                      {q.question}
                    </h3>

                    <div className="space-y-2.5">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = selectedAnswers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-600 dark:text-indigo-200 font-bold shadow-lg shadow-indigo-600/20'
                                : 'bg-theme-card-sub border-theme text-theme-main hover:opacity-95'
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-4 border-t border-theme">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-theme-card-sub text-theme-main hover:opacity-90 rounded-xl text-xs font-semibold border border-theme disabled:opacity-40"
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-500">
                <Award className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-500/30 text-xs font-mono font-bold uppercase">
                  Attempt #{lastAttemptNumber} Completed
                </span>
                <h3 className="text-2xl font-black text-theme-main mt-2">Quiz Results</h3>
                <p className="text-sm text-theme-sub mt-1">
                  You scored <span className="text-amber-500 font-bold font-mono">{score} / {activeQuiz.questions.length}</span> ({score * 20}%)
                </p>
                <div className="text-lg font-bold text-emerald-500 mt-2 font-mono">
                  +{score * 10} Leaderboard Points Awarded!
                </div>
              </div>

              {/* Explanations Review */}
              <div className="space-y-4 text-left border-t border-theme pt-6">
                <h4 className="font-bold text-theme-main text-sm">Question Explanations:</h4>
                {activeQuiz.questions.map((q: any, idx: number) => {
                  const studentAns = selectedAnswers[q.id];
                  const isCorrect = studentAns === q.correctAnswerIndex;
                  return (
                    <div key={q.id || idx} className="p-4 bg-theme-card-sub rounded-xl border border-theme space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-theme-main">Q{idx + 1}: {q.question}</span>
                        {isCorrect ? (
                          <span className="text-emerald-500 flex items-center space-x-1"><CheckCircle2 className="w-4 h-4" /><span>Correct</span></span>
                        ) : (
                          <span className="text-rose-500 flex items-center space-x-1"><XCircle className="w-4 h-4" /><span>Incorrect</span></span>
                        )}
                      </div>

                      <p className="text-theme-sub">
                        Correct Answer: <span className="text-emerald-600 dark:text-emerald-300 font-semibold">{q.options[q.correctAnswerIndex]}</span>
                      </p>
                      <p className="text-theme-sub italic bg-theme-card p-2 rounded border border-theme text-theme-main">
                        💡 {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-theme-main hover:opacity-90 font-semibold rounded-xl text-xs flex items-center space-x-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-attempt Quiz</span>
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30"
                >
                  Back to Quizzes List
                </button>
              </div>
            </div>
          )}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center bg-theme-card border border-theme rounded-2xl shadow-md">
          <HelpCircle className="w-12 h-12 text-theme-sub mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-theme-main">No Quizzes Available</h3>
          <p className="text-sm text-theme-sub mt-1">There are no AI quizzes generated for your batch yet. Check back soon!</p>
        </div>
      ) : (
        /* Quiz Selection Grid & My Attempt History */
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const quizSubs = submissions.filter((s) => s.quizId === quiz.id);
              const attemptCount = quizSubs.length;
              const highestScore = attemptCount > 0 ? Math.max(...quizSubs.map((s) => s.score)) : null;

              return (
                <div key={quiz.id} className="bg-theme-card border border-theme hover:border-indigo-500/50 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 rounded text-xs font-mono font-bold">
                        {quiz.cefrLevel}
                      </span>
                      {attemptCount > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
                          {attemptCount} {attemptCount === 1 ? 'Attempt' : 'Attempts'} (Best: {highestScore}/5)
                        </span>
                      ) : (
                        <span className="text-xs text-theme-sub font-mono">5 Questions</span>
                      )}
                    </div>

                    <h3 className="font-bold text-theme-main text-lg mb-1">{quiz.title}</h3>
                    <p className="text-xs text-theme-sub">Topic: {quiz.topic}</p>
                  </div>

                  <button
                    onClick={() => startQuiz(quiz)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <span>{attemptCount > 0 ? 'Re-attempt Quiz' : 'Take Quiz'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Student's Full Attempt History Roster */}
          {submissions.length > 0 && (
            <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-theme-main flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-500" />
                <span>My Attempt History & Past Scores</span>
              </h2>

              <div className="divide-y divide-theme border border-theme rounded-xl overflow-hidden">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-theme-card hover:bg-theme-card-sub transition-colors">
                    <div>
                      <h4 className="font-bold text-theme-main text-sm">{sub.quiz?.title || 'Practice Quiz'}</h4>
                      <p className="text-xs text-theme-sub">
                        Attempt #{sub.attemptNumber || 1} • Completed {new Date(sub.completedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                        Score: {sub.score} / {sub.totalQuestions || 5} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
