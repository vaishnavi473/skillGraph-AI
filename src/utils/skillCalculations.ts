import {
  EVIDENCE_WEIGHTS,
  Evidence,
  EvidenceType,
  Recommendation,
  RoleCoverageReport,
  Skill,
  SkillState,
  TargetRole,
} from '../types';
import { INITIAL_SKILLS, SKILL_MAP } from '../data/skillsData';

/**
 * Deterministic mastery calculation strictly adhering to:
 * Quiz: 25%, Coding: 25%, Projects: 20%, Interview: 15%, Practice: 10%, Self Assessment: 5%
 * Each verified evidence category contributes its exact weighted points to the 100% mastery scale.
 */
export function calculateSkillState(
  skillId: string,
  allEvidence: Evidence[],
  allSkillsMap: Map<string, Skill> = SKILL_MAP
): SkillState {
  const skill = allSkillsMap.get(skillId);
  const skillEvidence = allEvidence.filter((e) => e.skillId === skillId);

  if (skillEvidence.length === 0) {
    return {
      skillId,
      mastery: 0,
      confidence: 0,
      evidenceCount: 0,
      categoryBreakdown: {},
      prereqReadiness: 0,
      isUnlocked: (skill?.prerequisites.length ?? 0) === 0,
      recentTrend: 'needs-practice',
    };
  }

  // Group evidence by category
  const grouped: Partial<Record<EvidenceType, { total: number; count: number }>> = {};
  for (const ev of skillEvidence) {
    if (!grouped[ev.type]) {
      grouped[ev.type] = { total: 0, count: 0 };
    }
    grouped[ev.type]!.total += ev.score;
    grouped[ev.type]!.count += 1;
  }

  const categoryBreakdown: Partial<
    Record<EvidenceType, { averageScore: number; count: number; weight: number }>
  > = {};
  let weightedSum = 0;

  for (const [typeKey, weight] of Object.entries(EVIDENCE_WEIGHTS) as [EvidenceType, number][]) {
    const data = grouped[typeKey];
    if (data && data.count > 0) {
      const avg = Math.round(data.total / data.count);
      categoryBreakdown[typeKey] = {
        averageScore: avg,
        count: data.count,
        weight,
      };
      // Exact weighted contribution: average score in category * category weight
      weightedSum += avg * weight;
    }
  }

  // Cumulative weighted mastery score (0 - 100)
  const mastery = Math.min(100, Math.round(weightedSum));

  // Confidence calculation:
  // 1. Diversity of evidence types (up to 55%)
  const typesPresent = Object.keys(categoryBreakdown).length;
  const diversityPts = (typesPresent / 6) * 55;

  // 2. Volume of evidence (up to 35%)
  const volumePts = Math.min(35, skillEvidence.length * 7);

  // 3. Recency of evidence (up to 10%)
  const sortedByDate = [...skillEvidence].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const mostRecent = sortedByDate[0] ? new Date(sortedByDate[0].date).getTime() : 0;
  const daysDiff = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
  const recencyPts = daysDiff <= 30 ? 10 : daysDiff <= 60 ? 6 : daysDiff <= 90 ? 3 : 0;

  const confidence = Math.min(100, Math.round(diversityPts + volumePts + recencyPts));

  // Determine trend from last 2 evidence items if available
  let recentTrend: 'improving' | 'stable' | 'needs-practice' = 'stable';
  if (sortedByDate.length >= 2) {
    const latestScore = sortedByDate[0].score;
    const priorScore = sortedByDate[1].score;
    if (latestScore - priorScore >= 5) recentTrend = 'improving';
    else if (priorScore - latestScore >= 8) recentTrend = 'needs-practice';
  } else if (mastery < 40) {
    recentTrend = 'needs-practice';
  }

  return {
    skillId,
    mastery,
    confidence,
    evidenceCount: skillEvidence.length,
    categoryBreakdown,
    prereqReadiness: 0, // Populated in batch calculation
    isUnlocked: true,
    recentTrend,
    lastPracticedDate: sortedByDate[0]?.date,
  };
}

/**
 * Calculates full graph state including prerequisite readiness and unlocked status
 */
export function calculateAllSkillStates(
  allEvidence: Evidence[],
  skills: Skill[] = INITIAL_SKILLS
): Map<string, SkillState> {
  const skillMap = new Map<string, Skill>(skills.map((s) => [s.id, s]));
  const stateMap = new Map<string, SkillState>();

  // Pass 1: raw mastery and confidence
  for (const skill of skills) {
    const state = calculateSkillState(skill.id, allEvidence, skillMap);
    stateMap.set(skill.id, state);
  }

  // Pass 2: prerequisite readiness
  for (const skill of skills) {
    const state = stateMap.get(skill.id)!;
    if (skill.prerequisites.length === 0) {
      state.prereqReadiness = 100;
      state.isUnlocked = true;
    } else {
      let prereqSum = 0;
      let allPrereqsMet = true;
      for (const pId of skill.prerequisites) {
        const pState = stateMap.get(pId);
        const pMastery = pState ? pState.mastery : 0;
        prereqSum += pMastery;
        if (pMastery < 60) {
          allPrereqsMet = false;
        }
      }
      state.prereqReadiness = Math.round(prereqSum / skill.prerequisites.length);
      state.isUnlocked = allPrereqsMet || state.prereqReadiness >= 65;
    }
  }

  return stateMap;
}

/**
 * Deterministic Role Skill Coverage calculation
 */
export function calculateRoleCoverage(
  role: TargetRole,
  skillStates: Map<string, SkillState>
): RoleCoverageReport {
  let totalWeightedTarget = 0;
  let totalWeightedAchieved = 0;
  let metCount = 0;
  let criticalGapsCount = 0;

  const gaps: RoleCoverageReport['skillGaps'] = [];

  for (const req of role.requiredSkills) {
    const state = skillStates.get(req.skillId);
    const skill = SKILL_MAP.get(req.skillId);
    const current = state ? state.mastery : 0;
    const target = req.targetMastery;
    const gap = Math.max(0, target - current);

    const weightMultiplier =
      req.importance === 'critical' ? 3.0 : req.importance === 'important' ? 2.0 : 1.0;

    totalWeightedTarget += target * weightMultiplier;
    totalWeightedAchieved += Math.min(target, current) * weightMultiplier;

    if (current >= target) {
      metCount++;
    } else if (req.importance === 'critical' && (gap >= 30 || current < 50)) {
      criticalGapsCount++;
    }

    gaps.push({
      skillId: req.skillId,
      skillName: skill?.name || req.skillId,
      currentMastery: current,
      targetMastery: target,
      gap,
      importance: req.importance,
      isUnlocked: state?.isUnlocked ?? true,
    });
  }

  const overallCoverage =
    totalWeightedTarget > 0 ? Math.min(100, Math.round((totalWeightedAchieved / totalWeightedTarget) * 100)) : 0;

  return {
    overallCoverage,
    metSkillsCount: metCount,
    totalRequired: role.requiredSkills.length,
    criticalGapsCount,
    skillGaps: gaps.sort((a, b) => b.gap - a.gap),
  };
}

/**
 * Deterministic "What should I learn next?" recommendation engine
 */
export function getRecommendedNextSkills(
  role: TargetRole,
  skillStates: Map<string, SkillState>,
  limit: number = 3
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const req of role.requiredSkills) {
    const skill = SKILL_MAP.get(req.skillId);
    if (!skill) continue;
    const state = skillStates.get(req.skillId);
    const current = state ? state.mastery : 0;
    const gap = Math.max(0, req.targetMastery - current);

    if (gap <= 0) continue; // Already met

    const missingPrereqs: string[] = [];
    for (const pId of skill.prerequisites) {
      const pState = skillStates.get(pId);
      if (!pState || pState.mastery < 60) {
        const pSkill = SKILL_MAP.get(pId);
        missingPrereqs.push(pSkill?.name || pId);
      }
    }

    const prereqReadiness = state?.prereqReadiness ?? 100;
    const isUnlocked = state?.isUnlocked ?? true;

    const importanceMultiplier =
      req.importance === 'critical' ? 3.0 : req.importance === 'important' ? 2.0 : 1.0;

    // Ready skills receive priority multiplier; locked skills are penalized until prerequisites are cleared
    const readinessMultiplier = isUnlocked ? 1.0 + prereqReadiness / 200 : 0.35;
    const priorityScore = gap * importanceMultiplier * readinessMultiplier;

    let urgency: 'critical' | 'high' | 'medium' = 'medium';
    if (req.importance === 'critical' && gap >= 25) urgency = 'critical';
    else if (gap >= 20 || req.importance === 'critical') urgency = 'high';

    let reason = '';
    if (!isUnlocked && missingPrereqs.length > 0) {
      reason = `Blocked by prerequisites: ${missingPrereqs.join(', ')}. Strengthen those first.`;
    } else if (gap >= 35) {
      reason = `Significant role gap (${gap}% deficit) in a ${req.importance} core competency.`;
    } else {
      reason = `High-leverage step: prerequisites satisfied (${prereqReadiness}%) and directly elevates role readiness.`;
    }

    recommendations.push({
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      currentMastery: current,
      targetMastery: req.targetMastery,
      gap,
      prereqReadiness,
      isUnlocked,
      missingPrereqs,
      urgency,
      priorityScore,
      reason,
    });
  }

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, limit);
}

/**
 * Layout engine for visual DAG representation of SkillGraph
 */
export interface GraphNodePosition {
  skillId: string;
  x: number;
  y: number;
  column: number;
  row: number;
}

export function computeGraphLayout(skills: Skill[] = INITIAL_SKILLS): Map<string, GraphNodePosition> {
  const columns: string[][] = [
    ['python', 'cpp', 'javascript', 'git', 'linux', 'sql'],
    ['oop', 'databases', 'testing', 'nodejs'],
    ['data-structures', 'rest-apis', 'react'],
    ['arrays', 'recursion'],
    ['linked-lists', 'stacks', 'queues', 'searching', 'sorting'],
    ['trees', 'graphs', 'dynamic-programming'],
    ['system-design'],
  ];

  const positions = new Map<string, GraphNodePosition>();
  const colSpacing = 145;
  const startX = 35;
  const startY = 45;

  columns.forEach((colSkills, colIndex) => {
    const totalInCol = colSkills.length;
    const rowSpacing = Math.max(88, 540 / Math.max(1, totalInCol));
    const colOffsetY = (560 - totalInCol * rowSpacing) / 2;

    colSkills.forEach((skillId, rowIndex) => {
      positions.set(skillId, {
        skillId,
        x: startX + colIndex * colSpacing,
        y: Math.max(startY, startY + colOffsetY + rowIndex * rowSpacing),
        column: colIndex,
        row: rowIndex,
      });
    });
  });

  return positions;
}
