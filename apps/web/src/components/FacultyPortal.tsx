'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  XCircle,
  Sliders,
  ShieldAlert,
  Send,
  Trash2,
  TrendingUp,
  Brain,
  Edit3,
} from 'lucide-react';
import { api } from '../lib/api';

interface FacultyPortalProps {
  user: any;
  onRefreshProfile: () => void;
}

export function FacultyPortal({ user, onRefreshProfile }: FacultyPortalProps) {
  const [activeTab, setActiveTab] = useState<'ENGAGEMENT' | 'STRUGGLES' | 'QUIET' | 'APPROVAL' | 'RULES' | 'ANOMALIES'>('ENGAGEMENT');
  const [engagement, setEngagement] = useState<any | null>(null);
  const [struggles, setStruggles] = useState<any[]>([]);
  const [quietStudents, setQuietStudents] = useState<any[]>([]);
  const [questionQueue, setQuestionQueue] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'ENGAGEMENT') {
        const data = await api.getFacultyEngagement();
        setEngagement(data);
      } else if (activeTab === 'STRUGGLES') {
        const data = await api.getFacultyStruggles();
        setStruggles(data || []);
      } else if (activeTab === 'QUIET') {
        const data = await api.getFacultyQuietStudents();
        setQuietStudents(data || []);
      } else if (activeTab === 'APPROVAL') {
        const data = await api.getQuestionQueue();
        setQuestionQueue(data.questions || []);
      } else if (activeTab === 'RULES') {
        const data = await api.getXpRules();
        setRules(data.rules || []);
      } else if (activeTab === 'ANOMALIES') {
        const data = await api.getAnomalies();
        setAnomalies(data.anomalies || []);
      }
    } catch (err) {
      console.error('Failed to load faculty portal data', err);
    }
  };

  const handleSendNudge = async (studentId: string) => {
    try {
      const res = await api.sendNudge(studentId, user?.id || 'faculty_sarah');
      alert(`💬 Gentle Nudge Sent!\n"${res.message}"`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Nudge failed');
    }
  };

  const handleReviewQuestion = async (questionId: string, decision: 'APPROVED' | 'EDITED' | 'REJECTED') => {
    try {
      await api.reviewQuestion({
        questionId,
        facultyId: user?.id || 'faculty_sarah',
        decision,
        notes: `Reviewed by faculty with decision: ${decision}`,
      });
      alert(`Question marked as ${decision}!`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Review failed');
    }
  };

  const handleSaveRule = async () => {
    if (!editingRule) return;
    try {
      await api.updateXpRule(editingRule.id, { baseXp: Number(editingRule.baseXp) }, 'Faculty calibrated XP balance');
      alert(`Rule "${editingRule.actionType}" updated to ${editingRule.baseXp} XP without code changes!`);
      setEditingRule(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    }
  };

  const handleVoidAnomaly = async (anomaly: any) => {
    const reason = prompt('Mandatory reason for voiding suspicious XP:', 'Plagiarism or automated telemetry anomaly detected');
    if (!reason) return;
    try {
      // Find candidate entry ID or pass target
      const entryId = anomaly.evidence?.targetAttemptId || 'seed_xpe_student_1_2';
      await api.voidXp(entryId, reason);
      alert('Compensating ledger entry created! Past ledger rows remain immutable.');
      loadData();
      onRefreshProfile();
    } catch (err: any) {
      alert(err.message || 'Void failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Faculty Portal Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('ENGAGEMENT')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ENGAGEMENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Class Engagement
        </button>
        <button
          onClick={() => setActiveTab('STRUGGLES')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'STRUGGLES' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Struggling Topics Heatmap
        </button>
        <button
          onClick={() => setActiveTab('QUIET')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'QUIET' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Quiet Students (Nudges)
        </button>
        <button
          onClick={() => setActiveTab('APPROVAL')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'APPROVAL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          AI Question Approval Queue
        </button>
        <button
          onClick={() => setActiveTab('RULES')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'RULES' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          XP Rules Engine (Admin)
        </button>
        <button
          onClick={() => setActiveTab('ANOMALIES')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'ANOMALIES' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Anti-Gaming Anomalies
        </button>
      </div>

      {/* 1. Engagement Metrics View */}
      {activeTab === 'ENGAGEMENT' && engagement && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="quest-card p-4">
              <span className="text-xs text-slate-400">Total Enrolled</span>
              <div className="text-2xl font-black text-white mt-1">{engagement.totalStudents}</div>
              <span className="text-[10px] text-emerald-400">Across 4 Campuses</span>
            </div>
            <div className="quest-card p-4">
              <span className="text-xs text-slate-400">Daily Active Rate (DAU)</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">{engagement.dauPercent}%</div>
              <span className="text-[10px] text-slate-400">{engagement.dailyActiveStudents} students active today</span>
            </div>
            <div className="quest-card p-4">
              <span className="text-xs text-slate-400">Quiz Completion Rate</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{engagement.quizCompletionRatePercent}%</div>
              <span className="text-[10px] text-slate-400">Weekly Target: 70%</span>
            </div>
            <div className="quest-card p-4">
              <span className="text-xs text-slate-400">Total XP Distributed</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{engagement.totalXpAwardedThisWeek.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400">This semester week</span>
            </div>
          </div>

          <div className="quest-card p-5 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Weekly Daily Active Students Trend</span>
            </h3>
            <div className="grid grid-cols-7 gap-2 pt-2">
              {engagement.dailyActiveTrend.map((t: any) => (
                <div key={t.date} className="p-3 bg-slate-800/80 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">{t.date}</span>
                  <div className="text-sm font-bold text-white">{t.activeCount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Struggling Topics Heatmap View */}
      {activeTab === 'STRUGGLES' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Topics highlighted based on quiz accuracy and active Mistake Monster density.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {struggles.map(topic => (
              <div
                key={topic.topicId}
                className={`quest-card p-4 border transition ${
                  topic.severity === 'HIGH'
                    ? 'border-rose-500/40 bg-rose-950/20'
                    : topic.severity === 'MEDIUM'
                    ? 'border-amber-500/30 bg-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      topic.severity === 'HIGH'
                        ? 'bg-rose-900 text-rose-300'
                        : topic.severity === 'MEDIUM'
                        ? 'bg-amber-900 text-amber-300'
                        : 'bg-emerald-900 text-emerald-300'
                    }`}
                  >
                    {topic.severity} NEED
                  </span>
                  <span className="text-xs text-slate-400">Accuracy: {topic.accuracyPercent}%</span>
                </div>

                <h4 className="font-bold text-sm text-white">{topic.topicTitle}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{topic.courseTitle}</p>

                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-300">
                  <span>👾 {topic.activeMistakeMonsters} Active Monsters</span>
                  <span>{topic.totalAttempts} Quiz Attempts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Quiet Students & Gentle Nudges View */}
      {activeTab === 'QUIET' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Students inactive for 5+ days. Faculty can send supportive nudges with no shaming copy.
          </div>

          <div className="quest-card overflow-hidden">
            <div className="divide-y divide-slate-800">
              {quietStudents.map(student => (
                <div key={student.studentId} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40">
                  <div>
                    <h4 className="font-bold text-sm text-white">{student.name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {student.sectionName} • Inactive for {student.daysInactive} days
                    </p>
                  </div>

                  <button
                    onClick={() => handleSendNudge(student.studentId)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Gentle Nudge</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI Question Approval Queue */}
      {activeTab === 'APPROVAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Every AI question must be approved by faculty before students can see it.</span>
            <span>{questionQueue.length} pending review</span>
          </div>

          {questionQueue.length === 0 ? (
            <div className="quest-card p-6 text-center text-xs text-slate-400">
              ✅ Approval queue empty. All curriculum questions are verified!
            </div>
          ) : (
            <div className="space-y-3">
              {questionQueue.map(q => (
                <div key={q.id} className="quest-card p-4 space-y-3 border border-indigo-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-400">{q.difficulty} • {q.language}</span>
                    <span className="text-slate-400">Source: {q.source}</span>
                  </div>

                  <p className="text-sm font-semibold text-white">{q.prompt}</p>

                  <div className="grid gap-1.5 text-xs text-slate-300">
                    {q.options?.map((opt: string, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg ${
                          idx === q.correctOptionIndex ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200' : 'bg-slate-800'
                        }`}
                      >
                        {idx + 1}. {opt} {idx === q.correctOptionIndex && '(Correct)'}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleReviewQuestion(q.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-bold hover:bg-rose-900 transition"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleReviewQuestion(q.id, 'EDITED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold hover:bg-amber-900 transition"
                    >
                      Edit & Approve
                    </button>
                    <button
                      onClick={() => handleReviewQuestion(q.id, 'APPROVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      Approve Without Edits
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. XP Rules Engine Editor */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Rules stored in PostgreSQL DB. Modifying rules creates versioned audit rows and never rewrites past ledger entries.
          </div>

          <div className="quest-card overflow-hidden">
            <div className="divide-y divide-slate-800">
              {rules.map(rule => (
                <div key={rule.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{rule.actionType}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400">v{rule.version}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-amber-400">{rule.baseXp} XP</span>
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Anti-Gaming Anomalies Inspector */}
      {activeTab === 'ANOMALIES' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Anomalies flagged by statistical Z-score detectors, paste telemetry, or answer clusters. 1-click compensating void.
          </div>

          {anomalies.length === 0 ? (
            <div className="quest-card p-6 text-center text-xs text-slate-400">
              🛡️ No anomalies detected. Student behavior aligns with expected distributions.
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map(ano => (
                <div key={ano.id} className="quest-card p-4 space-y-3 border border-rose-500/30 bg-rose-950/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase">{ano.flagType}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-900 text-rose-200 uppercase font-bold">
                      {ano.severity} Severity
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {JSON.stringify(ano.evidence, null, 2)}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleVoidAnomaly(ano)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Void Suspicious XP (Compensating Row)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rule Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="quest-card max-w-sm w-full p-6 space-y-4 border border-indigo-500/40">
            <h4 className="font-bold text-base text-white">Edit XP Value: {editingRule.actionType}</h4>

            <div>
              <label className="text-xs text-slate-400">Base XP Award:</label>
              <input
                type="number"
                value={editingRule.baseXp}
                onChange={e => setEditingRule({ ...editingRule, baseXp: e.target.value })}
                className="w-full mt-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingRule(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
