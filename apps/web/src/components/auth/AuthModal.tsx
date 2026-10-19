'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Shield,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  X,
  Smartphone,
} from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';
import { api, setAccessToken } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, profile: any) => void;
  initialTab?: 'SIGN_IN' | 'REGISTER' | 'CLAIM' | 'FORGOT_PASSWORD';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'SIGN_IN',
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'SIGN_IN' | 'REGISTER' | 'CLAIM' | 'FORGOT_PASSWORD'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaTicket, setMfaTicket] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRollNumber, setRegRollNumber] = useState('');
  const [regCampusId, setRegCampusId] = useState('campus_1');
  const [regBatchId, setRegBatchId] = useState('batch_2025');
  const [regSectionId, setRegSectionId] = useState('sec_a');

  // Claim state
  const [claimToken, setClaimToken] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [claimName, setClaimName] = useState('');

  // Password Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<'REQUEST' | 'RESET'>('REQUEST');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.play('tap');

    try {
      const res = await api.login({
        email,
        password,
        totpCode: mfaTicket && !useBackupCode ? totpCode : undefined,
        backupCode: mfaTicket && useBackupCode ? totpCode : undefined,
      });

      if (res.mfaRequired) {
        setMfaTicket(res.ticket || 'mfa_ticket');
        soundManager.play('tap');
        setLoading(false);
        return;
      }

      if (res.accessToken) {
        setAccessToken(res.accessToken);
        soundManager.play('correct');
        onSuccess(res.user, res.profile);
        onClose();
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setError(null);
    setLoading(true);
    soundManager.play('tap');
    try {
      // Mock Google OIDC token verified server-side
      const mockIdToken = `mock_google_token_${Date.now()}`;
      const res = await api.googleSSO(mockIdToken);
      if (res.accessToken) {
        setAccessToken(res.accessToken);
        soundManager.play('correct');
        onSuccess(res.user, res.profile);
        onClose();
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.play('tap');

    try {
      const res = await api.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        rollNumber: regRollNumber || undefined,
        campusId: regCampusId,
        batchId: regBatchId,
        sectionId: regSectionId,
      });

      soundManager.play('correct');
      setSuccessMsg(res.message);
      if (res.status === 'EMAIL_VERIFICATION_PENDING') {
        setTimeout(() => {
          setEmail(regEmail);
          setActiveTab('SIGN_IN');
          setSuccessMsg('Registration successful! Please check Mailpit / your email inbox for your verification code.');
        }, 1500);
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.play('tap');

    try {
      const res = await api.claimInvitation({
        token: claimToken,
        password: claimPassword,
        name: claimName || undefined,
      });

      if (res.accessToken) {
        setAccessToken(res.accessToken);
        soundManager.play('correct');
        onSuccess(res.user, res.profile);
        onClose();
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Claim invitation failed. Please check the token.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundManager.play('tap');

    try {
      if (resetStep === 'REQUEST') {
        const res = await api.forgotPassword(resetEmail);
        soundManager.play('correct');
        setSuccessMsg('Reset code sent! Check Mailpit or your institutional email.');
        setResetStep('RESET');
      } else {
        const res = await api.resetPassword({
          token: resetToken,
          newPassword,
        });
        soundManager.play('correct');
        setSuccessMsg(res.message);
        setTimeout(() => {
          setActiveTab('SIGN_IN');
          setResetStep('REQUEST');
          setSuccessMsg('Password updated! Please sign in with your new password.');
        }, 1500);
      }
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    soundManager.play('tap');
    if (role === 'STUDENT') {
      setEmail('student@msot.edu.in');
      setPassword('StudentPass123!');
    } else if (role === 'FACULTY') {
      setEmail('faculty@msot.edu.in');
      setPassword('FacultyPass123!');
    } else if (role === 'ADMIN') {
      setEmail('admin@msot.edu.in');
      setPassword('AdminPass123!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#24104F] border-2 border-[#FFD23F] rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD23F]/20 border border-[#FFD23F]/40 text-[#FFD23F] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sunset Realm Portal</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            {activeTab === 'SIGN_IN' && (mfaTicket ? 'Two-Factor Verification' : 'Welcome, Wanderer')}
            {activeTab === 'REGISTER' && 'Join the Quest'}
            {activeTab === 'CLAIM' && 'Claim Roster Account'}
            {activeTab === 'FORGOT_PASSWORD' && 'Recover Account'}
          </h2>
          <p className="text-xs text-slate-300">
            {activeTab === 'SIGN_IN' && 'Sign in to access your daily run, league standings, and inventory.'}
            {activeTab === 'REGISTER' && 'Create your institutional learner profile tied to your campus.'}
            {activeTab === 'CLAIM' && 'Enter your single-use invitation code to unlock your pre-registered account.'}
            {activeTab === 'FORGOT_PASSWORD' && 'Reset your password securely via institutional email verification.'}
          </p>
        </div>

        {/* Tab Switcher (if not in MFA step) */}
        {!mfaTicket && (
          <div className="flex rounded-2xl bg-[#15062C] p-1 border border-white/10 text-xs font-display">
            <button
              onClick={() => { setActiveTab('SIGN_IN'); setError(null); }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'SIGN_IN' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('REGISTER'); setError(null); }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'REGISTER' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setActiveTab('CLAIM'); setError(null); }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'CLAIM' ? 'bg-[#FFD23F] text-[#24104F] font-bold shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              Claim Roster
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FF4D5E]/20 border border-[#FF4D5E] text-[#FF4D5E] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-[#7CF36B]/20 border border-[#7CF36B] text-[#7CF36B] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: SIGN IN */}
        {activeTab === 'SIGN_IN' && !mfaTicket && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@msot.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('FORGOT_PASSWORD')}
                    className="text-[11px] text-[#FFD23F] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2 transition"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Realm'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google SSO */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                <span className="bg-[#24104F] px-2">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSSO}
              disabled={loading}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold flex items-center justify-center gap-2 text-white transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Demo Quick-Fill Buttons */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">Demo One-Click Credentials</span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('STUDENT')}
                  className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold"
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('FACULTY')}
                  className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold"
                >
                  Faculty
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('ADMIN')}
                  className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold"
                >
                  Admin (Vikram)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* MFA Step */}
        {mfaTicket && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#22E3FF]/10 border border-[#22E3FF]/30 text-xs text-slate-300 flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-[#22E3FF] shrink-0" />
              <div>
                <p className="font-bold text-white">Enter Two-Factor Code</p>
                <p className="text-[11px]">
                  {useBackupCode
                    ? 'Enter one of your 8-digit single-use backup recovery codes.'
                    : 'Open Google Authenticator or your TOTP app and enter the 6-digit code.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {useBackupCode ? '8-Digit Backup Code' : '6-Digit TOTP Code'}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.trim())}
                  placeholder={useBackupCode ? 'a1b2c3d4' : '123456'}
                  maxLength={useBackupCode ? 12 : 6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setUseBackupCode(!useBackupCode)}
                className="text-[#FFD23F] hover:underline"
              >
                {useBackupCode ? 'Use Authenticator Code instead' : 'Lost authenticator? Use backup code'}
              </button>
              <button
                type="button"
                onClick={() => setMfaTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: REGISTER */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Institutional Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@msot.edu.in"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password (Min 10 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={10}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Passphrase with letters & numbers"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Security Policy: Minimum 10 characters. Hashed with NIST-compliant Argon2id.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Roll Number (Optional)</label>
                <input
                  type="text"
                  value={regRollNumber}
                  onChange={(e) => setRegRollNumber(e.target.value)}
                  placeholder="MSOT-2025-042"
                  className="w-full px-3 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Campus</label>
                <select
                  value={regCampusId}
                  onChange={(e) => setRegCampusId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white text-xs focus:outline-none focus:border-[#FFD23F]"
                >
                  <option value="campus_1">Campus 1 (South)</option>
                  <option value="campus_2">Campus 2 (North)</option>
                  <option value="campus_3">Campus 3 (East)</option>
                  <option value="campus_4">Campus 4 (West)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Profile...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 3: CLAIM INVITATION */}
        {activeTab === 'CLAIM' && (
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="p-3 rounded-2xl bg-[#FFD23F]/10 border border-[#FFD23F]/30 text-xs text-slate-300">
              <p className="font-bold text-[#FFD23F]">Roster Claim Code</p>
              <p className="text-[11px] mt-0.5">
                If your faculty uploaded a campus roster, you received an invitation token. Enter it below to claim your linked records.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Invitation Token</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={claimToken}
                  onChange={(e) => setClaimToken(e.target.value.trim())}
                  placeholder="inv_token_..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Create Password (Min 10 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={10}
                  value={claimPassword}
                  onChange={(e) => setClaimPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Claiming Account...' : 'Claim & Start Playing'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 4: FORGOT PASSWORD */}
        {activeTab === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {resetStep === 'REQUEST' ? (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Enter Your Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="student@msot.edu.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#15062C] border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Reset Token (from email)</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.trim())}
                    placeholder="rst_token_..."
                    className="w-full px-3 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white font-mono text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">New Password (Min 10 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#15062C] border border-white/20 text-white text-sm focus:outline-none focus:border-[#FFD23F]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl btn-sunset-3d btn-3d-yellow font-display text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Processing...' : resetStep === 'REQUEST' ? 'Send Reset Link' : 'Set New Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SIGN_IN')}
              className="w-full text-center text-xs text-slate-400 hover:text-white"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
