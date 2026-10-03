import React, { useState } from 'react';
import { Evidence, EvidenceType, StudentProfile, SkillState } from '../types';
import { INITIAL_SKILLS, SKILL_MAP } from '../data/skillsData';
import { EVIDENCE_WEIGHTS } from '../types';
import {
  FolderGit2,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';

interface EvidenceManagerProps {
  currentStudent: StudentProfile;
  skillStates: Map<string, SkillState>;
  onAddEvidence: (evidence: Omit<Evidence, 'id'>) => void;
  onSelectSkill: (skillId: string) => void;
  initialSkillId?: string | null;
  autoOpenModal?: boolean;
}

export const EvidenceManager: React.FC<EvidenceManagerProps> = ({
  currentStudent,
  skillStates,
  onAddEvidence,
  onSelectSkill,
  initialSkillId,
  autoOpenModal,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(autoOpenModal ?? false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSkill, setFilterSkill] = useState<string>('all');

  // Form State for new evidence
  const [formSkillId, setFormSkillId] = useState<string>(
    initialSkillId || INITIAL_SKILLS[0].id
  );
  const [formType, setFormType] = useState<EvidenceType>('Projects');
  const [formTitle, setFormTitle] = useState('');
  const [formScore, setFormScore] = useState<number>(85);
  const [formSource, setFormSource] = useState('');
  const [formDetails, setFormDetails] = useState('');

  // Sync when initialSkillId or autoOpenModal prop changes
  React.useEffect(() => {
    if (initialSkillId) {
      setFormSkillId(initialSkillId);
      setIsModalOpen(true);
    }
  }, [initialSkillId, autoOpenModal]);

  const evidenceTypes: EvidenceType[] = [
    'Quiz',
    'Coding',
    'Projects',
    'Interview',
    'Practice',
    'Self Assessment',
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSource) return;

    onAddEvidence({
      skillId: formSkillId,
      type: formType,
      title: formTitle,
      score: Number(formScore),
      date: new Date().toISOString(),
      source: formSource,
      details: formDetails || undefined,
    });

    setIsModalOpen(false);
    setFormTitle('');
    setFormSource('');
    setFormDetails('');
    setFormScore(85);
  };

  // Filtered evidence items
  const filteredEvidence = currentStudent.evidence.filter((ev) => {
    const matchesType = filterType === 'all' || ev.type === filterType;
    const matchesSkill = filterSkill === 'all' || ev.skillId === filterSkill;
    return matchesType && matchesSkill;
  });

  return (
    <div className="space-y-6">
      {/* Header and Add Proof CTA */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Measurable Evidence Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            All skill mastery scores are mathematically generated from verifiable proof: Quizzes (25%),
            Coding (25%), Projects (20%), Interviews (15%), Practice (10%), and Self Assessment (5%).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Verified Evidence</span>
        </button>
      </div>

      {/* Transparent Weighting Architecture Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {evidenceTypes.map((type) => {
          const weightPct = Math.round(EVIDENCE_WEIGHTS[type] * 100);
          const count = currentStudent.evidence.filter((e) => e.type === type).length;
          return (
            <div
              key={type}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-900 dark:text-white">{type}</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {weightPct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                {count} records logged
              </span>
            </div>
          );
        })}
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Filter by:</span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Evidence Types</option>
            {evidenceTypes.map((t) => (
              <option key={t} value={t}>
                {t} ({Math.round(EVIDENCE_WEIGHTS[t] * 100)}%)
              </option>
            ))}
          </select>

          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Skills (24)</option>
            {INITIAL_SKILLS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing {filteredEvidence.length} of {currentStudent.evidence.length} evidence records
        </span>
      </div>

      {/* Evidence Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredEvidence.map((ev) => {
          const skill = SKILL_MAP.get(ev.skillId);
          const weightPct = Math.round(EVIDENCE_WEIGHTS[ev.type] * 100);

          return (
            <div
              key={ev.id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {ev.type}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <button
                      onClick={() => onSelectSkill(ev.skillId)}
                      className="font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline"
                    >
                      {skill?.name || ev.skillId}
                    </button>
                  </div>
                  <span className="text-xs font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    Score: {ev.score}%
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {ev.title}
                </h3>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Source: {ev.source}</span>
                  <span className="font-mono">{new Date(ev.date).toLocaleDateString()}</span>
                </div>

                {ev.details && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                    {ev.details}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Calculated into {skill?.name} at {weightPct}% weight</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Evidence Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log New Measurable Evidence
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Target Skill
                  </label>
                  <select
                    value={formSkillId}
                    onChange={(e) => setFormSkillId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {INITIAL_SKILLS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Evidence Category
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EvidenceType)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {evidenceTypes.map((t) => (
                      <option key={t} value={t}>
                        {t} ({Math.round(EVIDENCE_WEIGHTS[t] * 100)}% Weight)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Evidence Title / Artifact Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Key-Value Store with Raft Consensus"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Score / Performance ({formScore}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full mt-2 accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                    Source / Link / Verifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GitHub /user/repo or LeetCode #206"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Technical Details / Implementation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Benchmarked 10k ops/sec with connection pooling and automated unit tests."
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Log Evidence & Recalculate Graph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
