'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Lock,
  CheckCircle,
  Skull,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
} from 'lucide-react';

interface TopicNode {
  id: string;
  courseTitle: string;
  weekNumber: number;
  title: string;
  description: string;
  status: 'COMPLETED' | 'UNLOCKED' | 'LOCKED';
  isBossNode?: boolean;
  quests: { title: string; xp: number; completed: boolean }[];
}

export function SkillTree() {
  const [selectedTopic, setSelectedTopic] = useState<TopicNode | null>(null);

  const topics: TopicNode[] = [
    {
      id: 'node_1',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 1,
      title: 'Arrays & Two Pointers',
      description: 'In-place two-pointer partitioning and sub-array sliding windows.',
      status: 'COMPLETED',
      quests: [
        { title: 'Solve 3 Two-Pointer problems', xp: 30, completed: true },
        { title: 'Achieve 100% on Array Micro-Quiz', xp: 20, completed: true },
      ],
    },
    {
      id: 'node_2',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 2,
      title: 'Linked Lists & Fast-Slow Pointers',
      description: 'Cycle detection, list reversal, and middle pointer determination.',
      status: 'COMPLETED',
      quests: [
        { title: 'Complete Linked List cycle quest', xp: 25, completed: true },
        { title: 'Defeat List Gremlin in revenge round', xp: 15, completed: true },
      ],
    },
    {
      id: 'node_3',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 3,
      title: 'Stacks, Queues & Monotonic Structures',
      description: 'LIFO evaluation, parentheses validation, and next greater element.',
      status: 'COMPLETED',
      quests: [
        { title: 'Implement Monotonic Stack', xp: 35, completed: true },
        { title: 'Pass Week 3 assessment test', xp: 40, completed: true },
      ],
    },
    {
      id: 'node_4',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 4,
      title: 'Recursion & Backtracking',
      description: 'Call-stack recursion trees, base cases, permutations and subsets.',
      status: 'UNLOCKED', // Current Active Week
      quests: [
        { title: 'Finish all 4 Recursion challenges', xp: 50, completed: false },
        { title: 'Score ≥80% on Recursion micro-quiz', xp: 25, completed: true },
      ],
    },
    {
      id: 'node_5',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 5,
      title: 'Binary Trees & BSTs',
      description: 'DFS/BFS traversals, height calculation, and lowest common ancestor.',
      status: 'LOCKED',
      quests: [
        { title: 'Traverse 10 binary tree structures', xp: 40, completed: false },
      ],
    },
    {
      id: 'node_6',
      courseTitle: 'CS201 Data Structures',
      weekNumber: 6,
      title: 'The Archon of Trees (End Boss)',
      description: 'Comprehensive timed revision challenge testing all prior topics.',
      status: 'LOCKED',
      isBossNode: true,
      quests: [
        { title: 'Defeat Mid-Term Course Boss', xp: 100, completed: false },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Syllabus World Map • CS201</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Skill tree nodes unlock weekly as faculty progress through the semester curriculum.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
          <span className="flex items-center gap-1 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" /> Active Week
          </span>
          <span className="flex items-center gap-1 text-slate-500">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        </div>
      </div>

      {/* Interactive Skill Tree Node Path */}
      <div className="quest-card p-6 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {topics.map((topic, index) => {
            const isCompleted = topic.status === 'COMPLETED';
            const isUnlocked = topic.status === 'UNLOCKED';
            const isLocked = topic.status === 'LOCKED';

            let borderStyle = 'border-slate-800 bg-slate-900/60 opacity-60';
            if (isCompleted) {
              borderStyle = 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500';
            } else if (isUnlocked) {
              borderStyle = 'border-indigo-500 bg-indigo-950/40 glow-indigo shadow-lg shadow-indigo-500/10 scale-[1.02]';
            }

            return (
              <div
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${borderStyle}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      WEEK {topic.weekNumber}
                    </span>
                    {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {isUnlocked && <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />}
                    {isLocked && <Lock className="w-4 h-4 text-slate-500" />}
                  </div>

                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {topic.isBossNode && <Skull className="w-4 h-4 text-rose-400" />}
                    <span>{topic.title}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{topic.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">
                    {topic.quests.filter(q => q.completed).length} / {topic.quests.length} Quests
                  </span>
                  <span className="text-indigo-400 font-bold flex items-center gap-0.5 hover:underline">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Topic Quests Modal / Inspector */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="quest-card max-w-lg w-full p-6 space-y-4 border border-indigo-500/40 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase">
                  Week {selectedTopic.weekNumber} • {selectedTopic.courseTitle}
                </span>
                <h3 className="font-bold text-lg text-white mt-0.5">{selectedTopic.title}</h3>
              </div>
              <button onClick={() => setSelectedTopic(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">{selectedTopic.description}</p>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Associated Topic Quests</span>
              </h4>
              {selectedTopic.quests.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    {q.completed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                    <span className={q.completed ? 'text-slate-400 line-through' : 'text-white'}>{q.title}</span>
                  </div>
                  <span className="font-bold text-indigo-300">+{q.xp} XP</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedTopic(null)}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
            >
              Close Map Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
