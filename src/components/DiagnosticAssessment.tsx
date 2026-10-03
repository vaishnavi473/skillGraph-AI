import React, { useState } from 'react';
import { Assessment, CompletedAssessmentRecord, Evidence, SkillState } from '../types';
import { ASSESSMENTS } from '../data/assessmentsData';
import { SKILL_MAP } from '../data/skillsData';
import confetti from 'canvas-confetti';
import {
  FileCheck2,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  Layers,
  Award,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface DiagnosticAssessmentProps {
  onCompleteAssessment: (
    assessment: Assessment,
    answers: Record<string, number>,
    newEvidenceList: Evidence[]
  ) => void;
  skillStates: Map<string, SkillState>;
  onNavigateTab: (tab: string) => void;
  initialSkillFilter?: string | null;
}

export const DiagnosticAssessment: React.FC<DiagnosticAssessmentProps> = ({
  onCompleteAssessment,
  skillStates,
  onNavigateTab,
  initialSkillFilter,
}) => {
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [skillFilter, setSkillFilter] = useState<string | null>(initialSkillFilter || null);

  React.useEffect(() => {
    if (initialSkillFilter) {
      setSkillFilter(initialSkillFilter);
      setCompletedResult(null);
    }
  }, [initialSkillFilter]);

  const [completedResult, setCompletedResult] = useState<{
    assessment: Assessment;
    score: number;
    correctCount: number;
    total: number;
    impactSummary: Array<{
      skillId: string;
      skillName: string;
      priorMastery: number;
      newMastery: number;
      delta: number;
      questionScore: number;
    }>;
  } | null>(null);

  // If skillFilter passed, find matching assessment; fallback safely if none match
  const filteredAssessments = skillFilter
    ? ASSESSMENTS.filter((a) => a.skillsCovered.includes(skillFilter))
    : ASSESSMENTS;

  const displayAssessments =
    filteredAssessments.length > 0 ? filteredAssessments : ASSESSMENTS;

  const handleStart = (assessment: Assessment) => {
    setActiveAssessment(assessment);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setCompletedResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    if (!activeAssessment) return;

    let correctCount = 0;
    const skillScores: Record<string, { correct: number; total: number }> = {};

    activeAssessment.questions.forEach((q) => {
      if (!skillScores[q.skillId]) {
        skillScores[q.skillId] = { correct: 0, total: 0 };
      }
      skillScores[q.skillId].total += 1;

      const chosen = selectedAnswers[q.id];
      if (chosen === q.correctIndex) {
        correctCount += 1;
        skillScores[q.skillId].correct += 1;
      }
    });

    const totalQuestions = activeAssessment.questions.length;
    const finalScore = Math.round((correctCount / totalQuestions) * 100);

    // Create new Evidence items for each skill tested!
    const timestamp = new Date().toISOString();
    const newEvidenceList: Evidence[] = [];
    const impactSummary: any[] = [];

    Object.entries(skillScores).forEach(([skillId, data]) => {
      const skillScore = Math.round((data.correct / data.total) * 100);
      const skill = SKILL_MAP.get(skillId);
      const priorState = skillStates.get(skillId);
      const priorMastery = priorState?.mastery ?? 0;

      const ev: Evidence = {
        id: `ev-diag-${Date.now()}-${skillId}`,
        skillId,
        type: 'Quiz',
        title: `${activeAssessment.title} (${data.correct}/${data.total} correct)`,
        score: skillScore,
        date: timestamp,
        source: activeAssessment.title,
        details: `Diagnostic test submission: ${data.correct} of ${data.total} questions answered correctly.`,
      };
      newEvidenceList.push(ev);

      // Estimate post-test mastery for immediate impact display
      const newMastery = priorMastery === 0 ? skillScore : Math.round((priorMastery * 3 + skillScore) / 4);
      impactSummary.push({
        skillId,
        skillName: skill?.name || skillId,
        priorMastery,
        newMastery,
        delta: newMastery - priorMastery,
        questionScore: skillScore,
      });
    });

    // Trigger completion in parent state
    onCompleteAssessment(activeAssessment, selectedAnswers, newEvidenceList);

    // Celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback if canvas not available
    }

    setCompletedResult({
      assessment: activeAssessment,
      score: finalScore,
      correctCount,
      total: totalQuestions,
      impactSummary,
    });
  };

  // Render Completed Results Screen
  if (completedResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Diagnostic Assessment Completed!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {completedResult.assessment.title}
          </p>

          <div className="flex items-center justify-center gap-6 my-6">
            <div className="text-center">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                {completedResult.score}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Overall Accuracy
              </span>
            </div>
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="text-center">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                {completedResult.correctCount}/{completedResult.total}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                Questions Correct
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('graph')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect Updated Skill Graph</span>
            </button>
            <button
              onClick={() => {
                setActiveAssessment(null);
                setCompletedResult(null);
              }}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
            >
              Take Another Assessment
            </button>
          </div>
        </div>

        {/* Immediate SkillGraph Recalibration Impact */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Deterministic Skill Mastery Impact
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified Quiz evidence recorded directly into student skill graph
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              Live Re-calculated
            </span>
          </div>

          <div className="space-y-2.5">
            {completedResult.impactSummary.map((item) => (
              <div
                key={item.skillId}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {item.skillName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test Performance: {item.questionScore}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {item.priorMastery}% &rarr;{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.newMastery}%
                    </span>
                  </span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      item.delta >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Pedagogical Question Review & Explanations
          </h3>

          <div className="space-y-4">
            {completedResult.assessment.questions.map((q, idx) => {
              const userChoice = selectedAnswers[q.id];
              const isCorrect = userChoice === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500">Q{idx + 1}.</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {q.question}
                      </span>
                    </div>
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                  </div>

                  {q.codeSnippet && (
                    <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-lg overflow-x-auto">
                      {q.codeSnippet}
                    </pre>
                  )}

                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    <div>
                      <span className="font-semibold">Your Answer: </span>
                      <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {userChoice !== undefined ? q.options[userChoice] : 'Not answered'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span className="font-semibold text-emerald-600">Correct Answer: </span>
                        <span>{q.options[q.correctIndex]}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                    <span className="font-semibold">Pedagogical Invariant: </span>
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render In-Progress Assessment Question View
  if (activeAssessment) {
    const question = activeAssessment.questions[currentQuestionIndex];
    const totalQuestions = activeAssessment.questions.length;
    const progressPct = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
    const selectedOption = selectedAnswers[question.id];

    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
        {/* Progress Bar & Header */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {activeAssessment.title}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <div className="w-48 sm:w-64 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setActiveAssessment(null)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel Assessment
          </button>
        </div>

        {/* Current Question Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              Mapped Skill: {question.skillName}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">
              {question.difficulty}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
            {question.question}
          </h3>

          {question.codeSnippet && (
            <pre className="p-4 bg-slate-950 text-slate-100 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
              {question.codeSnippet}
            </pre>
          )}

          {/* Multiple choice options */}
          <div className="space-y-2.5">
            {question.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(question.id, idx)}
                  className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-medium shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-850/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((i) => i + 1)}
                disabled={selectedOption === undefined}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={selectedOption === undefined}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>Submit & Calculate Mastery</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Assessment Catalog View
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Diagnostic Engineering Assessments
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Test your technical competencies with real algorithmic, architectural, and syntax
            challenges. Submissions generate verified Quiz evidence (25% weight) and immediately
            recalibrate your SkillGraph.
          </p>
        </div>

        {skillFilter && (
          <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs shrink-0">
            <span className="text-indigo-900 dark:text-indigo-300">
              Filtered for: <strong>{SKILL_MAP.get(skillFilter)?.name || skillFilter}</strong>
            </span>
            <button
              onClick={() => setSkillFilter(null)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayAssessments.map((assessment) => (
          <div
            key={assessment.id}
            className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {assessment.category}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {assessment.durationMinutes} mins · {assessment.questions.length} questions
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {assessment.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {assessment.description}
              </p>

              {/* Skills covered chips */}
              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5">
                  Skills Evaluated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assessment.skillsCovered.map((sId) => {
                    const sk = SKILL_MAP.get(sId);
                    const state = skillStates.get(sId);
                    return (
                      <span
                        key={sId}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {sk?.name || sId}{' '}
                        <span className="font-mono text-slate-400">({state?.mastery ?? 0}%)</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                25% Quiz Mastery Weight
              </span>
              <button
                onClick={() => handleStart(assessment)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
