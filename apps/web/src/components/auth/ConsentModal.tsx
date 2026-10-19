'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle2, Lock, Award, FileText, ArrowRight } from 'lucide-react';
import { soundManager } from '../../lib/sound-manager';
import { api } from '../../lib/api';

interface ConsentModalProps {
  isOpen: boolean;
  onConsentAccepted: () => void;
}

export function ConsentModal({ isOpen, onConsentAccepted }: ConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!agreed) return;
    setLoading(true);
    setError(null);
    soundManager.play('tap');

    try {
      await api.recordConsent({
        noticeVersion: '2026.1',
        acceptedPurposeIds: [
          'LEARNING_GAMIFICATION',
          'PEER_LEAGUE_STANDINGS',
          'ACADEMIC_ISOLATION_GUARANTEE',
          'DPDP_DATA_RIGHTS',
        ],
      });
      soundManager.play('correct');
      onConsentAccepted();
    } catch (err: any) {
      soundManager.play('wrong');
      setError(err.message || 'Failed to record consent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D051D]/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#24104F] border-2 border-[#FFD23F] rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7CF36B]/20 border border-[#7CF36B]/40 text-[#7CF36B] text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>DPDP Act 2023 Compliance Notice</span>
          </div>
          <h2 className="font-display text-2xl text-white">
            Your Privacy & Learning Charter
          </h2>
          <p className="text-xs text-slate-300">
            Before entering MSOT Quest, please review our plain-language commitments to your privacy and academic integrity.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-[#FF4D5E]/20 border border-[#FF4D5E] text-[#FF4D5E] text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Commitment 1 */}
          <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 flex items-start gap-3">
            <Award className="w-5 h-5 text-[#FFD23F] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">1. Learning-First Gamification</h4>
              <p className="text-slate-300 mt-0.5">
                XP is awarded solely for verified learning activities (class attendance, homework, daily quizzes, coding practice). No idle points or microtransactions.
              </p>
            </div>
          </div>

          {/* Commitment 2 */}
          <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#22E3FF] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">2. Peer Anonymity Guarantee</h4>
              <p className="text-slate-300 mt-0.5">
                You can toggle Anonymous Mode at any time. When active, your real name and roll number are concealed with a randomized alias (e.g., &ldquo;Swift Falcon 42&rdquo;) across all peer standings and exports.
              </p>
            </div>
          </div>

          {/* Commitment 3 */}
          <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#7CF36B] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">3. Absolute Academic Isolation</h4>
              <p className="text-slate-300 mt-0.5">
                Game mechanics and XP NEVER affect your official college marks, attendance records, or degree transcripts. Official records are strictly read-only inputs.
              </p>
            </div>
          </div>

          {/* Commitment 4 */}
          <div className="p-3.5 rounded-2xl bg-[#15062C] border border-white/10 flex items-start gap-3">
            <FileText className="w-5 h-5 text-[#FF3D9A] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white text-sm">4. Data Rights & Deletion</h4>
              <p className="text-slate-300 mt-0.5">
                In compliance with the Digital Personal Data Protection Act, you can download all your stored data in JSON format or request account deletion with a 30-day grace period.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded text-[#FFD23F] focus:ring-[#FFD23F] accent-[#FFD23F]"
            />
            <span className="text-xs text-slate-200">
              I have read and consent to the data collection and learning charter outlined above.
            </span>
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!agreed || loading}
          className={`w-full py-3 rounded-2xl font-display text-sm font-bold flex items-center justify-center gap-2 transition ${
            agreed && !loading
              ? 'btn-sunset-3d btn-3d-yellow'
              : 'bg-white/10 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{loading ? 'Recording Consent...' : 'Accept & Enter Realm'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
