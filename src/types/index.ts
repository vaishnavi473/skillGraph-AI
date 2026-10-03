export type SkillCategory =
  | 'Programming Languages'
  | 'Core CS & DSA'
  | 'Systems & Engineering'
  | 'Web & Architecture';

export type EvidenceType =
  | 'Quiz'
  | 'Coding'
  | 'Projects'
  | 'Interview'
  | 'Practice'
  | 'Self Assessment';

export const EVIDENCE_WEIGHTS: Record<EvidenceType, number> = {
  Quiz: 0.25,
  Coding: 0.25,
  Projects: 0.20,
  Interview: 0.15,
  Practice: 0.10,
  'Self Assessment': 0.05,
};

export interface Evidence {
  id: string;
  skillId: string;
  type: EvidenceType;
  title: string;
  score: number; // 0 - 100
  date: string; // ISO date string
  source: string; // e.g. "Diagnostic Quiz 1", "LeetCode #206", "GitHub Repo"
  details?: string;
  link?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  prerequisites: string[]; // skillIds
  dependentSkills: string[]; // skillIds
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  tags: string[];
}

export interface CategoryBreakdownItem {
  averageScore: number;
  count: number;
  weight: number;
}

export interface SkillState {
  skillId: string;
  mastery: number; // 0 - 100
  confidence: number; // 0 - 100
  evidenceCount: number;
  categoryBreakdown: Partial<Record<EvidenceType, CategoryBreakdownItem>>;
  prereqReadiness: number; // 0 - 100
  isUnlocked: boolean;
  recentTrend: 'improving' | 'stable' | 'needs-practice';
  lastPracticedDate?: string;
}

export interface RoleSkillRequirement {
  skillId: string;
  targetMastery: number; // e.g. 80
  importance: 'critical' | 'important' | 'nice-to-have';
}

export interface TargetRole {
  id: string;
  title: string;
  description: string;
  marketDemand: 'High' | 'Very High' | 'Crucial';
  requiredSkills: RoleSkillRequirement[];
}

export interface AssessmentQuestion {
  id: string;
  skillId: string;
  skillName: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  skillsCovered: string[];
  questions: AssessmentQuestion[];
}

export interface CompletedAssessmentRecord {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  date: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  skillBreakdown: Record<string, { correct: number; total: number; percentage: number }>;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  university: string;
  year: string;
  targetRoleId: string;
  evidence: Evidence[];
  completedAssessments: CompletedAssessmentRecord[];
  createdAt: string;
}

export interface Recommendation {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  currentMastery: number;
  targetMastery: number;
  gap: number;
  prereqReadiness: number;
  isUnlocked: boolean;
  missingPrereqs: string[];
  urgency: 'critical' | 'high' | 'medium';
  priorityScore: number;
  reason: string;
}

export interface RoleCoverageReport {
  overallCoverage: number; // 0 - 100
  metSkillsCount: number;
  totalRequired: number;
  criticalGapsCount: number;
  skillGaps: Array<{
    skillId: string;
    skillName: string;
    currentMastery: number;
    targetMastery: number;
    gap: number;
    importance: 'critical' | 'important' | 'nice-to-have';
    isUnlocked: boolean;
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
