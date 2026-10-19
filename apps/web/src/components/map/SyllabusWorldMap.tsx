'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Lock,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  ChevronRight,
  Flame,
  X,
  Compass,
} from 'lucide-react';
import { CompanionAvatar } from '../assets/CompanionAvatar';
import { GameButton } from '../ui/GameButton';
import { soundManager } from '../../lib/sound-manager';

export interface SyllabusNode {
  id: string;
  week: number;
  title: string;
  course: string;
  description: string;
  status: 'COMPLETED' | 'UNLOCKED' | 'LOCKED';
  isBoss?: boolean;
  x: number; // percentage on map X
  y: number; // percentage on map Y
  quests: { title: string; xp: number; done: boolean }[];
}

export function SyllabusWorldMap() {
  const [selectedNode, setSelectedNode] = useState<SyllabusNode | null>(null);

  const nodes: SyllabusNode[] = [
    {
      id: 'node_1',
      week: 1,
      title: 'Arrays & Sliding Windows',
      course: 'CS201 Data Structures',
      description: 'In-place two-pointer partitioning and sub-array sliding windows.',
      status: 'COMPLETED',
      x: 20,
      y: 12,
      quests: [
        { title: 'Solve 3 Two-Pointer challenges', xp: 30, done: true },
        { title: 'Achieve 100% on Array Micro-Quiz', xp: 20, done: true },
      ],
    },
    {
      id: 'node_2',
      week: 2,
      title: 'Linked Lists & Cycles',
      course: 'CS201 Data Structures',
      description: 'Cycle detection, list reversal, and middle pointer determination.',
      status: 'COMPLETED',
      x: 75,
      y: 28,
      quests: [
        { title: 'Detect cycle with Floyd algorithm', xp: 25, done: true },
        { title: 'Defeat List Gremlin in revenge round', xp: 15, done: true },
      ],
    },
    {
      id: 'node_3',
      week: 3,
      title: 'Stacks & Monotonic Deques',
      course: 'CS201 Data Structures',
      description: 'LIFO evaluation, parentheses validation, and next greater element.',
      status: 'COMPLETED',
      x: 28,
      y: 46,
      quests: [
        { title: 'Build Monotonic Stack', xp: 35, done: true },
        { title: 'Pass Week 3 assessment test', xp: 40, done: true },
      ],
    },
    {
      id: 'node_4',
      week: 4,
      title: 'Recursion & Backtracking',
      course: 'CS201 Data Structures',
      description: 'Call-stack recursion trees, base cases, permutations and subsets.',
      status: 'UNLOCKED', // Active current node
      x: 70,
      y: 64,
      quests: [
        { title: 'Solve N-Queens or Subsets puzzle', xp: 50, done: false },
        { title: 'Score ≥80% on Recursion micro-quiz', xp: 25, done: true },
      ],
    },
    {
      id: 'node_5',
      week: 5,
      title: 'Binary Trees & Traversals',
      course: 'CS201 Data Structures',
      description: 'DFS/BFS traversals, height calculation, and lowest common ancestor.',
      status: 'LOCKED',
      x: 35,
      y: 82,
      quests: [
        { title: 'Traverse 10 binary tree structures', xp: 40, done: false },
        { title: 'Master Level-Order BFS traversal', xp: 30, done: false },
      ],
    },
    {
      id: 'node_6',
      week: 6,
      title: 'The Archon of Trees (Mid-Term Boss)',
      course: 'CS201 Data Structures',
      description: 'Comprehensive timed revision challenge testing all prior tree structures.',
      status: 'LOCKED',
      isBoss: true,
      x: 72,
      y: 94,
      quests: [
        { title: 'Defeat Mid-Term Course Boss in live raid', xp: 150, done: false },
      ],
    },
  ];

  const handleNodeClick = (node: SyllabusNode) => {
    soundManager.play('tap');
    setSelectedNode(node);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 panel-quest-board p-5 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFD23F] text-[#24104F] border-2 border-white flex items-center justify-center shadow-md">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl text-white text-stroke-sm">
              Syllabus World Map
            </h2>
            <p className="text-xs text-[#FFF8E7]">
              CS201 Data Structures • Semester 2026 Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#15062C]/80 px-3.5 py-2 rounded-2xl border border-white/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7CF36B]" />
            <span className="text-slate-300">Cleared (3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFD23F] animate-ping" />
            <span className="text-[#FFD23F] font-bold">Active: Week 4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-400">Locked (2)</span>
          </div>
        </div>
      </div>

      {/* Illustrated Canvas / World Map Container */}
      <div className="relative w-full rounded-3xl bg-gradient-to-b from-[#1C0B40] via-[#321366] to-[#15062C] border-2 border-white/20 overflow-hidden shadow-2xl min-h-[580px]">
        {/* Atmospheric Celestial Stars */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-white animate-star-twinkle" />
          <div className="absolute top-36 left-1/3 w-2 h-2 rounded-full bg-[#22E3FF] animate-star-twinkle" />
          <div className="absolute top-64 right-1/4 w-2.5 h-2.5 rounded-full bg-[#FFD23F] animate-star-twinkle" />
          <div className="absolute bottom-28 left-20 w-1.5 h-1.5 rounded-full bg-[#FF3D9A]" />
        </div>

        {/* SVG Path Connecting Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Path Shadows */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64 Q 50 74 35 82 Q 55 88 72 94"
            fill="none"
            stroke="#0F041F"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Glowing Winding Study Path */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64 Q 50 74 35 82 Q 55 88 72 94"
            fill="none"
            stroke="#5B2EE0"
            strokeWidth="2.5"
            strokeDasharray="2,2"
            strokeLinecap="round"
          />
          {/* Active cleared path glow up to Week 4 */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64"
            fill="none"
            stroke="#FFD23F"
            strokeWidth="2"
            strokeOpacity="0.9"
            strokeLinecap="round"
          />
        </svg>

        {/* Fog of War on Bottom Locked Nodes (Weeks 5-6) */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#15062C] via-[#24104F]/90 to-transparent pointer-events-none z-10 flex items-end justify-center pb-5">
          <div className="text-center bg-[#24104F]/90 backdrop-blur-md px-5 py-2.5 rounded-2xl border-2 border-[#22E3FF]/30 shadow-xl">
            <span className="text-xs text-[#22E3FF] font-display flex items-center gap-2 justify-center">
              <Lock className="w-4 h-4" />
              <span>Syllabus mist lifts upon completing Week 4 mastery</span>
            </span>
          </div>
        </div>

        {/* Interactive Waypoint Nodes */}
        {nodes.map(node => {
          const isCompleted = node.status === 'COMPLETED';
          const isUnlocked = node.status === 'UNLOCKED';
          const isLocked = node.status === 'LOCKED';

          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              <button
                onClick={() => handleNodeClick(node)}
                className="group relative flex flex-col items-center focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                {/* Node Beacon Circle */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 shadow-xl transition-all duration-300 ${
                    node.isBoss
                      ? 'bg-gradient-to-tr from-[#FF3D9A] to-[#5B2EE0] border-[#FFD23F] animate-pulse shadow-glow-magenta'
                      : isCompleted
                      ? 'bg-[#7CF36B] border-white text-[#24104F] shadow-glow-lime'
                      : isUnlocked
                      ? 'bg-[#FFD23F] border-white text-[#24104F] shadow-glow-yellow animate-bounce'
                      : 'bg-[#1C0B40] border-white/20 text-slate-500 opacity-60'
                  }`}
                >
                  {node.isBoss ? (
                    <Award className="w-8 h-8 text-white drop-shadow" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                  ) : isUnlocked ? (
                    <Sparkles className="w-8 h-8 fill-current stroke-none" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                {/* Companion Walking next to Active Unlocked Node */}
                {isUnlocked && (
                  <div className="absolute -top-12 -right-9 pointer-events-none animate-wiggle">
                    <CompanionAvatar species="fox" mood="cheering" size={46} />
                  </div>
                )}

                {/* Node Pill Tag */}
                <div
                  className={`mt-2 px-3 py-1 rounded-xl text-xs font-display whitespace-nowrap border-2 shadow-lg ${
                    isUnlocked
                      ? 'bg-[#FFD23F] text-[#24104F] border-white'
                      : isCompleted
                      ? 'bg-[#24104F] text-[#7CF36B] border-[#7CF36B]/60'
                      : 'bg-[#15062C] text-slate-400 border-white/10'
                  }`}
                >
                  Week {node.week}: {node.title.split(' ')[0]}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Node Detail Inspection Modal / Drawer */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 bg-[#15062C]/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="panel-quest-board max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#FFD23F] uppercase tracking-wider font-display">
                  Week {selectedNode.week} • {selectedNode.course}
                </span>
                <h3 className="text-xl font-display text-white mt-0.5">
                  {selectedNode.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#FFF8E7] leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Quests Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-display uppercase text-[#22E3FF] tracking-wider">
                Weekly Mastery Challenges
              </h4>
              <div className="space-y-2">
                {selectedNode.quests.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#15062C]/80 border border-white/15"
                  >
                    <div className="flex items-center gap-2.5 text-xs text-white">
                      {q.done ? (
                        <CheckCircle2 className="w-4 h-4 text-[#7CF36B]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-500" />
                      )}
                      <span className={q.done ? 'line-through text-slate-400' : ''}>
                        {q.title}
                      </span>
                    </div>
                    <span className="font-display text-xs text-[#FFD23F]">
                      +{q.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {selectedNode.status === 'LOCKED' ? (
                <div className="p-3.5 rounded-2xl bg-white/5 text-center text-xs text-slate-400 border border-white/10">
                  Locked until previous weeks are cleared
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedNode(null);
                    soundManager.play('tap');
                  }}
                  className="w-full py-3.5 rounded-2xl btn-sunset-3d btn-3d-yellow text-sm font-display flex items-center justify-center gap-2"
                >
                  <span>{selectedNode.status === 'COMPLETED' ? 'Review cleared topic' : 'Start week 4 quest'}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
