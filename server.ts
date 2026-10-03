import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI client if GEMINI_API_KEY is available
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient Gemini generateContent helper
async function callGemini(contents: any, systemInstruction?: string, isJson: boolean = false) {
  if (!ai) return null;
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  
  for (const model of models) {
    try {
      const config: any = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (isJson) config.responseMimeType = 'application/json';

      const response = await ai.models.generateContent({
        model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} attempt failed:`, err?.status || err?.message);
    }
  }
  return null;
}

// 1. Explain "Why?" a skill is recommended
app.post('/api/gemini/explain-why', async (req, res) => {
  try {
    const {
      skillName,
      currentMastery,
      confidence,
      targetRole,
      roleTargetMastery,
      prerequisites,
      dependentSkills,
      evidenceCount,
      missingPrereqs,
    } = req.body;

    const fallbackResponse = {
      explanation: `Based on your goal of becoming a ${targetRole || 'Software Engineer'}, ${skillName} is a foundational pillar. You currently have a ${currentMastery}% mastery (${evidenceCount} evidence records verified) against the role threshold of ${roleTargetMastery}%. ${
        missingPrereqs && missingPrereqs.length > 0
          ? `Note: You should first strengthen ${missingPrereqs.join(', ')} to maximize your learning velocity.`
          : `All prerequisites are satisfied, making this the highest-leverage skill to unlock ${dependentSkills?.slice(0, 3).join(', ') || 'advanced topics'}.`
      }`,
      prereqAdvice: missingPrereqs && missingPrereqs.length > 0
        ? `Focus on clearing prerequisites: ${missingPrereqs.join(', ')}.`
        : 'Prerequisites are fully satisfied.',
      strategicValue: `Unlocks key competencies for ${targetRole || 'engineering roles'} and downstream skills like ${dependentSkills?.join(', ') || 'production architecture'}.`,
      suggestedActions: [
        `Review core concepts and time complexities of ${skillName}`,
        `Complete 3 medium-level coding challenges focusing on ${skillName}`,
        `Build a small project module incorporating ${skillName}`,
      ],
    };

    if (!ai) return res.json(fallbackResponse);

    const prompt = `You are the AI reasoning engine for SkillGraph AI, a personal skill intelligence platform for Computer Science and Engineering students.
IMPORTANT RULE: Never invent student evidence. Only reference the deterministic facts provided. If evidence is thin or missing, state that clearly.

STUDENT'S DETERMINISTIC DATA:
- Target Skill: ${skillName}
- Current Mastery: ${currentMastery}%
- Confidence: ${confidence}%
- Total Evidence Logged: ${evidenceCount} items
- Target Role: ${targetRole}
- Role Target Mastery: ${roleTargetMastery}%
- Skill Gap: ${Math.max(0, roleTargetMastery - currentMastery)}%
- Prerequisites: ${JSON.stringify(prerequisites || [])}
- Missing or Weak Prerequisites (<60%): ${JSON.stringify(missingPrereqs || [])}
- Downstream Dependent Skills: ${JSON.stringify(dependentSkills || [])}

TASK:
Provide an objective, highly structured explanation for WHY this skill is recommended next.
Include:
1. explanation: 2-3 sentences explaining the exact pedagogical and role-alignment reason.
2. strategicValue: 1-2 sentences on industry and curriculum leverage.
3. prereqAdvice: clear status of readiness.
4. suggestedActions: Array of 3 actionable, measurable next steps.

Format output as valid JSON matching this schema:
{
  "explanation": "...",
  "strategicValue": "...",
  "prereqAdvice": "...",
  "suggestedActions": ["...", "...", "..."]
}`;

    const text = await callGemini(prompt, undefined, true);
    if (!text) return res.json(fallbackResponse);

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json(fallbackResponse);
    }
  } catch (error: any) {
    console.error('Error generating Why explanation:', error);
    return res.status(500).json({
      error: 'Failed to generate explanation',
      explanation: 'Analysis completed using deterministic rule engine. Review prerequisites and role gap metrics in the panel.',
    });
  }
});

// 2. Personalized Learning Strategy
app.post('/api/gemini/learning-plan', async (req, res) => {
  try {
    const { studentName, targetRole, overallCoverage, topGaps, readySkills, recentEvidence } = req.body;

    const fallbackPlan = {
      summary: `Tailored roadmap for ${studentName} targeting ${targetRole}. Focuses on converting ${topGaps?.[0]?.skillName || 'core gaps'} into verified strengths.`,
      weeklyPlan: [
        {
          week: 1,
          focus: readySkills?.[0] || 'Core Prerequisites',
          goal: 'Close immediate foundational gaps with targeted drills and diagnostic assessments.',
          deliverable: '1 diagnostic quiz + 2 coding problem implementations with unit tests.',
        },
        {
          week: 2,
          focus: topGaps?.[0]?.skillName || 'Primary Role Gap',
          goal: 'Deep dive into algorithmic patterns and conceptual principles.',
          deliverable: 'Mini-project feature or GitHub repository evidence submission.',
        },
        {
          week: 3,
          focus: topGaps?.[1]?.skillName || 'Secondary Role Gap',
          goal: 'Integrate skills into full-stack or systems architecture practice.',
          deliverable: 'Mock interview self-assessment and code review.',
        },
        {
          week: 4,
          focus: 'Synthesis & System Integration',
          goal: 'Verify end-to-end competencies across the prerequisite chain.',
          deliverable: 'Comprehensive project evidence and benchmark re-assessment.',
        },
      ],
      tips: [
        'Log your project repositories to boost project evidence weight (20% of mastery score).',
        'Aim for at least 3 distinct evidence types per skill to elevate confidence beyond 80%.',
        'Ensure prerequisite skills stay above 70% before tackling advanced nodes.',
      ],
    };

    if (!ai) return res.json(fallbackPlan);

    const prompt = `You are SkillGraph AI's learning strategist for CSE students.
Never invent fake evidence. Use the student's factual skill state:

Student: ${studentName}
Target Role: ${targetRole}
Overall Role Coverage: ${overallCoverage}%
Top Skill Gaps: ${JSON.stringify(topGaps || [])}
Skills Ready to Learn (Prerequisites Met): ${JSON.stringify(readySkills || [])}
Recent Verified Evidence: ${JSON.stringify(recentEvidence || [])}

Create an actionable 4-week personalized learning strategy.
Format as JSON:
{
  "summary": "1-2 sentence high-level assessment and trajectory",
  "weeklyPlan": [
    { "week": 1, "focus": "skill name", "goal": "concrete objective", "deliverable": "measurable deliverable" },
    { "week": 2, "focus": "skill name", "goal": "concrete objective", "deliverable": "measurable deliverable" },
    { "week": 3, "focus": "skill name", "goal": "concrete objective", "deliverable": "measurable deliverable" },
    { "week": 4, "focus": "skill name", "goal": "concrete objective", "deliverable": "measurable deliverable" }
  ],
  "tips": ["actionable advice 1", "actionable advice 2", "actionable advice 3"]
}`;

    const text = await callGemini(prompt, undefined, true);
    if (!text) return res.json(fallbackPlan);

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json(fallbackPlan);
    }
  } catch (error: any) {
    console.error('Error in learning plan:', error);
    return res.status(500).json({ error: 'Failed to generate learning plan' });
  }
});

// 3. Dynamic Practice Question Generator
app.post('/api/gemini/practice-question', async (req, res) => {
  try {
    const { skillName, currentMastery } = req.body;

    const fallbackQuestion = {
      question: `Given a scenario in ${skillName}, what is the optimal approach to maintain time and space efficiency?`,
      options: [
        'Iterate linearly with O(n) auxiliary space cache',
        'Apply two-pointer traversal with O(1) auxiliary space',
        'Recursively divide and conquer without memoization',
        'Sort in-place using dual-pivot quicksort',
      ],
      correctIndex: 1,
      explanation: 'Two-pointer traversal achieves in-place execution with minimal space overhead for this class of problems.',
      difficulty: currentMastery > 70 ? 'Hard' : currentMastery > 40 ? 'Medium' : 'Easy',
    };

    if (!ai) return res.json(fallbackQuestion);

    const prompt = `Generate a high-quality CSE technical practice question for the skill: "${skillName}".
Current student mastery: ${currentMastery}% (${currentMastery > 70 ? 'Advanced' : currentMastery > 40 ? 'Intermediate' : 'Foundational'}).
Question must test real engineering knowledge (algorithms, complexity, syntax, API design, or debugging).

Format as JSON:
{
  "question": "Clear technical question with code snippet if applicable",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Clear explanation of why this answer is correct and others are flawed",
  "difficulty": "Easy" | "Medium" | "Hard"
}`;

    const text = await callGemini(prompt, undefined, true);
    if (!text) return res.json(fallbackQuestion);

    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json(fallbackQuestion);
    }
  } catch (error: any) {
    console.error('Error generating question:', error);
    return res.status(500).json({ error: 'Failed to generate practice question' });
  }
});

// 4. Chat with Student SkillGraph
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, studentSnapshot } = req.body;

    const fallbackReply = `I have analyzed your SkillGraph for ${studentSnapshot?.name || 'Student'} (${studentSnapshot?.targetRole || 'Software Engineer'}). Your overall role coverage is ${studentSnapshot?.overallCoverage || 0}%, with strongest competencies in ${studentSnapshot?.strongSkills?.slice(0, 3).join(', ') || 'foundations'} and immediate gaps in ${studentSnapshot?.criticalGaps?.slice(0, 2).join(', ') || 'advanced topics'}. How can I help you target your next milestone?`;

    if (!ai) return res.json({ reply: fallbackReply });

    const systemInstruction = `You are SkillGraph Assistant, an AI engineering advisor embedded into the SkillGraph AI platform.
You have direct, real-time access to the student's factual skill intelligence data:
${JSON.stringify(studentSnapshot, null, 2)}

STRICT RULES:
1. NEVER invent student evidence, test scores, or project achievements that are not in the snapshot.
2. If the student has zero or few evidence items for a skill, explicitly mention the lack of data and recommend logging evidence (quizzes, coding problems, projects, or interviews).
3. Base all advice on computer science pedagogical standards and prerequisite dependency logic.
4. Keep responses crisp, technical, encouraging, and actionable. Avoid robotic jargon or fake status tags. Use Markdown bullet points where helpful.`;

    const formattedContents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const text = await callGemini(formattedContents, systemInstruction, false);
    return res.json({ reply: text || fallbackReply });
  } catch (error: any) {
    console.error('Error in chat:', error);
    return res.status(500).json({
      reply: 'I encountered an issue processing your request. Please check your network or try again.',
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillGraph AI server running at http://localhost:${PORT}`);
  });
}

startServer();
