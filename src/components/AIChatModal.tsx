import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, RoleCoverageReport, SkillState, StudentProfile, TargetRole } from '../types';
import { SKILL_MAP } from '../data/skillsData';
import { sendGraphChatMessage } from '../utils/geminiClient';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentProfile;
  selectedRole: TargetRole;
  roleReport: RoleCoverageReport;
  skillStates: Map<string, SkillState>;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  selectedRole,
  roleReport,
  skillStates,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${currentStudent.name}! I am your SkillGraph AI Advisor. I have direct access to your verified evidence and deterministic skill graph for ${selectedRole.title}. Ask me anything about your prerequisite chain, gap analysis, or evidence portfolio.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  // Build factual snapshot for server reasoning
  const buildStudentSnapshot = () => {
    const strongSkills = Array.from(skillStates.entries())
      .filter(([_, s]) => s.mastery >= 75)
      .map(([id, s]) => `${SKILL_MAP.get(id)?.name || id} (${s.mastery}%)`);

    const criticalGaps = roleReport.skillGaps
      .filter((g) => g.gap >= 25 || g.importance === 'critical')
      .map((g) => `${g.skillName} (Current: ${g.currentMastery}%, Target: ${g.targetMastery}%)`);

    const recentEvidence = currentStudent.evidence.slice(0, 8).map((e) => ({
      skill: SKILL_MAP.get(e.skillId)?.name || e.skillId,
      type: e.type,
      title: e.title,
      score: e.score,
      source: e.source,
    }));

    return {
      name: currentStudent.name,
      university: currentStudent.university,
      year: currentStudent.year,
      targetRole: selectedRole.title,
      overallCoverage: roleReport.overallCoverage,
      metSkillsCount: roleReport.metSkillsCount,
      totalRequiredSkills: roleReport.totalRequired,
      strongSkills,
      criticalGaps,
      recentEvidence,
    };
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const reply = await sendGraphChatMessage(history, buildStudentSnapshot());

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the reasoning server. Your deterministic skill graph remains intact in the dashboard.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    'Why is Dynamic Programming locked for me?',
    'How can I raise my confidence in Trees to 80%?',
    'What project should I build to target Backend Engineer?',
    'Analyze my top 3 skill gaps and recommend next steps',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                SkillGraph Intelligence Advisor
              </h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Gemma Reasoning · Zero Hallucinations Policy
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* Grounding Reminder Banner */}
          <div className="p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>
              Connected to <strong>{currentStudent.name}</strong>'s live SkillGraph ({roleReport.overallCoverage}% coverage for {selectedRole.title}).
            </span>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-xl space-y-1 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700/60 leading-relaxed'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
                <span
                  className={`text-[10px] block text-right ${
                    m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                AI
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>Consulting SkillGraph dependency graph...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts & Input Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
          {/* Starter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about your skill tree, prerequisites or evidence..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
