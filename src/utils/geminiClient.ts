export interface ExplainWhyResponse {
  explanation: string;
  strategicValue: string;
  prereqAdvice: string;
  suggestedActions: string[];
}

export interface LearningPlanResponse {
  summary: string;
  weeklyPlan: Array<{
    week: number;
    focus: string;
    goal: string;
    deliverable: string;
  }>;
  tips: string[];
}

export interface PracticeQuestionResponse {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
}

export async function explainWhySkill(payload: {
  skillName: string;
  currentMastery: number;
  confidence: number;
  targetRole: string;
  roleTargetMastery: number;
  prerequisites: string[];
  dependentSkills: string[];
  evidenceCount: number;
  missingPrereqs: string[];
}): Promise<ExplainWhyResponse> {
  try {
    const res = await fetch('/api/gemini/explain-why', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local rule-based explanation:', err);
    return {
      explanation: `${payload.skillName} is a core requirement for ${payload.targetRole}. You are at ${payload.currentMastery}% mastery against the target of ${payload.roleTargetMastery}%. ${
        payload.missingPrereqs.length > 0
          ? `Clear prerequisites (${payload.missingPrereqs.join(', ')}) first.`
          : 'Prerequisites are fully satisfied for immediate learning acceleration.'
      }`,
      strategicValue: `Directly impacts your role readiness and unlocks downstream skills like ${payload.dependentSkills.slice(0, 3).join(', ') || 'advanced topics'}.`,
      prereqAdvice: payload.missingPrereqs.length > 0
        ? `Focus on: ${payload.missingPrereqs.join(', ')}.`
        : 'All prerequisites met.',
      suggestedActions: [
        `Complete a targeted diagnostic quiz for ${payload.skillName}`,
        `Implement a coding problem utilizing core patterns`,
        `Add project evidence demonstrating practical application`,
      ],
    };
  }
}

export async function fetchLearningPlan(payload: {
  studentName: string;
  targetRole: string;
  overallCoverage: number;
  topGaps: any[];
  readySkills: string[];
  recentEvidence: any[];
}): Promise<LearningPlanResponse> {
  try {
    const res = await fetch('/api/gemini/learning-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local learning roadmap:', err);
    return {
      summary: `Structured 4-week progression for ${payload.studentName} towards ${payload.targetRole}.`,
      weeklyPlan: [
        {
          week: 1,
          focus: payload.readySkills[0] || 'Prerequisite Foundations',
          goal: 'Solidify foundational prerequisites and eliminate immediate blockers.',
          deliverable: '1 diagnostic quiz + 2 coding problem submissions.',
        },
        {
          week: 2,
          focus: payload.topGaps[0]?.skillName || 'Primary Role Gap',
          goal: 'Master algorithmic patterns and implementation mechanics.',
          deliverable: 'Targeted code challenges and unit test cases.',
        },
        {
          week: 3,
          focus: payload.topGaps[1]?.skillName || 'Secondary Competency',
          goal: 'Integrate skill into real-world application components.',
          deliverable: 'GitHub project repository evidence upload.',
        },
        {
          week: 4,
          focus: 'Role Benchmark Verification',
          goal: 'Conduct comprehensive reassessment and mock technical interview.',
          deliverable: 'Benchmark assessment evaluation score.',
        },
      ],
      tips: [
        'Evidence diversity matters: combine quizzes, coding, and projects for high confidence.',
        'Always ensure prerequisite mastery is >= 60% before tackling advanced nodes.',
        'Review algorithmic time and space complexities during code implementation.',
      ],
    };
  }
}

export async function fetchPracticeQuestion(
  skillName: string,
  currentMastery: number
): Promise<PracticeQuestionResponse> {
  try {
    const res = await fetch('/api/gemini/practice-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillName, currentMastery }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local practice question:', err);
    return {
      question: `In the context of ${skillName}, which computational strategy provides optimal space and time tradeoffs?`,
      options: [
        'Iterative traversal with O(1) auxiliary space',
        'Unbounded recursive descent without memoization',
        'Exponential backtracking across all permutations',
        'Global state synchronization locks',
      ],
      correctIndex: 0,
      explanation: 'Iterative traversal with in-place pointer management avoids call-stack frame overhead and minimizes space complexity.',
      difficulty: currentMastery > 70 ? 'Hard' : currentMastery > 40 ? 'Medium' : 'Foundational',
    };
  }
}

export async function sendGraphChatMessage(
  messages: Array<{ sender: string; text: string }>,
  studentSnapshot: any
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, studentSnapshot }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.warn('Fallback chat response:', err);
    return `Based on your current SkillGraph, you have ${studentSnapshot?.overallCoverage || 0}% coverage for ${studentSnapshot?.targetRole}. Your strongest areas are ${studentSnapshot?.strongSkills?.slice(0, 3).join(', ') || 'foundations'}, while your most critical gaps are ${studentSnapshot?.criticalGaps?.join(', ') || 'advanced topics'}. How can I assist you in planning your next milestone?`;
  }
}
