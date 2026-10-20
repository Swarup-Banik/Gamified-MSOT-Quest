'use client';

import React, { useState, useEffect } from 'react';
import {
  Code,
  Github,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield,
  Unlink,
  Copy,
  Check,
  Zap,
  Info,
  Award,
  Sparkles,
  Lock,
} from 'lucide-react';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sound-manager';

interface ConnectionsWizardProps {
  onXpAwarded?: () => void;
}

interface ProviderCardProps {
  provider: 'GITHUB' | 'LEETCODE' | 'HACKERRANK';
  title: string;
  icon: React.ReactNode;
  tagline: string;
  connection: any;
  health: any;
  onConnect: () => void;
  onSync: () => void;
  onUnlink: () => void;
  isSyncing: boolean;
}

export function ConnectionsWizard({ onXpAwarded }: ConnectionsWizardProps) {
  const [connections, setConnections] = useState<any[]>([]);
  const [health, setHealth] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'GITHUB' | 'LEETCODE' | 'HACKERRANK'>('LEETCODE');
  const [handleInput, setHandleInput] = useState('');
  const [step, setStep] = useState<'INPUT' | 'CHALLENGE' | 'SUCCESS'>('INPUT');
  const [challengeData, setChallengeData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Unlink Modal
  const [unlinkConfirmProvider, setUnlinkConfirmProvider] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Sync Result Toast
  const [syncNotice, setSyncNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const res = await api.getIntegrations();
      if (res.success) {
        setConnections(res.connections || []);
        setHealth(res.health || {});
      }
    } catch (err: any) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConnectModal = (provider: 'GITHUB' | 'LEETCODE' | 'HACKERRANK') => {
    soundManager.play('tap');
    setSelectedProvider(provider);
    setHandleInput('');
    setErrorMsg(null);
    setChallengeData(null);
    setStep('INPUT');
    setModalOpen(true);
  };

  const handleCreateChallenge = async () => {
    if (!handleInput.trim()) {
      setErrorMsg('Please enter your username/handle');
      return;
    }

    soundManager.play('tap');
    setErrorMsg(null);
    setVerifying(true);

    try {
      if (selectedProvider === 'GITHUB') {
        // For GitHub mock/live OAuth connection
        const res = await api.createIntegrationChallenge(selectedProvider, handleInput.trim());
        if (res.success) {
          // Immediately verify for GitHub
          const verifyRes = await api.verifyIntegrationChallenge(res.challenge.id);
          soundManager.play('levelUp');
          setSuccessResult(verifyRes);
          setStep('SUCCESS');
          await loadConnections();
          if (onXpAwarded) onXpAwarded();
        }
      } else {
        // LeetCode & HackerRank Bio verification challenge
        const res = await api.createIntegrationChallenge(selectedProvider, handleInput.trim());
        if (res.success) {
          setChallengeData(res.challenge);
          setStep('CHALLENGE');
        }
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setErrorMsg(err.message || 'Failed to generate verification challenge');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyBio = async () => {
    if (!challengeData) return;
    soundManager.play('tap');
    setVerifying(true);
    setErrorMsg(null);

    try {
      const res = await api.verifyIntegrationChallenge(challengeData.id);
      soundManager.play('levelUp');
      setSuccessResult(res);
      setStep('SUCCESS');
      await loadConnections();
      if (onXpAwarded) onXpAwarded();
    } catch (err: any) {
      soundManager.play('wrong');
      setErrorMsg(err.message || 'Could not verify code in your profile bio yet. Please make sure you saved your bio and try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopyCode = () => {
    if (!challengeData?.challengeCode) return;
    navigator.clipboard.writeText(challengeData.challengeCode);
    setCopied(true);
    soundManager.play('tap');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSync = async (provider: string) => {
    soundManager.play('tap');
    setSyncingProvider(provider);
    setSyncNotice(null);

    try {
      const res = await api.syncIntegration(provider);
      if (res.success) {
        if (res.xpAwarded > 0) {
          soundManager.play('levelUp');
          setSyncNotice({
            type: 'success',
            text: `🎉 Synced ${res.newSolvesDetected} new solves! Earned +${res.xpAwarded} XP!`,
          });
        } else {
          soundManager.play('correct');
          setSyncNotice({
            type: 'info',
            text: res.notice || `Sync completed. Solves are up to date! (0 new XP)`,
          });
        }
        await loadConnections();
        if (onXpAwarded) onXpAwarded();
      } else {
        soundManager.play('wrong');
        setSyncNotice({
          type: 'error',
          text: res.notice || 'Sync could not be completed at this time.',
        });
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setSyncNotice({
        type: 'error',
        text: err.message || 'Failed to sync account.',
      });
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkConfirmProvider) return;
    soundManager.play('tap');
    setUnlinking(true);

    try {
      await api.unlinkIntegration(unlinkConfirmProvider);
      soundManager.play('correct');
      setSyncNotice({
        type: 'info',
        text: `Successfully disconnected ${unlinkConfirmProvider}. Your earned XP is permanent and your baseline solve counts have been safely saved.`,
      });
      setUnlinkConfirmProvider(null);
      await loadConnections();
    } catch (err: any) {
      soundManager.play('wrong');
      setSyncNotice({
        type: 'error',
        text: err.message || 'Failed to disconnect account.',
      });
    } finally {
      setUnlinking(false);
    }
  };

  const getConn = (p: string) => connections.find(c => c.provider === p);
  const getProviderHealth = (p: string) => health[p] || { state: 'CLOSED' };

  return (
    <div className="panel-quest-board p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-[#FFD23F] flex items-center gap-2">
            <Code className="w-6 h-6 text-[#22E3FF]" />
            <span>Verified Coding Practice XP</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Link your public coding profiles to earn XP automatically for real problem solves and commits.
            Historic solves establish your starting baseline (0 retroactive XP). Future solves earn up to 40 XP each!
          </p>
        </div>

        <button
          onClick={loadConnections}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition shrink-0"
          title="Refresh Connections"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sync Notice Alert */}
      {syncNotice && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold ${
            syncNotice.type === 'success'
              ? 'bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B]'
              : syncNotice.type === 'error'
              ? 'bg-[#FF4D5E]/20 border border-[#FF4D5E] text-[#FF4D5E]'
              : 'bg-[#22E3FF]/20 border border-[#22E3FF] text-[#22E3FF]'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : syncNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{syncNotice.text}</span>
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-white hover:underline text-[11px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* LeetCode */}
        <ProviderCard
          provider="LEETCODE"
          title="LeetCode"
          icon={<span className="text-lg font-bold text-[#FFA116]">LC</span>}
          tagline="10-40 XP per accepted solve + 25% topic bonus"
          connection={getConn('LEETCODE')}
          health={getProviderHealth('LEETCODE')}
          onConnect={() => openConnectModal('LEETCODE')}
          onSync={() => handleSync('LEETCODE')}
          onUnlink={() => setUnlinkConfirmProvider('LEETCODE')}
          isSyncing={syncingProvider === 'LEETCODE'}
        />

        {/* GitHub */}
        <ProviderCard
          provider="GITHUB"
          title="GitHub"
          icon={<Github className="w-5 h-5 text-white" />}
          tagline="10 XP per active coding day (>=10 lines non-fork)"
          connection={getConn('GITHUB')}
          health={getProviderHealth('GITHUB')}
          onConnect={() => openConnectModal('GITHUB')}
          onSync={() => handleSync('GITHUB')}
          onUnlink={() => setUnlinkConfirmProvider('GITHUB')}
          isSyncing={syncingProvider === 'GITHUB'}
        />

        {/* HackerRank */}
        <ProviderCard
          provider="HACKERRANK"
          title="HackerRank"
          icon={<span className="text-lg font-bold text-[#00EA64]">HR</span>}
          tagline="Badge star level XP + faculty contest CSV import"
          connection={getConn('HACKERRANK')}
          health={getProviderHealth('HACKERRANK')}
          onConnect={() => openConnectModal('HACKERRANK')}
          onSync={() => handleSync('HACKERRANK')}
          onUnlink={() => setUnlinkConfirmProvider('HACKERRANK')}
          isSyncing={syncingProvider === 'HACKERRANK'}
        />
      </div>

      {/* Rules & Privacy Explainer */}
      <div className="p-4 rounded-2xl bg-[#15062C]/70 border border-white/10 text-xs space-y-2">
        <div className="flex items-center gap-2 text-[#FFD23F] font-bold">
          <Shield className="w-4 h-4 text-[#7CF36B]" />
          <span>Fair Play & Zero-Custody Privacy Rules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-300">
          <div>
            <strong className="text-white block mb-0.5">Zero Credential Custody</strong>
            We never ask for or store passwords or session cookies. Verification is performed strictly via public bio codes or official OAuth.
          </div>
          <div>
            <strong className="text-white block mb-0.5">Link-Time Baseline</strong>
            Problems solved prior to linking establish your starting point. No retroactive XP is awarded, keeping leaderboards fair for all cohorts.
          </div>
          <div>
            <strong className="text-white block mb-0.5">Anti-Gaming Safeguards</strong>
            Max 10 problems/day across providers, velocity spike throttling (&gt;5 solves in 15 min), and fork/whitespace filters on commits.
          </div>
        </div>
      </div>

      {/* Connect & Verification Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel-quest-board w-full max-w-lg p-6 space-y-5 rounded-3xl border-2 border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg text-[#FFD23F] flex items-center gap-2">
                <span>Connect {selectedProvider === 'LEETCODE' ? 'LeetCode' : selectedProvider === 'GITHUB' ? 'GitHub' : 'HackerRank'}</span>
              </h4>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#FF4D5E]/20 border border-[#FF4D5E] text-[#FF4D5E] text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {step === 'INPUT' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Enter your public {selectedProvider} username. We will verify ownership to ensure no one else can link your account.
                </p>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {selectedProvider} Username / Handle
                  </label>
                  <input
                    type="text"
                    value={handleInput}
                    onChange={e => setHandleInput(e.target.value)}
                    placeholder={
                      selectedProvider === 'LEETCODE'
                        ? 'e.g. alex_coder'
                        : selectedProvider === 'GITHUB'
                        ? 'e.g. priya_github'
                        : 'e.g. rohit_sharma'
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Try deterministic fixtures like <code className="text-[#22E3FF]">alex_coder</code> (LeetCode) or <code className="text-[#22E3FF]">priya_github</code> (GitHub) in demo mode!
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChallenge}
                    disabled={verifying}
                    className="px-5 py-2.5 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <span>Continue &rarr;</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'CHALLENGE' && challengeData && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-[#15062C] border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Step 1: Copy your verification code
                  </span>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-[#22E3FF]">
                    <span className="font-bold">{challengeData.challengeCode}</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 rounded-lg bg-[#22E3FF]/20 text-[#22E3FF] hover:bg-[#22E3FF]/30 font-sans text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#15062C] border border-white/10 space-y-2 text-xs text-slate-300">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Step 2: Paste in your public profile bio
                  </span>
                  <p>
                    Open your <strong>{selectedProvider}</strong> profile settings, paste the code into your <em>"About Me"</em> or <em>"Bio"</em> field, and save changes.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    You can remove the code right after verification completes. Code expires in 30 minutes.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep('INPUT')}
                    className="text-xs text-slate-400 hover:text-white font-bold"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleVerifyBio}
                    disabled={verifying}
                    className="px-5 py-2.5 rounded-xl btn-sunset-3d btn-3d-cyan text-xs font-bold flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Bio...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify &amp; Link Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 'SUCCESS' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#7CF36B]/20 border-2 border-[#7CF36B] flex items-center justify-center text-[#7CF36B]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-display text-xl text-white">Account Linked!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Your {selectedProvider} profile has been verified and linked to MSOT Quest.
                  </p>
                </div>

                {successResult?.baseline && (
                  <div className="p-3 rounded-2xl bg-[#15062C] border border-white/10 text-xs text-left max-w-sm mx-auto space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                      Initial Baseline Captured
                    </span>
                    <div className="flex justify-between text-slate-200">
                      <span>Total Solves Recorded:</span>
                      <strong className="text-[#FFD23F]">{successResult.baseline.total || 0}</strong>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Historic solves earn 0 XP. New solves will automatically earn XP during your daily runs!
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold"
                >
                  Awesome, Let's Code!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unlink Confirmation Modal */}
      {unlinkConfirmProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel-quest-board w-full max-w-md p-6 space-y-4 rounded-3xl border-2 border-[#FF4D5E]/40 shadow-2xl">
            <div className="flex items-center gap-3 text-[#FF4D5E]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-display text-lg text-white">Disconnect {unlinkConfirmProvider}?</h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Disconnecting will stop automatic XP sync. Your previously earned XP remains permanently recorded in your ledger, and your baseline solve counts will be safely preserved if you reconnect later.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUnlinkConfirmProvider(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white font-bold"
              >
                Keep Connected
              </button>
              <button
                onClick={handleUnlink}
                disabled={unlinking}
                className="px-4 py-2 rounded-xl bg-[#FF4D5E] hover:bg-[#FF4D5E]/80 text-white font-bold text-xs shadow-lg transition"
              >
                {unlinking ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderCard({
  provider,
  title,
  icon,
  tagline,
  connection,
  health,
  onConnect,
  onSync,
  onUnlink,
  isSyncing,
}: ProviderCardProps) {
  const isLinked = connection?.linked;
  const account = connection?.account;
  const isDegraded = health?.state === 'OPEN';

  return (
    <div
      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
        isLinked
          ? 'bg-gradient-to-b from-[#24104F] to-[#15062C] border-[#22E3FF]/40 shadow-xl'
          : 'bg-[#15062C]/60 border-white/10 hover:border-white/20'
      }`}
    >
      <div className="space-y-3">
        {/* Top Bar: Icon, Name & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#15062C] border border-white/10 flex items-center justify-center shadow-inner">
              {icon}
            </div>
            <div>
              <h4 className="font-display text-base text-white">{title}</h4>
              <span className="text-[10px] text-slate-400 block">{tagline}</span>
            </div>
          </div>

          <div>
            {isLinked ? (
              <span className="px-2.5 py-0.5 rounded-full bg-[#7CF36B]/20 text-[#7CF36B] text-[10px] font-bold border border-[#7CF36B]/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-400 text-[10px] font-bold">
                Not Linked
              </span>
            )}
          </div>
        </div>

        {/* Degraded Alert */}
        {isDegraded && (
          <div className="p-2 rounded-xl bg-[#FFA116]/20 border border-[#FFA116]/40 text-[#FFA116] text-[10px] font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Service Degraded (Circuit Breaker Active)</span>
          </div>
        )}

        {/* Connected Account Stats */}
        {isLinked && account && (
          <div className="p-3 rounded-2xl bg-[#15062C]/80 border border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] text-slate-400">Handle:</span>
              <strong className="text-white font-mono">@{account.handle}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] text-slate-400">XP Earned:</span>
              <strong className="text-[#FFD23F]">+{account.totalXpEarned || 0} XP</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[11px] text-slate-400">Baseline Solves:</span>
              <span className="text-slate-300">{account.baselineSolvedCounts?.total || 0}</span>
            </div>
            {account.lastSyncAt && (
              <div className="text-[9px] text-slate-500 pt-1 border-t border-white/5">
                Last sync: {new Date(account.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2">
        {isLinked ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              disabled={isSyncing || isDegraded}
              className="flex-1 py-2 px-3 rounded-xl btn-sunset-3d btn-3d-yellow text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Solves'}</span>
            </button>
            <button
              onClick={onUnlink}
              className="p-2 rounded-xl bg-white/5 hover:bg-[#FF4D5E]/20 text-slate-400 hover:text-[#FF4D5E] border border-white/10 hover:border-[#FF4D5E]/40 transition"
              title="Disconnect Account"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full py-2.5 px-4 rounded-xl btn-sunset-3d btn-3d-cyan text-xs font-bold flex items-center justify-center gap-2"
          >
            <span>Connect Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
