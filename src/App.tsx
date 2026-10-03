/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Assessment,
  Evidence,
  Recommendation,
  SkillState,
  StudentProfile,
  TargetRole,
} from './types';
import { DEMO_STUDENTS } from './data/initialDemoStudents';
import { TARGET_ROLES, ROLE_MAP } from './data/rolesData';
import { INITIAL_SKILLS, SKILL_MAP } from './data/skillsData';
import {
  calculateAllSkillStates,
  calculateRoleCoverage,
  getRecommendedNextSkills,
} from './utils/skillCalculations';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SkillGraphCanvas } from './components/SkillGraphCanvas';
import { SkillDetailDrawer } from './components/SkillDetailDrawer';
import { DiagnosticAssessment } from './components/DiagnosticAssessment';
import { EvidenceManager } from './components/EvidenceManager';
import { SkillGapAnalysis } from './components/SkillGapAnalysis';
import { PersonalizedLearningPlan } from './components/PersonalizedLearningPlan';
import { WhyExplanationModal } from './components/WhyExplanationModal';
import { AIChatModal } from './components/AIChatModal';

const STORAGE_KEY_STUDENTS = 'skillgraph_students_v1';
const STORAGE_KEY_ACTIVE_STUDENT = 'skillgraph_active_student_id_v1';
const STORAGE_KEY_THEME = 'skillgraph_theme_v1';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Students profiles state
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEMO_STUDENTS;
  });

  // Active student ID
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_STUDENT) || DEMO_STUDENTS[0].id;
  });

  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === activeStudentId) || students[0] || DEMO_STUDENTS[0];
  }, [students, activeStudentId]);

  // Target role state
  const [selectedRole, setSelectedRole] = useState<TargetRole>(() => {
    const roleId = currentStudent?.targetRoleId || 'backend-engineer';
    return ROLE_MAP.get(roleId) || TARGET_ROLES[0];
  });

  const handleSelectRole = (role: TargetRole) => {
    setSelectedRole(role);
    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === currentStudent.id) {
          return { ...st, targetRoleId: role.id };
        }
        return st;
      })
    );
  };

  // Whenever student switches, synchronize target role
  const handleSelectStudent = (st: StudentProfile) => {
    setActiveStudentId(st.id);
    localStorage.setItem(STORAGE_KEY_ACTIVE_STUDENT, st.id);
    const r = ROLE_MAP.get(st.targetRoleId);
    if (r) setSelectedRole(r);
  };

  // Persist students
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modal / Drawer states
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [whySkillId, setWhySkillId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [assessmentSkillTarget, setAssessmentSkillTarget] = useState<string | null>(null);

  // Quick Add Evidence modal trigger
  const [quickAddSkillId, setQuickAddSkillId] = useState<string | null>(null);

  // --- DETERMINISTIC SCORING ENGINE COMPUTATION ---
  // Strictly programmed; never randomly guessed or hallucinated by LLM
  const skillStates = useMemo(() => {
    return calculateAllSkillStates(currentStudent.evidence, INITIAL_SKILLS);
  }, [currentStudent.evidence]);

  const roleReport = useMemo(() => {
    return calculateRoleCoverage(selectedRole, skillStates);
  }, [selectedRole, skillStates]);

  const recommendations = useMemo(() => {
    return getRecommendedNextSkills(selectedRole, skillStates, 4);
  }, [selectedRole, skillStates]);

  // Recommendation object for Why modal
  const whyRecommendation: Recommendation | null = useMemo(() => {
    if (!whySkillId) return null;
    const existing = recommendations.find((r) => r.skillId === whySkillId);
    if (existing) return existing;

    const skill = SKILL_MAP.get(whySkillId);
    const state = skillStates.get(whySkillId);
    const req = selectedRole.requiredSkills.find((r) => r.skillId === whySkillId);
    const currentMastery = state?.mastery ?? 0;
    const targetMastery = req?.targetMastery ?? 75;

    return {
      skillId: whySkillId,
      skillName: skill?.name || whySkillId,
      category: skill?.category || 'Core CS & DSA',
      currentMastery,
      targetMastery,
      gap: Math.max(0, targetMastery - currentMastery),
      prereqReadiness: state?.prereqReadiness ?? 100,
      isUnlocked: state?.isUnlocked ?? true,
      missingPrereqs: (skill?.prerequisites || []).filter((p) => {
        const pState = skillStates.get(p);
        return !pState || pState.mastery < 60;
      }),
      urgency: 'high',
      priorityScore: 50,
      reason: `Direct requirement for ${selectedRole.title}. Target is ${targetMastery}%.`,
    };
  }, [whySkillId, recommendations, skillStates, selectedRole]);

  // Handler: Diagnostic Assessment completed
  const handleCompleteAssessment = (
    assessment: Assessment,
    answers: Record<string, number>,
    newEvidenceList: Evidence[]
  ) => {
    let correctCount = 0;
    const skillBreakdown: Record<string, { correct: number; total: number; percentage: number }> = {};
    assessment.questions.forEach((q) => {
      if (!skillBreakdown[q.skillId]) {
        skillBreakdown[q.skillId] = { correct: 0, total: 0, percentage: 0 };
      }
      skillBreakdown[q.skillId].total += 1;
      if (answers[q.id] === q.correctIndex) {
        correctCount += 1;
        skillBreakdown[q.skillId].correct += 1;
      }
    });

    Object.keys(skillBreakdown).forEach((sId) => {
      const d = skillBreakdown[sId];
      d.percentage = Math.round((d.correct / d.total) * 100);
    });

    const record = {
      id: `rec-${Date.now()}`,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      date: new Date().toISOString(),
      score: Math.round((correctCount / assessment.questions.length) * 100),
      correctCount,
      totalQuestions: assessment.questions.length,
      skillBreakdown,
    };

    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === currentStudent.id) {
          return {
            ...st,
            completedAssessments: [record, ...(st.completedAssessments || [])],
            evidence: [...newEvidenceList, ...st.evidence],
          };
        }
        return st;
      })
    );
  };

  // Handler: Add new evidence record
  const handleAddEvidence = (evData: Omit<Evidence, 'id'>) => {
    const newEv: Evidence = {
      ...evData,
      id: `ev-manual-${Date.now()}`,
    };

    setStudents((prev) =>
      prev.map((st) => {
        if (st.id === currentStudent.id) {
          return {
            ...st,
            evidence: [newEv, ...st.evidence],
          };
        }
        return st;
      })
    );
  };

  const handleOpenAssessment = (skillId?: string) => {
    setAssessmentSkillTarget(skillId || null);
    setCurrentTab('assessments');
  };

  const handleOpenAddEvidence = (skillId?: string) => {
    setQuickAddSkillId(skillId || null);
    setCurrentTab('evidence');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 3-Zone Clean Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedRole={selectedRole}
        setSelectedRole={handleSelectRole}
        currentStudent={currentStudent}
        students={students}
        onSelectStudent={handleSelectStudent}
        theme={theme}
        setTheme={setTheme}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            currentStudent={currentStudent}
            selectedRole={selectedRole}
            skillStates={skillStates}
            roleReport={roleReport}
            recommendations={recommendations}
            onOpenWhy={(skillId) => setWhySkillId(skillId)}
            onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
            onTakeAssessment={handleOpenAssessment}
            onAddEvidence={handleOpenAddEvidence}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'graph' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Interactive Computational SkillGraph
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  DAG representation of 24 CSE competencies, prerequisite flows, and mastery levels.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
                >
                  Consult AI Advisor
                </button>
              </div>
            </div>

            <SkillGraphCanvas
              skillStates={skillStates}
              selectedRole={selectedRole}
              selectedSkillId={selectedSkillId}
              onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
            />
          </div>
        )}

        {currentTab === 'assessments' && (
          <DiagnosticAssessment
            onCompleteAssessment={handleCompleteAssessment}
            skillStates={skillStates}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            initialSkillFilter={assessmentSkillTarget}
          />
        )}

        {currentTab === 'gaps' && (
          <SkillGapAnalysis
            selectedRole={selectedRole}
            onSelectRole={handleSelectRole}
            roleReport={roleReport}
            recommendations={recommendations}
            skillStates={skillStates}
            onOpenWhy={(skillId) => setWhySkillId(skillId)}
            onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
            onTakeAssessment={handleOpenAssessment}
          />
        )}

        {currentTab === 'plan' && (
          <PersonalizedLearningPlan
            currentStudent={currentStudent}
            selectedRole={selectedRole}
            roleReport={roleReport}
            recommendations={recommendations}
            skillStates={skillStates}
            onTakeAssessment={handleOpenAssessment}
            onAddEvidence={handleOpenAddEvidence}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceManager
            currentStudent={currentStudent}
            skillStates={skillStates}
            onAddEvidence={handleAddEvidence}
            onSelectSkill={(skillId) => setSelectedSkillId(skillId)}
            initialSkillId={quickAddSkillId}
            autoOpenModal={!!quickAddSkillId}
          />
        )}
      </main>

      {/* Skill Detail Inspection Drawer */}
      {selectedSkillId && (
        <SkillDetailDrawer
          skillId={selectedSkillId}
          skillState={skillStates.get(selectedSkillId)}
          allSkillStates={skillStates}
          selectedRole={selectedRole}
          allEvidence={currentStudent.evidence}
          onClose={() => setSelectedSkillId(null)}
          onOpenWhy={(sId) => {
            setSelectedSkillId(null);
            setWhySkillId(sId);
          }}
          onAddEvidence={(sId) => {
            setSelectedSkillId(null);
            handleOpenAddEvidence(sId);
          }}
          onSelectSkill={(sId) => setSelectedSkillId(sId)}
          onTakeAssessment={(sId) => {
            setSelectedSkillId(null);
            handleOpenAssessment(sId);
          }}
        />
      )}

      {/* "Why?" Explanation Modal with Gemma Reasoning */}
      {whyRecommendation && (
        <WhyExplanationModal
          recommendation={whyRecommendation}
          selectedRole={selectedRole}
          skillState={skillStates.get(whyRecommendation.skillId)}
          allSkillStates={skillStates}
          onClose={() => setWhySkillId(null)}
          onTakeAssessment={handleOpenAssessment}
          onOpenSkillDetails={(sId) => setSelectedSkillId(sId)}
        />
      )}

      {/* AI Grounded Chat Modal */}
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentStudent={currentStudent}
        selectedRole={selectedRole}
        roleReport={roleReport}
        skillStates={skillStates}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">SkillGraph AI</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic Engineering Skill Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Active Student: {currentStudent.name}</span>
            <span aria-hidden="true">·</span>
            <span>Gemma Reasoning Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
