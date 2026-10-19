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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#2D2466] border border-[#3D3280] p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC83D]/20 border border-[#FFC83D]/40 flex items-center justify-center text-[#FFC83D]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white">Campus Realm Map</h2>
            <p className="text-xs text-slate-300">
              CS201 Data Structures • Semester 2026 Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#1B1740] px-3 py-1.5 rounded-xl border border-[#3D3280]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3DDC97]" />
            <span className="text-slate-300">Cleared (3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFC83D] animate-ping" />
            <span className="text-[#FFC83D] font-bold">Active: Week 4</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-400">Locked (2)</span>
          </div>
        </div>
      </div>

      {/* Illustrated Canvas / World Map Container */}
      <div className="relative w-full rounded-3xl bg-[#171338] border-2 border-[#2D2466] overflow-hidden shadow-2xl min-h-[560px]">
        {/* Atmospheric Background SVGs: Twilight Stars, Distant Lantern Towers */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-white animate-pulse" />
          <div className="absolute top-36 left-1/3 w-1.5 h-1.5 rounded-full bg-[#4CC9F0] animate-pulse" />
          <div className="absolute top-64 right-1/4 w-2 h-2 rounded-full bg-[#FFC83D] animate-ping" />
          <div className="absolute bottom-28 left-20 w-1.5 h-1.5 rounded-full bg-white" />
        </div>

        {/* SVG Path Connecting Nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Path Shadows */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64 Q 50 74 35 82 Q 55 88 72 94"
            fill="none"
            stroke="#0B091F"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Glowing Winding Study Path */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64 Q 50 74 35 82 Q 55 88 72 94"
            fill="none"
            stroke="#2D2466"
            strokeWidth="2"
            strokeDasharray="2,2"
            strokeLinecap="round"
          />
          {/* Active cleared path glow up to Week 4 */}
          <path
            d="M 20 12 Q 50 18 75 28 Q 50 38 28 46 Q 50 54 70 64"
            fill="none"
            stroke="#FFC83D"
            strokeWidth="1.2"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />
        </svg>

        {/* Fog of War on Bottom Locked Nodes (Weeks 5-6) */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-[#1B1740] via-[#1B1740]/80 to-transparent pointer-events-none z-10 flex items-end justify-center pb-4">
          <div className="text-center bg-[#1B1740]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-[#3D3280] shadow-lg">
            <span className="text-xs text-[#4CC9F0] font-semibold flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5" />
              Syllabus mist unlocks after Week 4 mastery
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
                      ? 'bg-gradient-to-tr from-[#9333EA] to-[#EC4899] border-[#FFC83D] animate-pulse shadow-[#FFC83D]/40'
                      : isCompleted
                      ? 'bg-[#3DDC97]/20 border-[#3DDC97] text-[#3DDC97] shadow-[#3DDC97]/30'
                      : isUnlocked
                      ? 'bg-[#FFC83D] border-white text-[#1B1740] ring-4 ring-[#FFC83D]/50 shadow-[#FFC83D]/50 animate-bounce'
                      : 'bg-[#241D52] border-[#3D3280] text-slate-500 opacity-70'
                  }`}
                  style={{
                    boxShadow: isUnlocked
                      ? '0 0 25px rgba(255, 200, 61, 0.7)'
                      : isCompleted
                      ? '0 0 15px rgba(61, 220, 151, 0.4)'
                      : 'none',
                  }}
                >
                  {node.isBoss ? (
                    <Award className="w-7 h-7 text-white" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  ) : isUnlocked ? (
                    <Sparkles className="w-7 h-7 fill-current stroke-none" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>

                {/* Companion Standing next to Active Unlocked Node */}
                {isUnlocked && (
                  <div className="absolute -top-11 -right-8 pointer-events-none animate-[wiggle_2s_ease-in-out_infinite]">
                    <CompanionAvatar species="FOX" mood="CHEERING" size={42} />
                  </div>
                )}

                {/* Node Pill Tag */}
                <div
                  className={`mt-2 px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border shadow-md ${
                    isUnlocked
                      ? 'bg-[#FFC83D] text-[#1B1740] border-white font-display'
                      : isCompleted
                      ? 'bg-[#1B1740]/90 text-[#3DDC97] border-[#3DDC97]/40'
                      : 'bg-[#1B1740]/80 text-slate-400 border-[#3D3280]'
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-battle max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-[#FFC83D] uppercase tracking-wider font-display">
                  Week {selectedNode.week} • {selectedNode.course}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedNode.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg bg-[#1B1740] text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Quests Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#4CC9F0] tracking-wider">
                Weekly Mastery Quests
              </h4>
              <div className="space-y-2">
                {selectedNode.quests.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1B1740] border border-[#3D3280]"
                  >
                    <div className="flex items-center gap-2.5 text-xs text-white">
                      {q.done ? (
                        <CheckCircle2 className="w-4 h-4 text-[#3DDC97]" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-500" />
                      )}
                      <span className={q.done ? 'line-through text-slate-400' : ''}>
                        {q.title}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#FFC83D]">
                      +{q.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {selectedNode.status === 'LOCKED' ? (
                <div className="p-3 rounded-xl bg-slate-800/80 text-center text-xs text-slate-400 border border-slate-700">
                  Locked until previous weeks are cleared
                </div>
              ) : (
                <GameButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setSelectedNode(null);
                    // Emit or handle run
                    soundManager.play('tap');
                  }}
                  icon={<ChevronRight className="w-5 h-5" />}
                >
                  {selectedNode.status === 'COMPLETED' ? 'Review cleared topic' : 'Start week 4 quest'}
                </GameButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
