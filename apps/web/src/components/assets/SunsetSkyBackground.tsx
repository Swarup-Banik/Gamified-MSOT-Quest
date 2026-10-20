'use client';

import React, { useEffect, useState } from 'react';
import { motionManager } from '../../lib/motion-manager';

export type TimeOfDay = 'SUNRISE' | 'MIDDAY' | 'DUSK' | 'NIGHT';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'SUNRISE';
  if (hour >= 8 && hour < 17) return 'MIDDAY';
  if (hour >= 17 && hour < 20) return 'DUSK';
  return 'NIGHT';
}

const skyGradients: Record<TimeOfDay, string> = {
  SUNRISE: 'linear-gradient(180deg, #1F1538 0%, #43236A 25%, #8B3C7E 55%, #FF7E5F 80%, #FEB47B 100%)',
  MIDDAY: 'linear-gradient(180deg, #161D4C 0%, #293882 30%, #4D3DB5 60%, #FF8A2B 85%, #FFD23F 100%)',
  DUSK: 'linear-gradient(180deg, #1C0B40 0%, #3B1B7D 25%, #5B2EE0 50%, #FF3D9A 78%, #FF8A2B 100%)',
  NIGHT: 'linear-gradient(180deg, #0D0418 0%, #150826 30%, #200E3D 60%, #381A66 85%, #522785 100%)',
};

export function SunsetSkyBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('DUSK');
  const [allowAmbient, setAllowAmbient] = useState(true);

  useEffect(() => {
    setTimeOfDay(getTimeOfDay());
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAllowAmbient(motionManager.allowsAmbientMotion());
      const unsub = motionManager.subscribe(() => {
        setAllowAmbient(motionManager.allowsAmbientMotion());
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!motionManager.allows3DTilt()) return;
        const normX = (e.clientX / window.innerWidth - 0.5) * 20; // -10px to +10px
        const normY = (e.clientY / window.innerHeight - 0.5) * 15; // -7.5px to +7.5px
        setMousePos({ x: normX, y: normY });
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => {
        unsub();
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  const parallaxBack = !allowAmbient ? 'translate(0, 0)' : `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`;
  const parallaxMid = !allowAmbient ? 'translate(0, 0)' : `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)`;
  const parallaxFront = !allowAmbient ? 'translate(0, 0)' : `translate(${mousePos.x}px, ${mousePos.y}px)`;

  return (
    <div className="sunset-sky-canvas fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Dynamic Local Time Sky Gradient Base */}
      <div
        className="absolute inset-0 opacity-95 transition-all duration-1000"
        style={{ background: skyGradients[timeOfDay] }}
      />

      {/* 2. Twinkling Stars (Parallax Deep Layer - Brighter at night/sunrise/dusk) */}
      <svg
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-out ${
          timeOfDay === 'MIDDAY' ? 'opacity-30' : timeOfDay === 'NIGHT' ? 'opacity-95' : 'opacity-80'
        }`}
        style={{ transform: parallaxBack }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12%" cy="15%" r="1.5" fill="#FFF8E7" className="animate-star-twinkle" style={{ animationDelay: '0.2s' }} />
        <circle cx="28%" cy="8%" r="2" fill="#22E3FF" className="animate-star-twinkle" style={{ animationDelay: '1.4s' }} />
        <circle cx="45%" cy="20%" r="1" fill="#FFF8E7" className="animate-star-twinkle" style={{ animationDelay: '2.1s' }} />
        <circle cx="68%" cy="12%" r="2.5" fill="#FFD23F" className="animate-star-twinkle" style={{ animationDelay: '0.8s' }} />
        <circle cx="85%" cy="18%" r="1.5" fill="#FFF8E7" className="animate-star-twinkle" style={{ animationDelay: '1.9s' }} />
        <circle cx="92%" cy="7%" r="2" fill="#FF3D9A" className="animate-star-twinkle" style={{ animationDelay: '0.5s' }} />
        <circle cx="38%" cy="32%" r="1.5" fill="#FFF8E7" className="animate-star-twinkle" style={{ animationDelay: '2.7s' }} />
        <circle cx="78%" cy="28%" r="1" fill="#22E3FF" className="animate-star-twinkle" style={{ animationDelay: '1.1s' }} />
        {/* Constellation line */}
        <line x1="28%" y1="8%" x2="45%" y2="20%" stroke="rgba(34, 227, 255, 0.2)" strokeWidth="0.8" strokeDasharray="3,3" />
        <line x1="45%" y1="20%" x2="68%" y2="12%" stroke="rgba(255, 210, 63, 0.2)" strokeWidth="0.8" strokeDasharray="3,3" />
      </svg>

      {/* 3. Drifting Sunset/Night Clouds (Parallax Mid Layer) */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: parallaxMid }}
      >
        {/* Upper drifting cloud */}
        <div
          className={`absolute -top-10 left-10 w-[550px] h-48 rounded-full bg-gradient-to-r from-[#FF3D9A]/15 via-[#FF8A2B]/10 to-transparent blur-2xl ${
            allowAmbient ? 'animate-cloud-drift' : ''
          }`}
          style={{ animationDuration: '90s' }}
        />
        {/* Mid drifting cloud */}
        <div
          className={`absolute top-48 -right-20 w-[600px] h-52 rounded-full bg-gradient-to-l from-[#5B2EE0]/20 via-[#FF3D9A]/15 to-transparent blur-3xl ${
            allowAmbient ? 'animate-cloud-drift' : ''
          }`}
          style={{ animationDuration: '120s', animationDelay: '-30s' }}
        />
      </div>

      {/* 4. Floating Campus Islands & Lantern Silhouette (Parallax Front Layer) */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-[380px] transition-transform duration-300 ease-out"
        style={{ transform: parallaxFront }}
        viewBox="0 0 1440 380"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="island-grad-back" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A209E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1E0A40" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="island-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#321366" />
            <stop offset="100%" stopColor="#15062C" />
          </linearGradient>
          <linearGradient id="lantern-glow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="50%" stopColor="#FFD23F" />
            <stop offset="100%" stopColor="#FF8A2B" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="crystal-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22E3FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22E3FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Back Layer Islands */}
        <path
          d="M0,280 C200,240 320,290 500,260 C680,230 780,270 940,250 C1100,230 1260,260 1440,240 L1440,380 L0,380 Z"
          fill="url(#island-grad-back)"
        />

        {/* Floating Observatory Dome Island (Center Left) */}
        <g className={allowAmbient ? 'animate-island-bob' : ''} style={{ animationDuration: '8s' }}>
          <ellipse cx="280" cy="220" rx="140" ry="25" fill="url(#island-grad-front)" />
          {/* Observatory Tower Silhouette */}
          <path d="M250,220 L250,175 Q280,145 310,175 L310,220 Z" fill="#240D4F" />
          <circle cx="280" cy="165" r="14" fill="#5B2EE0" />
          {/* Glowing Crystal spire */}
          <line x1="280" y1="151" x2="280" y2="135" stroke="#22E3FF" strokeWidth="2.5" />
          <circle cx="280" cy="133" r="5" fill="#22E3FF" className="animate-pulse" />
          <circle cx="280" cy="133" r="16" fill="url(#crystal-glow)" />
        </g>

        {/* Main Floating Campus Citadel Island (Center Right) */}
        <g className={allowAmbient ? 'animate-island-bob' : ''} style={{ animationDuration: '9.5s', animationDelay: '-3s' }}>
          <ellipse cx="880" cy="200" rx="220" ry="32" fill="url(#island-grad-front)" />
          {/* Citadel Spires & Towers */}
          <path d="M780,200 L795,140 L810,200 Z" fill="#1C093E" />
          <path d="M830,200 L845,120 L860,200 Z" fill="#260C54" />
          <path d="M870,200 L885,90 L900,200 Z" fill="#32106A" />
          <path d="M910,200 L925,130 L940,200 Z" fill="#260C54" />
          <path d="M950,200 L965,150 L980,200 Z" fill="#1C093E" />
          {/* Central Clock Tower Spire Lantern */}
          <line x1="885" y1="90" x2="885" y2="72" stroke="#FFD23F" strokeWidth="2" />
          <circle cx="885" cy="70" r="4.5" fill="#FFF8E7" />
          <circle cx="885" cy="70" r="18" fill="url(#lantern-glow)" className="animate-pulse" />
        </g>

        {/* Front Foreground Terrain Silhouette */}
        <path
          d="M0,320 Q300,280 620,330 T1200,310 Q1340,300 1440,325 L1440,380 L0,380 Z"
          fill="url(#island-grad-front)"
        />

        {/* Hanging Lanterns on Tree Arch (Bottom Left) */}
        <path d="M-20,330 Q60,250 140,265" stroke="#1C093E" strokeWidth="4" fill="none" />
        <g className={allowAmbient ? 'animate-lantern-sway' : ''} style={{ transformOrigin: '130px 265px' }}>
          <line x1="130" y1="265" x2="130" y2="285" stroke="#FFD23F" strokeWidth="1.5" />
          <rect x="123" y="285" width="14" height="20" rx="3" fill="#FF8A2B" stroke="#FFF8E7" strokeWidth="1" />
          <circle cx="130" cy="295" r="4" fill="#FFF8E7" />
          <circle cx="130" cy="295" r="16" fill="url(#lantern-glow)" className="animate-pulse" />
        </g>
      </svg>
    </div>
  );
}
