import React from 'react';
import { TargetRole, StudentProfile } from '../types';
import { TARGET_ROLES } from '../data/rolesData';
import {
  Compass,
  Cpu,
  Layers,
  FileCheck2,
  TrendingUp,
  CalendarCheck,
  FolderGit2,
  MessageSquare,
  Sun,
  Moon,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedRole: TargetRole;
  setSelectedRole: (role: TargetRole) => void;
  currentStudent: StudentProfile;
  students: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedRole,
  setSelectedRole,
  currentStudent,
  students,
  onSelectStudent,
  theme,
  setTheme,
  onOpenChat,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'graph', label: 'Skill Graph', icon: Layers },
    { id: 'assessments', label: 'Diagnostic Tests', icon: FileCheck2 },
    { id: 'gaps', label: 'Gap Analysis', icon: TrendingUp },
    { id: 'plan', label: 'Learning Plan', icon: CalendarCheck },
    { id: 'evidence', label: 'Evidence Log', icon: FolderGit2 },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar Contract: 3 zones */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-mono font-bold shadow-sm shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-none">
                  SkillGraph AI
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                  Engineering Skill Intelligence
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Target Role Selector */}
            <div className="hidden sm:flex items-center text-xs">
              <label htmlFor="role-select" className="sr-only">Target Role</label>
              <select
                id="role-select"
                value={selectedRole.id}
                onChange={(e) => {
                  const r = TARGET_ROLES.find((x) => x.id === e.target.value);
                  if (r) setSelectedRole(r);
                }}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {TARGET_ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    Target: {role.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Switcher */}
            <div className="flex items-center">
              <label htmlFor="student-select" className="sr-only">Student Profile</label>
              <div className="relative flex items-center">
                <select
                  id="student-select"
                  value={currentStudent.id}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    if (st) onSelectStudent(st);
                  }}
                  className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md pl-2 pr-6 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.university})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AI Advisor Trigger */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
              title="Open AI SkillGraph Advisor"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Advisor</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 py-2 overflow-x-auto no-scrollbar border-t border-slate-200 dark:border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
