import React, { useState } from 'react';
import { Evidence, EvidenceType, Skill, SkillState, TargetRole } from '../types';
import { SKILL_MAP } from '../data/skillsData';
import { EVIDENCE_WEIGHTS } from '../types';
import { fetchPracticeQuestion, PracticeQuestionResponse } from '../utils/geminiClient';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FolderGit2,
  Calendar,
  Sparkles,
  Plus,
  PlayCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface SkillDetailDrawerProps {
  skillId: string | null;
  skillState: SkillState | undefined;
  allSkillStates: Map<string, SkillState>;
  selectedRole: TargetRole;
  allEvidence: Evidence[];
  onClose: () => void;
  onOpenWhy: (skillId: string) => void;
  onAddEvidence: (skillId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onTakeAssessment: (skillId: string) => void;
}

export const SkillDetailDrawer: React.FC<SkillDetailDrawerProps> = ({
  skillId,
  skillState,
  allSkillStates,
  selectedRole,
  allEvidence,
  onClose,
  onOpenWhy,
  onAddEvidence,
  onSelectSkill,
  onTakeAssessment,
}) => {
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceProblem, setPracticeProblem] = useState<PracticeQuestionResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!skillId) return null;

  const skill = SKILL_MAP.get(skillId);
  if (!skill) return null;

  const mastery = skillState?.mastery ?? 0;
  const confidence = skillState?.confidence ?? 0;
  const evidenceCount = skillState?.evidenceCount ?? 0;

  // Filter evidence for this skill
  const skillEvidence = allEvidence
    .filter((e) => e.skillId === skillId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Role requirement check
  const roleReq = selectedRole.requiredSkills.find((r) => r.skillId === skillId);
  const isRequiredForRole = !!roleReq;
  const targetMastery = roleReq?.targetMastery ?? 75;
  const gap = Math.max(0, targetMastery - mastery);

  // Prerequisites status
  const prereqDetails = skill.prerequisites.map((pId) => {
    const pSkill = SKILL_MAP.get(pId);
    const pState = allSkillStates.get(pId);
    const pMastery = pState?.mastery ?? 0;
    return {
      id: pId,
      name: pSkill?.name || pId,
      mastery: pMastery,
      isMet: pMastery >= 60,
    };
  });

  // Dependent skills
  const dependentDetails = skill.dependentSkills.map((dId) => {
    const dSkill = SKILL_MAP.get(dId);
    const dState = allSkillStates.get(dId);
    return {
      id: dId,
      name: dSkill?.name || dId,
      mastery: dState?.mastery ?? 0,
      isUnlocked: dState?.isUnlocked ?? false,
    };
  });

  const handleGeneratePractice = async () => {
    setPracticeLoading(true);
    setPracticeProblem(null);
    setSelectedOption(null);
    setShowAnswer(false);
    try {
      const q = await fetchPracticeQuestion(skill.name, mastery);
      setPracticeProblem(q);
    } finally {
      setPracticeLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{skill.category}</span>
              <span aria-hidden="true">·</span>
              <span>{skill.difficulty}</span>
              {isRequiredForRole && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    Required for {selectedRole.title}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{skill.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          {skill.description}
        </p>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Mastery Score</span>
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {mastery}%
            </span>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full ${
                  mastery >= 75
                    ? 'bg-emerald-500'
                    : mastery >= 40
                    ? 'bg-indigo-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${mastery}%` }}
              />
            </div>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Confidence</span>
            <span className="text-lg font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {confidence}%
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
              {evidenceCount} verified proofs
            </span>
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Role Gap</span>
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                gap > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {gap > 0 ? `-${gap}%` : 'Met'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
              Target: {targetMastery}%
            </span>
          </div>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
        {/* Recommended Action CTA */}
        <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 block">
              Recommended Next Action
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {mastery < 50
                ? 'Take a diagnostic assessment to verify foundational concepts'
                : evidenceCount < 3
                ? 'Add coding challenge or project evidence to boost confidence'
                : 'Practice timed algorithmic problems or interview drills'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenWhy(skillId)}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
            >
              Why?
            </button>
            <button
              onClick={() => onTakeAssessment(skillId)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
            >
              Test
            </button>
          </div>
        </div>

        {/* Section: Transparent Mastery Calculation Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Transparent Mastery Formula
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Weighted Average</span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            {(Object.keys(EVIDENCE_WEIGHTS) as EvidenceType[]).map((type) => {
              const weightPct = Math.round(EVIDENCE_WEIGHTS[type] * 100);
              const data = skillState?.categoryBreakdown[type];
              const score = data ? data.averageScore : null;
              const count = data ? data.count : 0;

              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {type} ({weightPct}%)
                    </span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {score !== null ? `${score}% avg (${count} logs)` : 'No evidence (0%)'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score !== null ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-transparent'
                      }`}
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50 flex justify-between">
              <span>Confidence: {confidence}% (based on category diversity & recency)</span>
              <button
                onClick={() => onAddEvidence(skillId)}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Evidence
              </button>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Prerequisites ({prereqDetails.length})
          </h3>
          {prereqDetails.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Foundational skill with zero prerequisites. Unlocked by default.
            </p>
          ) : (
            <div className="space-y-2">
              {prereqDetails.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectSkill(p.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    {p.isMet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        Mastery: {p.mastery}% · {p.isMet ? 'Satisfied' : 'Requires >=60%'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dependent Skills */}
        {dependentDetails.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Unlocks Downstream Skills ({dependentDetails.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {dependentDetails.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelectSkill(d.id)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <span>{d.name}</span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    ({d.mastery}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Measurable Evidence Log for this skill */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Measurable Evidence Log ({skillEvidence.length})
            </h3>
            <button
              onClick={() => onAddEvidence(skillId)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Proof</span>
            </button>
          </div>

          {skillEvidence.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
              <FolderGit2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                No verified evidence logged yet
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
                Complete a diagnostic quiz or submit a GitHub project to build confidence.
              </p>
              <button
                onClick={() => onAddEvidence(skillId)}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 transition-colors inline-block"
              >
                Add First Evidence
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {skillEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] mb-0.5">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {ev.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white block">
                      {ev.title}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block mt-0.5">
                      Source: {ev.source}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
                      {ev.score}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Weight: {Math.round(EVIDENCE_WEIGHTS[ev.type] * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Quick Practice Drill */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                AI Technical Drill Generator
              </h3>
            </div>
            <button
              onClick={handleGeneratePractice}
              disabled={practiceLoading}
              className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition-colors disabled:opacity-50"
            >
              {practiceLoading ? 'Generating...' : practiceProblem ? 'New Drill' : 'Start Drill'}
            </button>
          </div>

          {practiceProblem ? (
            <div className="space-y-3 text-xs">
              <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {practiceProblem.question}
              </p>
              <div className="space-y-1.5">
                {practiceProblem.options.map((opt, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === practiceProblem.correctIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedOption(idx);
                        setShowAnswer(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                        showAnswer
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium'
                            : isChosen
                            ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {showAnswer && (
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {selectedOption === practiceProblem.correctIndex ? 'Correct!' : 'Explanation:'}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {practiceProblem.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generate a realistic CSE technical question adapted to your current mastery ({mastery}%) to sharpen concepts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
