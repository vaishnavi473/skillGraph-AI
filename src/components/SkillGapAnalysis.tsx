import React from 'react';
import {
  Recommendation,
  RoleCoverageReport,
  SkillState,
  TargetRole,
} from '../types';
import { TARGET_ROLES } from '../data/rolesData';
import { SKILL_MAP } from '../data/skillsData';
import {
  TrendingUp,
  HelpCircle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface SkillGapAnalysisProps {
  selectedRole: TargetRole;
  onSelectRole: (role: TargetRole) => void;
  roleReport: RoleCoverageReport;
  recommendations: Recommendation[];
  skillStates: Map<string, SkillState>;
  onOpenWhy: (skillId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onTakeAssessment: (skillId: string) => void;
}

export const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({
  selectedRole,
  onSelectRole,
  roleReport,
  recommendations,
  skillStates,
  onOpenWhy,
  onSelectSkill,
  onTakeAssessment,
}) => {
  return (
    <div className="space-y-6">
      {/* Target Role Selector & High-level Role Coverage */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Target Role Intelligence
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {selectedRole.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            {selectedRole.description}
          </p>
        </div>

        {/* Quick Role Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-850 rounded-lg">
          {TARGET_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedRole.id === role.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {role.title.replace('Software Engineer ', '').replace('Specialist', '')}
            </button>
          ))}
        </div>
      </div>

      {/* "What Should I Learn Next?" Prioritized Engine */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                "What Should I Learn Next?" Recommendation Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministically ranked by role relevance, prerequisite readiness, and gap size
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => (
            <div
              key={rec.skillId}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    #{idx + 1} Priority
                  </span>
                  <span
                    className={`font-medium px-2 py-0.5 rounded text-[11px] ${
                      rec.urgency === 'critical'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : rec.urgency === 'high'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {rec.urgency === 'critical' ? 'Critical Gap' : `${rec.urgency} Leverage`}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {rec.skillName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>Mastery: {rec.currentMastery}%</span>
                    <span aria-hidden="true">·</span>
                    <span>Target: {rec.targetMastery}%</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">
                      Gap: -{rec.gap}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rec.reason}
                </div>

                {rec.missingPrereqs.length > 0 && (
                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Prerequisites required: {rec.missingPrereqs.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Buttons with Mandatory "Why?" button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenWhy(rec.skillId)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-md border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Why?</span>
                </button>

                <button
                  onClick={() => onTakeAssessment(rec.skillId)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors"
                >
                  <span>Practice</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Role Competency Gap Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Role Requirements Breakdown ({roleReport.skillGaps.length} Skills)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sorted by largest deficit to target threshold
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            Overall: {roleReport.overallCoverage}% Met
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {roleReport.skillGaps.map((item) => {
            const skill = SKILL_MAP.get(item.skillId);
            const isMet = item.currentMastery >= item.targetMastery;

            return (
              <div
                key={item.skillId}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSkill(item.skillId)}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {item.skillName}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({item.importance})
                    </span>
                    {isMet && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Met
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-1 max-w-xl">
                    {skill?.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                      {item.currentMastery}% / {item.targetMastery}%
                    </span>
                    <span
                      className={`block font-mono text-[11px] ${
                        isMet
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400 font-semibold'
                      }`}
                    >
                      {isMet ? 'Target Satisfied' : `Gap: -${item.gap}%`}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenWhy(item.skillId)}
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-md transition-colors"
                    title="Why is this gap important?"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onTakeAssessment(item.skillId)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-md transition-colors"
                  >
                    Assess
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
