import React, { useState, useMemo, useRef } from 'react';
import { Skill, SkillCategory, SkillState, TargetRole } from '../types';
import { INITIAL_SKILLS, SKILL_MAP } from '../data/skillsData';
import { computeGraphLayout } from '../utils/skillCalculations';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Info,
} from 'lucide-react';

interface SkillGraphCanvasProps {
  skillStates: Map<string, SkillState>;
  selectedRole: TargetRole;
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string) => void;
}

export const SkillGraphCanvas: React.FC<SkillGraphCanvasProps> = ({
  skillStates,
  selectedRole,
  selectedSkillId,
  onSelectSkill,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [hoveredSkillId, setHoveredSkillId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Compute node positions
  const nodePositions = useMemo(() => computeGraphLayout(INITIAL_SKILLS), []);

  // Compute edges
  const edges = useMemo(() => {
    const list: Array<{ from: string; to: string }> = [];
    INITIAL_SKILLS.forEach((skill) => {
      skill.prerequisites.forEach((pId) => {
        list.push({ from: pId, to: skill.id });
      });
    });
    return list;
  }, []);

  // Active highlighted skill (either clicked or hovered)
  const activeSkillId = hoveredSkillId || selectedSkillId;
  const activeSkill = activeSkillId ? SKILL_MAP.get(activeSkillId) : null;

  // Prerequisite and dependent sets for highlighting
  const activePrereqs = useMemo(() => {
    return new Set(activeSkill?.prerequisites || []);
  }, [activeSkill]);

  const activeDependents = useMemo(() => {
    return new Set(activeSkill?.dependentSkills || []);
  }, [activeSkill]);

  // Categories list
  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Clusters (24)' },
    { id: 'Programming Languages', label: 'Languages' },
    { id: 'Core CS & DSA', label: 'Core CS & DSA' },
    { id: 'Systems & Engineering', label: 'Systems & Tools' },
    { id: 'Web & Architecture', label: 'Web & Architecture' },
  ];

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof SVGElement && e.target.closest('[data-node="true"]')) {
      return; // Don't drag when clicking a node
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile and tablet support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.target instanceof SVGElement && e.target.closest('[data-node="true"]')) {
      return;
    }
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-[680px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden select-none flex flex-col">
      {/* Top Filter and Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Category Pills (Interactive buttons per frontend-design) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg pointer-events-auto shadow-lg overflow-x-auto max-w-full">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                categoryFilter === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search & Zoom Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-slate-950/90 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-lg"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full cursor-grab active:cursor-grabbing overflow-hidden`}
      >
        <svg
          className="w-full h-full min-w-[1100px] min-h-[640px]"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            {/* Standard edge marker */}
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Highlighted inbound prereq arrow */}
            <marker
              id="arrow-prereq"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
            </marker>

            {/* Highlighted outbound dependent arrow */}
            <marker
              id="arrow-dependent"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>

            {/* Grid background */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.75"
                strokeOpacity="0.4"
              />
            </pattern>
          </defs>

          {/* Grid background rect */}
          <rect width="2000" height="1200" fill="url(#grid)" />

          {/* Render directed prerequisite edges */}
          <g className="edges">
            {edges.map(({ from, to }) => {
              const startPos = nodePositions.get(from);
              const endPos = nodePositions.get(to);
              if (!startPos || !endPos) return null;

              const isPrereqHighlight = activeSkillId === to && activePrereqs.has(from);
              const isDependentHighlight = activeSkillId === from && activeDependents.has(to);

              const strokeColor = isPrereqHighlight
                ? '#6366f1'
                : isDependentHighlight
                ? '#10b981'
                : '#334155';

              const strokeWidth = isPrereqHighlight || isDependentHighlight ? 2.5 : 1.2;
              const markerEnd = isPrereqHighlight
                ? 'url(#arrow-prereq)'
                : isDependentHighlight
                ? 'url(#arrow-dependent)'
                : 'url(#arrow-default)';

              // Node dimensions
              const nodeWidth = 120;
              const nodeHeight = 54;

              const x1 = startPos.x + nodeWidth;
              const y1 = startPos.y + nodeHeight / 2;
              const x2 = endPos.x;
              const y2 = endPos.y + nodeHeight / 2;

              // Cubic bezier control points for smooth horizontal flow
              const dx = Math.abs(x2 - x1) * 0.5;
              const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              return (
                <path
                  key={`${from}->${to}`}
                  d={pathData}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isPrereqHighlight || isDependentHighlight ? 'none' : 'none'}
                  markerEnd={markerEnd}
                  opacity={
                    activeSkillId
                      ? isPrereqHighlight || isDependentHighlight
                        ? 1
                        : 0.2
                      : 0.7
                  }
                  className="transition-all duration-200"
                />
              );
            })}
          </g>

          {/* Render nodes */}
          <g className="nodes">
            {INITIAL_SKILLS.map((skill) => {
              const pos = nodePositions.get(skill.id);
              if (!pos) return null;

              const state = skillStates.get(skill.id);
              const mastery = state?.mastery ?? 0;
              const confidence = state?.confidence ?? 0;
              const isUnlocked = state?.isUnlocked ?? true;

              // Filter matching
              const matchesSearch =
                !searchQuery ||
                skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.category.toLowerCase().includes(searchQuery.toLowerCase());

              const matchesCategory =
                categoryFilter === 'all' || skill.category === categoryFilter;

              const isDimmed = !matchesSearch || !matchesCategory;

              // Role relevance
              const isRequired = selectedRole.requiredSkills.some((r) => r.skillId === skill.id);

              // Selection / hover status
              const isSelected = selectedSkillId === skill.id;
              const isHovered = hoveredSkillId === skill.id;
              const isPrereqOfActive = activePrereqs.has(skill.id);
              const isDependentOfActive = activeDependents.has(skill.id);

              const nodeWidth = 120;
              const nodeHeight = 54;

              // Color determination
              let statusBorder = '#334155';
              let statusBadge = '#64748b';
              if (mastery >= 75) {
                statusBorder = '#10b981';
                statusBadge = '#10b981';
              } else if (mastery >= 40) {
                statusBorder = '#6366f1';
                statusBadge = '#6366f1';
              } else if (isRequired) {
                statusBorder = '#f59e0b';
                statusBadge = '#f59e0b';
              }

              if (isSelected) {
                statusBorder = '#38bdf8';
              } else if (isPrereqOfActive) {
                statusBorder = '#818cf8';
              } else if (isDependentOfActive) {
                statusBorder = '#34d399';
              }

              return (
                <g
                  key={skill.id}
                  data-node="true"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSkill(skill.id);
                  }}
                  onMouseEnter={() => setHoveredSkillId(skill.id)}
                  onMouseLeave={() => setHoveredSkillId(null)}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{
                    opacity: isDimmed ? 0.25 : 1,
                  }}
                >
                  {/* Card Background */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="8"
                    ry="8"
                    fill={isSelected ? '#0f172a' : '#1e293b'}
                    stroke={statusBorder}
                    strokeWidth={isSelected || isHovered ? 2.5 : 1.2}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
                  />

                  {/* Top status line */}
                  <line
                    x1="8"
                    y1="4"
                    x2={nodeWidth - 8}
                    y2="4"
                    stroke={statusBadge}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity={mastery > 0 ? 0.9 : 0.2}
                  />

                  {/* Skill Name */}
                  <text
                    x="12"
                    y="24"
                    fill="#f8fafc"
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                    className="select-none"
                  >
                    {skill.name.length > 13 ? skill.name.slice(0, 12) + '…' : skill.name}
                  </text>

                  {/* Mastery % and Confidence % */}
                  <text
                    x="12"
                    y="42"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    className="select-none"
                  >
                    {mastery}% <tspan fill="#64748b">({confidence}% conf)</tspan>
                  </text>

                  {/* Lock icon if not unlocked */}
                  {!isUnlocked && (
                    <g transform={`translate(${nodeWidth - 22}, 14)`}>
                      <rect width="14" height="14" rx="3" fill="#334155" />
                      <circle cx="7" cy="5" r="2.5" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                      <rect x="4" y="6" width="6" height="5" rx="1" fill="#f1f5f9" />
                    </g>
                  )}

                  {/* Target role requirement indicator */}
                  {isRequired && isUnlocked && (
                    <circle
                      cx={nodeWidth - 14}
                      cy="18"
                      r="3.5"
                      fill={mastery >= 75 ? '#10b981' : '#f59e0b'}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Bottom Interactive Legend */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-lg pointer-events-auto text-[11px] text-slate-300 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Mastered (&ge;75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            <span>Developing (40-74%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Role Gap (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
            <span>Foundational</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Click any node to inspect evidence, formulas & drills</span>
          </div>
        </div>
      </div>
    </div>
  );
};
