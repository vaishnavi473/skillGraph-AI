import React from 'react';
import {
  Evidence,
  Recommendation,
  RoleCoverageReport,
  SkillState,
  StudentProfile,
  TargetRole,
} from '../types';
import { INITIAL_SKILLS, SKILL_MAP } from '../data/skillsData';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FolderGit2,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  HelpCircle,
  Clock,
  Plus,
} from 'lucide-react';

interface DashboardProps {
  currentStudent: StudentProfile;
  selectedRole: TargetRole;
  skillStates: Map<string, SkillState>;
  roleReport: RoleCoverageReport;
  recommendations: Recommendation[];
  onOpenWhy: (skillId: string) => void;
  onSelectSkill: (skillId: string) => void;
  onTakeAssessment: (skillId?: string) => void;
  onAddEvidence: (skillId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentStudent,
  selectedRole,
  skillStates,
  roleReport,
  recommendations,
  onOpenWhy,
  onSelectSkill,
  onTakeAssessment,
  onAddEvidence,
  onNavigateTab,
}) => {
  // Aggregate deterministic metrics
  const allStatesArray = Array.from(skillStates.values());
  const strongSkillsCount = allStatesArray.filter((s) => s.mastery >= 75).length;
  const developingSkillsCount = allStatesArray.filter(
    (s) => s.mastery >= 40 && s.mastery < 75
  ).length;

  // Average confidence across active skills
  const activeStates = allStatesArray.filter((s) => s.evidenceCount > 0);
  const avgConfidence =
    activeStates.length > 0
      ? Math.round(activeStates.reduce((acc, s) => acc + s.confidence, 0) / activeStates.length)
      : 0;

  const topRecommendation = recommendations[0];

  // Recent 5 evidence items
  const recentEvidence = [...currentStudent.evidence]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Student Welcome & Target Overview Bar */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{currentStudent.university}</span>
            <span aria-hidden="true">·</span>
            <span>{currentStudent.year}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{currentStudent.email}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Skill Intelligence: {currentStudent.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Calibrated against industry baseline for{' '}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {selectedRole.title}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAddEvidence()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project / Evidence</span>
          </button>
          <button
            onClick={() => onTakeAssessment()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <span>Diagnostic Assessment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-Metric Operational Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Overall Coverage */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Overall Role Coverage
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {roleReport.overallCoverage}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({roleReport.metSkillsCount}/{roleReport.totalRequired})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${roleReport.overallCoverage}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Strong Skills */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Strong Skills (&ge;75%)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {strongSkillsCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 24 total</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-2">
            Verified high proficiency
          </span>
        </div>

        {/* Metric 3: Developing Skills */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Developing (40-74%)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
              {developingSkillsCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">competencies</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-2">
            Active learning curve
          </span>
        </div>

        {/* Metric 4: Critical Gaps */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Critical Gaps
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {roleReport.criticalGapsCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">deficits</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-2">
            Highest priority to unlock
          </span>
        </div>

        {/* Metric 5: Confidence Index */}
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Graph Confidence
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {avgConfidence}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({currentStudent.evidence.length} proofs)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-2">
            Multi-type evidence rigor
          </span>
        </div>
      </div>

      {/* Spotlight: Recommended Next Skill with "Why?" Button */}
      {topRecommendation && (
        <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                  Recommended Next Skill
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Target: {selectedRole.title}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Prereq Readiness: {topRecommendation.prereqReadiness}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {topRecommendation.skillName}
                </h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Mastery: {topRecommendation.currentMastery}% &rarr; Target: {topRecommendation.targetMastery}%
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {topRecommendation.reason}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Mandatory "Why?" button beside recommendation */}
              <button
                onClick={() => onOpenWhy(topRecommendation.skillId)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Why?</span>
              </button>

              <button
                onClick={() => onTakeAssessment(topRecommendation.skillId)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                <span>Take Diagnostic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Role Coverage Matrix & Recent Evidence Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Target Role Skill Coverage Matrix */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Target Role Skill Coverage Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation of all skills required for {selectedRole.title}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('gaps')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Full Gap Analysis</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {roleReport.skillGaps.map((item) => {
              const state = skillStates.get(item.skillId);
              const confidence = state?.confidence ?? 0;
              const isMet = item.currentMastery >= item.targetMastery;

              return (
                <div
                  key={item.skillId}
                  onClick={() => onSelectSkill(item.skillId)}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.skillName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.importance}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {item.currentMastery}% / {item.targetMastery}%
                      </span>
                      <span
                        className={`text-[11px] font-semibold font-mono ${
                          isMet
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isMet ? 'Met' : `-${item.gap}%`}
                      </span>
                    </div>
                  </div>

                  {/* Dual progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden relative">
                    {/* Target mark */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                      style={{ left: `${item.targetMastery}%` }}
                    />
                    {/* Current progress */}
                    <div
                      className={`h-full rounded-full ${
                        isMet
                          ? 'bg-emerald-500'
                          : item.currentMastery >= 40
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.currentMastery}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Recent Evidence Activity Stream */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Recent Measurable Evidence
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified logs influencing deterministic scores
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('evidence')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentEvidence.map((ev) => {
              const skill = SKILL_MAP.get(ev.skillId);
              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectSkill(ev.skillId)}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {ev.type}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{skill?.name || ev.skillId}</span>
                        <span aria-hidden="true">·</span>
                        <span>{new Date(ev.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                        {ev.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        {ev.source}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white block">
                        {ev.score}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => onAddEvidence()}
            className="w-full py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Evidence Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
