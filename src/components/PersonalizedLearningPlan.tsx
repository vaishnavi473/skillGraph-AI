import React, { useEffect, useState } from 'react';
import {
  Recommendation,
  RoleCoverageReport,
  SkillState,
  StudentProfile,
  TargetRole,
} from '../types';
import { fetchLearningPlan, LearningPlanResponse } from '../utils/geminiClient';
import {
  CalendarCheck,
  Sparkles,
  RotateCw,
  CheckCircle2,
  Circle,
  ArrowRight,
  Lightbulb,
  FileCheck,
  FolderGit2,
} from 'lucide-react';

interface PersonalizedLearningPlanProps {
  currentStudent: StudentProfile;
  selectedRole: TargetRole;
  roleReport: RoleCoverageReport;
  recommendations: Recommendation[];
  skillStates: Map<string, SkillState>;
  onTakeAssessment: (skillId?: string) => void;
  onAddEvidence: (skillId?: string) => void;
}

export const PersonalizedLearningPlan: React.FC<PersonalizedLearningPlanProps> = ({
  currentStudent,
  selectedRole,
  roleReport,
  recommendations,
  skillStates,
  onTakeAssessment,
  onAddEvidence,
}) => {
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState<LearningPlanResponse | null>(null);
  const [completedMilestones, setCompletedMilestones] = useState<Record<number, boolean>>({});

  const generatePlan = async () => {
    setLoading(true);
    try {
      const readySkills = recommendations
        .filter((r) => r.isUnlocked)
        .map((r) => r.skillName);

      const topGaps = roleReport.skillGaps.slice(0, 4).map((g) => ({
        skillName: g.skillName,
        gap: g.gap,
        currentMastery: g.currentMastery,
      }));

      const recentEvidence = currentStudent.evidence.slice(0, 5).map((e) => ({
        type: e.type,
        title: e.title,
        score: e.score,
      }));

      const plan = await fetchLearningPlan({
        studentName: currentStudent.name,
        targetRole: selectedRole.title,
        overallCoverage: roleReport.overallCoverage,
        topGaps,
        readySkills,
        recentEvidence,
      });

      setPlanData(plan);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generatePlan();
  }, [currentStudent.id, selectedRole.id]);

  const toggleMilestone = (week: number) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [week]: !prev[week],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header and Regenerate Action */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              AI Personalized Curriculum
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Target Roadmap for {selectedRole.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Tailored learning path mapped to {currentStudent.name}'s verified strengths, ready
            prerequisites, and priority gaps.
          </p>
        </div>

        <button
          onClick={generatePlan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50 shrink-0"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing...' : 'Regenerate Plan'}</span>
        </button>
      </div>

      {/* Plan Summary Banner */}
      {planData && (
        <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-white block mb-1">
            Strategic Assessment:
          </span>
          {planData.summary}
        </div>
      )}

      {/* 4-Week Milestone Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((w) => (
              <div
                key={w}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : planData ? (
          planData.weeklyPlan.map((item) => {
            const isDone = !!completedMilestones[item.week];
            return (
              <div
                key={item.week}
                className={`p-6 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-colors ${
                  isDone
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleMilestone(item.week)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          Week {item.week}
                        </span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Focus: {item.focus}
                        </span>
                        {isDone && (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                            (Completed)
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.goal}
                      </p>

                      <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Deliverable:
                          </span>{' '}
                          {item.deliverable}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onTakeAssessment()}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-800 transition-colors"
                    >
                      Assess
                    </button>
                    <button
                      onClick={() => onAddEvidence()}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
                    >
                      Log Proof
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : null}
      </div>

      {/* Strategic Pedagogical Tips */}
      {planData && planData.tips && planData.tips.length > 0 && (
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Pedagogical Advice from Gemma
            </h3>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {planData.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
