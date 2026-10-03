import React, { useEffect, useState } from 'react';
import { Recommendation, Skill, SkillState, TargetRole } from '../types';
import { SKILL_MAP } from '../data/skillsData';
import { explainWhySkill, ExplainWhyResponse } from '../utils/geminiClient';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface WhyExplanationModalProps {
  recommendation: Recommendation | null;
  selectedRole: TargetRole;
  skillState: SkillState | undefined;
  allSkillStates: Map<string, SkillState>;
  onClose: () => void;
  onTakeAssessment?: (skillId: string) => void;
  onOpenSkillDetails?: (skillId: string) => void;
}

export const WhyExplanationModal: React.FC<WhyExplanationModalProps> = ({
  recommendation,
  selectedRole,
  skillState,
  allSkillStates,
  onClose,
  onTakeAssessment,
  onOpenSkillDetails,
}) => {
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<ExplainWhyResponse | null>(null);

  if (!recommendation) return null;

  const skill = SKILL_MAP.get(recommendation.skillId);
  const prereqDetails = (skill?.prerequisites || []).map((pId) => {
    const pSkill = SKILL_MAP.get(pId);
    const pState = allSkillStates.get(pId);
    const mastery = pState?.mastery ?? 0;
    return {
      id: pId,
      name: pSkill?.name || pId,
      mastery,
      isMet: mastery >= 60,
    };
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    explainWhySkill({
      skillName: recommendation.skillName,
      currentMastery: recommendation.currentMastery,
      confidence: skillState?.confidence ?? 0,
      targetRole: selectedRole.title,
      roleTargetMastery: recommendation.targetMastery,
      prerequisites: skill?.prerequisites || [],
      dependentSkills: skill?.dependentSkills || [],
      evidenceCount: skillState?.evidenceCount ?? 0,
      missingPrereqs: recommendation.missingPrereqs,
    })
      .then((data) => {
        if (isMounted) {
          setAiData(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [recommendation.skillId, selectedRole.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                Why is {recommendation.skillName} Recommended?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target Role: {selectedRole.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section 1: Deterministic Metrics Breakdown */}
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Deterministic Evidence & Readiness Metrics
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Current Mastery</span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {recommendation.currentMastery}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Target: {recommendation.targetMastery}%
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Skill Gap</span>
                <span className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {recommendation.gap}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Deficit to role
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Prereq Readiness</span>
                <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {recommendation.prereqReadiness}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {recommendation.isUnlocked ? 'Unlocked' : 'Blocked'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Confidence</span>
                <span className="text-xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                  {skillState?.confidence ?? 0}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  {skillState?.evidenceCount ?? 0} evidence records
                </span>
              </div>
            </div>
          </div>

          {/* Prerequisite Chain Status */}
          {prereqDetails.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Prerequisite Dependency Invariants
              </div>
              <div className="flex flex-wrap gap-2">
                {prereqDetails.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                      p.isMet
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                        : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {p.isMet ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span className="font-medium">{p.name}</span>
                    <span className="font-mono tabular-nums font-semibold">({p.mastery}%)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p.isMet ? 'Satisfied' : 'Needs >=60%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: AI Reasoning Layer */}
          <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                Gemma Reasoning Layer
              </span>
            </div>

            {loading ? (
              <div className="space-y-2 py-2">
                <div className="h-4 bg-indigo-200/40 dark:bg-indigo-800/40 rounded w-full animate-pulse" />
                <div className="h-4 bg-indigo-200/40 dark:bg-indigo-800/40 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-indigo-200/40 dark:bg-indigo-800/40 rounded w-4/6 animate-pulse" />
              </div>
            ) : aiData ? (
              <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
                <p>{aiData.explanation}</p>
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                  <span className="font-semibold text-slate-900 dark:text-white block text-xs mb-1">
                    Strategic Industry Value:
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{aiData.strategicValue}</p>
                </div>

                {aiData.suggestedActions && aiData.suggestedActions.length > 0 && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-900 dark:text-white block text-xs mb-2">
                      Recommended 3-Step Milestone:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {aiData.suggestedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Deterministic calculation: {recommendation.reason}
              </p>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              onClose();
              if (onOpenSkillDetails) onOpenSkillDetails(recommendation.skillId);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Inspect Skill Details & Evidence</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            {onTakeAssessment && (
              <button
                onClick={() => {
                  onClose();
                  onTakeAssessment(recommendation.skillId);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
              >
                <span>Take Diagnostic Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
