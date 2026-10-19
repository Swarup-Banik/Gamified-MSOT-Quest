'use client';

import React, { useEffect, useState } from 'react';

export function SunsetSkyBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(media.matches);

      const handleMouseMove = (e: MouseEvent) => {
        if (media.matches) return;
        const normX = (e.clientX / window.innerWidth - 0.5) * 20; // -10px to +10px
        const normY = (e.clientY / window.innerHeight - 0.5) * 15; // -7.5px to +7.5px
        setMousePos({ x: normX, y: normY });
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const parallaxBack = reducedMotion ? 'translate(0, 0)' : `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)`;
  const parallaxMid = reducedMotion ? 'translate(0, 0)' : `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)`;
  const parallaxFront = reducedMotion ? 'translate(0, 0)' : `translate(${mousePos.x}px, ${mousePos.y}px)`;

  return (
    <div className="sunset-sky-canvas fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Deep Sunset Sky Gradient Base */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#24104F] via-[#5B2EE0] to-[#FF8A2B] opacity-95"
        style={{
          background: 'linear-gradient(180deg, #1C0B40 0%, #3B1B7D 25%, #5B2EE0 50%, #FF3D9A 78%, #FF8A2B 100%)',
        }}
      />

      {/* 2. Twinkling Stars (Parallax Deep Layer) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-80 transition-transform duration-300 ease-out"
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

      {/* 3. Drifting Sunset Clouds (Parallax Mid Layer) */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: parallaxMid }}
      >
        {/* Upper drifting cloud */}
        <div
          className="absolute -top-10 left-10 w-[550px] h-48 rounded-full bg-gradient-to-r from-[#FF3D9A]/15 via-[#FF8A2B]/10 to-transparent blur-2xl animate-cloud-drift"
          style={{ animationDuration: '90s' }}
        />
        {/* Mid drifting cloud */}
        <div
          className="absolute top-48 -right-20 w-[600px] h-52 rounded-full bg-gradient-to-l from-[#5B2EE0]/20 via-[#FF3D9A]/15 to-transparent blur-3xl animate-cloud-drift"
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

        {/* Distant Floating Island Left */}
        <g opacity="0.65" className="animate-island-bob" style={{ animationDuration: '7s' }}>
          <path
            d="M 60 210 Q 180 180 320 200 Q 240 280 170 310 Q 110 290 60 210 Z"
            fill="url(#island-grad-back)"
          />
          {/* Distant Campus Tower */}
          <rect x="180" y="110" width="22" height="75" rx="3" fill="#2D1160" />
          <polygon points="175,110 191,80 207,110" fill="#FFD23F" opacity="0.8" />
          <circle cx="191" cy="95" r="4" fill="#FFF8E7" />
        </g>

        {/* Distant Floating Island Right */}
        <g opacity="0.7" className="animate-island-bob" style={{ animationDuration: '6s', animationDelay: '-2s' }}>
          <path
            d="M 1120 180 Q 1280 150 1410 180 Q 1340 270 1260 300 Q 1180 260 1120 180 Z"
            fill="url(#island-grad-back)"
          />
          {/* Glowing Crystal Cluster */}
          <polygon points="1250,175 1258,135 1266,175" fill="#22E3FF" opacity="0.9" />
          <polygon points="1264,175 1272,145 1278,175" fill="#22E3FF" opacity="0.7" />
          <circle cx="1260" cy="155" r="25" fill="url(#crystal-glow)" />
        </g>

        {/* Foreground Horizon Islands */}
        <path
          d="M 0 380 L 0 310 Q 140 270 320 290 Q 520 310 720 280 Q 940 250 1140 290 Q 1320 320 1440 300 L 1440 380 Z"
          fill="url(#island-grad-front)"
        />

        {/* Hanging Lanterns from Arch */}
        <g className="animate-lantern-sway" style={{ transformOrigin: '80px 0' }}>
          <line x1="80" y1="0" x2="80" y2="90" stroke="#FF8A2B" strokeWidth="1.5" strokeDasharray="2,2" />
          <rect x="70" y="90" width="20" height="28" rx="4" fill="#FF8A2B" stroke="#FFF8E7" strokeWidth="1.5" />
          <circle cx="80" cy="104" r="5" fill="#FFF8E7" />
          <circle cx="80" cy="104" r="28" fill="url(#lantern-glow)" opacity="0.6" />
        </g>

        <g className="animate-lantern-sway" style={{ transformOrigin: '1360px 0', animationDelay: '-1.5s' }}>
          <line x1="1360" y1="0" x2="1360" y2="70" stroke="#FF8A2B" strokeWidth="1.5" strokeDasharray="2,2" />
          <rect x="1350" y="70" width="20" height="28" rx="4" fill="#FF8A2B" stroke="#FFF8E7" strokeWidth="1.5" />
          <circle cx="1360" cy="84" r="5" fill="#FFF8E7" />
          <circle cx="1360" cy="84" r="28" fill="url(#lantern-glow)" opacity="0.6" />
        </g>
      </svg>

      {/* 5. Subtle Vignette & Warm Horizon Fog */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FF8A2B]/15 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
