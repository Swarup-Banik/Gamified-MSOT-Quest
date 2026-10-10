'use client';

import React, { useState } from 'react';
import { Star, Download, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

interface PilotFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function PilotFeedbackModal({ isOpen, onClose, user }: PilotFeedbackModalProps) {
  const [rating, setRating] = useState(5);
  const [favoriteMechanic, setFavoriteMechanic] = useState('Mistake Monsters');
  const [strugglePoints, setStrugglePoints] = useState('');
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentId = user?.id || 'student_1';
      await api.submitFeedback({
        studentId,
        rating,
        favoriteMechanic,
        strugglePoints,
        comments,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Submission error');
    }
  };

  const handleDownloadCsv = () => {
    window.open('http://localhost:4000/api/pilot/export-csv', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="quest-card max-w-md w-full p-6 space-y-4 border border-indigo-500/40 shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase">2-Week Pilot Survey</span>
            <h3 className="font-bold text-lg text-white">Share Your Student Experience</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white text-base">Thank You for Your Feedback!</h4>
            <p className="text-xs text-slate-300">
              Your feedback is recorded anonymously to calibrate upcoming season quests.
            </p>
            <div className="pt-2">
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-bold border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Anonymized Pilot Dataset (.CSV)</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-2 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs"
            >
              Back to Game
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300">How do you rate the learning excitement?</label>
              <div className="flex items-center gap-2 mt-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Which game mechanic motivated you most?</label>
              <select
                value={favoriteMechanic}
                onChange={e => setFavoriteMechanic(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="Today's Run">Today's Run (3-min daily micro challenge)</option>
                <option value="Mistake Monsters">Mistake Monsters (Spaced revenge rounds)</option>
                <option value="Leagues & Ghost Mode">Leagues & Ghost Mode</option>
                <option value="Section Battles">Section vs Section Team Battles</option>
                <option value="Cosmetics & Chests">Mystery Chests & Avatar Evolution</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Any concepts you struggled with this week?</label>
              <input
                type="text"
                placeholder="e.g. Recursion tree branching or pointers"
                value={strugglePoints}
                onChange={e => setStrugglePoints(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">General thoughts or suggestions:</label>
              <textarea
                rows={2}
                placeholder="Studying feels like entertainment rather than an obligation!"
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
