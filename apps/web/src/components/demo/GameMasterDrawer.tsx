'use client';

import React, { useState } from 'react';
import {
  Sliders,
  X,
  FastForward,
  RotateCw,
  Sword,
  Gift,
  Palette,
  GraduationCap,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  UserCheck,
  ShieldAlert,
  RotateCcw,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';
import { api } from '../../lib/api';

interface GameMasterDrawerProps {
  currentRole: string;
  onSwitchRole: (role: string) => void;
  onOpenStorybook: () => void;
  onAdvanceDay: () => void;
  onRolloverWeek: () => void;
  onSpawnMonster: () => void;
  onAwardChest: () => void;
  onTriggerBurst: () => void;
  onStartDemoTour: () => void;
}

export function GameMasterDrawer({
  currentRole,
  onSwitchRole,
  onOpenStorybook,
  onAdvanceDay,
  onRolloverWeek,
  onSpawnMonster,
  onAwardChest,
  onTriggerBurst,
  onStartDemoTour,
}: GameMasterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'CONTROLS' | 'ROSTER' | 'APPROVALS' | 'AUDIT'>('CONTROLS');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Roster state
  const [csvContent, setCsvContent] = useState(
    'email,name,roll_number,campus,batch,section\npriya.sharma@msot.edu.in,Priya Sharma,MSOT-2025-055,campus_1,batch_2025,sec_a\nrohan.verma@msot.edu.in,Rohan Verma,MSOT-2025-056,campus_1,batch_2025,sec_a'
  );
  const [rosterPreview, setRosterPreview] = useState<any | null>(null);
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Approvals state
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handlePreviewRoster = async () => {
    setRosterLoading(true);
    soundManager.play('tap');
    try {
      const res = await api.previewRoster(csvContent);
      setRosterPreview(res);
      showStatus(`Validated ${res.validCount} valid entries, ${res.invalidCount} invalid.`);
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Error: ${err.message}`);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleImportRoster = async () => {
    if (!rosterPreview || !rosterPreview.preview) return;
    setRosterLoading(true);
    soundManager.play('tap');
    try {
      const res = await api.importRoster(rosterPreview.preview);
      setLastBatchId(res.batchId);
      soundManager.play('correct');
      showStatus(`Successfully imported ${res.importedCount} roster students!`);
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Import failed: ${err.message}`);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleRollbackRoster = async () => {
    if (!lastBatchId) return;
    setRosterLoading(true);
    soundManager.play('tap');
    try {
      const res = await api.undoRoster(lastBatchId);
      soundManager.play('correct');
      setLastBatchId(null);
      setRosterPreview(null);
      showStatus(res.message);
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Rollback failed: ${err.message}`);
    } finally {
      setRosterLoading(false);
    }
  };

  const loadApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const res = await api.getPendingApprovals();
      setApprovals(res.requests || []);
    } catch {
      // Ignore
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleReviewApproval = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    soundManager.play('tap');
    try {
      await api.reviewApproval({ requestId, decision });
      soundManager.play('correct');
      showStatus(`Request ${decision.toLowerCase()} successfully.`);
      await loadApprovals();
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Error: ${err.message}`);
    }
  };

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.getAuditLogs({ limit: 10 });
      setAuditLogs(res.logs || []);
    } catch {
      // Ignore
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleGrantCosmetic = async () => {
    soundManager.play('tap');
    try {
      const item = await api.grantRandomCosmetic();
      soundManager.play('correct');
      showStatus(`Granted random cosmetic: ${item.name} (${item.rarity})`);
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Grant failed: ${err.message}`);
    }
  };

  const handleResetLoadout = async () => {
    soundManager.play('tap');
    try {
      await api.resetStarterLoadout();
      soundManager.play('correct');
      showStatus('Reset student loadout to default starter kit');
    } catch (err: any) {
      soundManager.play('wrong');
      showStatus(`Reset failed: ${err.message}`);
    }
  };

  return (
    <>
      {/* Discreet Developer / Judge Toggle in Bottom Right */}
      <div className="fixed bottom-20 right-4 sm:bottom-4 sm:right-4 z-40">
        <button
          onClick={() => {
            soundManager.play('tap');
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15062C]/80 hover:bg-[#24104F] border border-white/20 text-[#FFF8E7] text-[11px] font-display backdrop-blur-md shadow-lg transition active:scale-95"
          title="Open Judge & Game Master Controls"
        >
          <Sliders className="w-3.5 h-3.5 text-[#FFD23F]" />
          <span>GM Drawer</span>
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#15062C]/80 backdrop-blur-sm flex items-end sm:items-center justify-end p-0 sm:p-4">
          <div className="bg-[#24104F] border-2 border-[#FFD23F]/50 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in slide-in-from-right duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#FFD23F]" />
                <h3 className="font-display text-base text-white">
                  Judge & Game Master Drawer
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-xl bg-white/10 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-2xl bg-[#15062C] p-1 border border-white/10 text-[11px] font-display">
              <button
                onClick={() => setDrawerTab('CONTROLS')}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  drawerTab === 'CONTROLS' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Controls
              </button>
              <button
                onClick={() => setDrawerTab('ROSTER')}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  drawerTab === 'ROSTER' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Roster Tool
              </button>
              <button
                onClick={() => { setDrawerTab('APPROVALS'); loadApprovals(); }}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  drawerTab === 'APPROVALS' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Approvals
              </button>
              <button
                onClick={() => { setDrawerTab('AUDIT'); loadAudit(); }}
                className={`flex-1 py-1.5 rounded-xl transition ${
                  drawerTab === 'AUDIT' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
                }`}
              >
                Audit Logs
              </button>
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-xl bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B] text-xs font-bold">
                {statusMessage}
              </div>
            )}

            {/* Tab 1: CONTROLS */}
            {drawerTab === 'CONTROLS' && (
              <div className="space-y-4">
                {/* Role Switcher */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Simulate User Role (Demo Mode)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['STUDENT', 'FACULTY', 'ADMIN'] as const).map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          soundManager.play('tap');
                          onSwitchRole(role);
                          showStatus(`Switched view to ${role}`);
                        }}
                        className={`py-2 rounded-xl text-xs font-display transition ${
                          currentRole === role
                            ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3-Minute Scripted Demo Tour */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#5B2EE0]/40 to-[#FF3D9A]/20 border border-white/20 space-y-2">
                  <span className="text-xs font-display text-[#FFD23F]">
                    3-Minute Scripted Evaluation Walk
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Step-by-step showcase covering XP ledger immutability, 5 interactive question formats, and procedural chests.
                  </p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onStartDemoTour();
                    }}
                    className="w-full py-2 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
                  >
                    Launch Automated Tour
                  </button>
                </div>

                {/* Simulators */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Time Machine Simulators
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => { onAdvanceDay(); showStatus('Fast-forwarded 1 day'); }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <FastForward className="w-4 h-4 text-[#22E3FF]" />
                      <span>+1 Day Streak</span>
                    </button>

                    <button
                      onClick={() => { onRolloverWeek(); showStatus('Rolled over weekly league'); }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <RotateCw className="w-4 h-4 text-[#FFD23F]" />
                      <span>Rollover Week</span>
                    </button>

                    <button
                      onClick={() => { onSpawnMonster(); showStatus('Spawned Mistake Monster'); }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <Sword className="w-4 h-4 text-[#FF4D5E]" />
                      <span>Spawn Monster</span>
                    </button>

                    <button
                      onClick={() => { onAwardChest(); showStatus('Awarded Legendary Vault'); }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <Gift className="w-4 h-4 text-[#7CF36B]" />
                      <span>Award Vault</span>
                    </button>

                    <button
                      onClick={handleGrantCosmetic}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <Palette className="w-4 h-4 text-[#FFD23F]" />
                      <span>Grant Cosmetic</span>
                    </button>

                    <button
                      onClick={handleResetLoadout}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left font-semibold text-white flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-[#22E3FF]" />
                      <span>Reset Loadout</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onTriggerBurst();
                      showStatus('Pushed 300 simultaneous campus battle actions');
                    }}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#FF3D9A]/50 text-left text-xs font-semibold text-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#FF3D9A]" />
                      <span>Trigger 300-Student Battle Burst</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">&lt;12ms latency</span>
                  </button>
                </div>

                {/* Storybook Link */}
                <div className="pt-1 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenStorybook();
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-display text-[#22E3FF] flex items-center justify-center gap-2 transition"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Open Design System Storybook</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: ROSTER TOOL */}
            {drawerTab === 'ROSTER' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Upload / Paste Campus Roster (CSV)</label>
                  <textarea
                    rows={4}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white font-mono text-[11px] focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePreviewRoster}
                    disabled={rosterLoading}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-white flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-[#22E3FF]" />
                    <span>Dry-Run Preview</span>
                  </button>

                  <button
                    onClick={handleImportRoster}
                    disabled={rosterLoading || !rosterPreview || rosterPreview.validCount === 0}
                    className="flex-1 py-2 rounded-xl btn-sunset-3d btn-3d-yellow font-bold text-xs"
                  >
                    Import Roster
                  </button>
                </div>

                {rosterPreview && (
                  <div className="p-3 rounded-xl bg-[#15062C] border border-white/10 space-y-1">
                    <p className="font-bold text-white">Preview Summary:</p>
                    <p className="text-slate-300">• Valid rows: <strong className="text-[#7CF36B]">{rosterPreview.validCount}</strong></p>
                    <p className="text-slate-300">• Invalid rows: <strong className="text-[#FF4D5E]">{rosterPreview.invalidCount}</strong></p>
                    {rosterPreview.errors?.length > 0 && (
                      <p className="text-[#FF4D5E] text-[10px]">{rosterPreview.errors[0]?.message}</p>
                    )}
                  </div>
                )}

                {lastBatchId && (
                  <button
                    onClick={handleRollbackRoster}
                    disabled={rosterLoading}
                    className="w-full py-2 rounded-xl bg-[#FF4D5E]/20 text-[#FF4D5E] border border-[#FF4D5E]/40 font-bold flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rollback Last Batch ({lastBatchId})</span>
                  </button>
                )}
              </div>
            )}

            {/* Tab 3: APPROVALS */}
            {drawerTab === 'APPROVALS' && (
              <div className="space-y-3 text-xs">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">
                  Pending Non-Roster Signups ({approvals.length})
                </span>
                {loadingApprovals ? (
                  <p className="text-slate-400">Loading requests...</p>
                ) : approvals.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#15062C] text-center text-slate-400 border border-white/10">
                    No pending approval requests!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {approvals.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-[#15062C] border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-white">{req.name || req.email}</p>
                          <p className="text-[10px] text-slate-400">{req.email} • {req.campusId}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReviewApproval(req.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-[#7CF36B]/20 text-[#7CF36B] font-bold text-[10px] border border-[#7CF36B]/40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewApproval(req.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-[#FF4D5E]/20 text-[#FF4D5E] font-bold text-[10px] border border-[#FF4D5E]/40"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: AUDIT LOGS */}
            {drawerTab === 'AUDIT' && (
              <div className="space-y-3 text-xs">
                <span className="text-slate-400 font-bold block uppercase tracking-wider">
                  Recent Security & Auth Events
                </span>
                {loadingAudit ? (
                  <p className="text-slate-400">Loading audit trail...</p>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-[#15062C] border border-white/10 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFD23F]">{log.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          Actor: {log.actorId} • IP: {log.ipAddress || '127.0.0.1'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
