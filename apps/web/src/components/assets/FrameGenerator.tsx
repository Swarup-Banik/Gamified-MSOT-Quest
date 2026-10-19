'use client';

import React from 'react';

export interface FrameGeneratorProps {
  frameKey?: string;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FrameGenerator({
  frameKey = 'frame_rustic_wood',
  size = 96,
  className = '',
  children,
}: FrameGeneratorProps) {
  const key = (frameKey || 'frame_rustic_wood').toLowerCase().replace(/['"]/g, '');

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Avatar Frame: ${frameKey}`}
    >
      {/* Underlying Content (e.g. Avatar) */}
      <div className="absolute inset-[10%] rounded-full overflow-hidden flex items-center justify-center">
        {children}
      </div>

      {/* SVG Decorative Frame Overlay */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id={`frame-glow-${key}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="gold-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#FFC83D" />
            <stop offset="100%" stopColor="#D49F13" />
          </linearGradient>

          <linearGradient id="silver-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="bronze-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>

        {/* 1. RUSTIC LANTERN WOOD (Starter) */}
        {(key === 'frame_rustic_wood' || key === 'default') && (
          <g id="rustic_wood">
            {/* Outer Wood Bevel Ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#78350F" strokeWidth="8" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#451A03" strokeWidth="2" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#92400E" strokeWidth="2" />
            {/* Corner Brass Studs */}
            {[
              [16, 16], [84, 16], [16, 84], [84, 84]
            ].map(([cx, cy], idx) => (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="4" fill="#FFC83D" stroke="#78350F" strokeWidth="1.5" />
                <circle cx={cx - 1} cy={cy - 1} r="1.5" fill="#FFEAA7" />
              </g>
            ))}
          </g>
        )}

        {/* 2. CAMPUS MASONRY STONE */}
        {key === 'frame_campus_stone' && (
          <g id="campus_stone">
            {/* Beveled Castle Stone Ring */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#64748B" strokeWidth="9" />
            <circle cx="50" cy="50" r="49" fill="none" stroke="#334155" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1E293B" strokeWidth="1.5" />
            {/* Stone Notch Mortar lines */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + Math.cos(rad) * 40.5;
              const y1 = 50 + Math.sin(rad) * 40.5;
              const x2 = 50 + Math.cos(rad) * 49.5;
              const y2 = 50 + Math.sin(rad) * 49.5;
              return <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1E293B" strokeWidth="2" />;
            })}
          </g>
        )}

        {/* 3. BRONZE SCHOLAR MEDALLION */}
        {key === 'frame_bronze_stud' && (
          <g id="bronze_stud">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#bronze-metal-grad)" strokeWidth="8" />
            <circle cx="50" cy="50" r="49" fill="none" stroke="#78350F" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#78350F" strokeWidth="1.5" />
            {/* Stud Rivets Around Rim */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 45;
              const cy = 50 + Math.sin(rad) * 45;
              return <circle key={idx} cx={cx} cy={cy} r="2" fill="#FEF3C7" stroke="#78350F" strokeWidth="0.8" />;
            })}
          </g>
        )}

        {/* 4. SILVER FILIGREE CREST */}
        {key === 'frame_silver_filigree' && (
          <g id="silver_filigree">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#silver-metal-grad)" strokeWidth="7" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#475569" strokeWidth="1.5" />
            {/* Filigree Ornaments Top, Bottom, Left, Right */}
            <path d="M 50 2 Q 55 9 50 15 Q 45 9 50 2 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 50 98 Q 55 91 50 85 Q 45 91 50 98 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 2 50 Q 9 55 15 50 Q 9 45 2 50 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            <path d="M 98 50 Q 91 55 85 50 Q 91 45 98 50 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
            {/* Center Top Pearl */}
            <circle cx="50" cy="9" r="3" fill="#FFFFFF" stroke="#64748B" strokeWidth="1" />
          </g>
        )}

        {/* 5. EMERALD IVY WREATH */}
        {key === 'frame_emerald_vine' && (
          <g id="emerald_vine">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#15803D" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#22C55E" strokeWidth="2" strokeDasharray="5,3" />
            {/* Stylized Emerald Leaves Around Rim */}
            {[15, 60, 105, 150, 195, 240, 285, 330].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 45;
              const cy = 50 + Math.sin(rad) * 45;
              return (
                <ellipse
                  key={idx}
                  cx={cx}
                  cy={cy}
                  rx="6"
                  ry="3.5"
                  fill="#3DDC97"
                  stroke="#166534"
                  strokeWidth="1"
                  transform={`rotate(${angle + 45} ${cx} ${cy})`}
                />
              );
            })}
            {/* Small Glowing Dew Berries */}
            {[45, 135, 225, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 46;
              const cy = 50 + Math.sin(rad) * 46;
              return <circle key={idx} cx={cx} cy={cy} r="2.5" fill="#4CC9F0" filter={`url(#frame-glow-${key})`} />;
            })}
          </g>
        )}

        {/* 6. PRISMATIC CRYSTAL EDGE */}
        {key === 'frame_prismatic_crystal' && (
          <g id="prismatic_crystal">
            {/* Octagonal Crystal Ring */}
            <polygon
              points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30"
              fill="none"
              stroke="#4CC9F0"
              strokeWidth="5"
              filter={`url(#frame-glow-${key})`}
            />
            <polygon
              points="32,9 68,9 91,32 91,68 68,91 32,91 9,68 9,32"
              fill="none"
              stroke="#A5F3FC"
              strokeWidth="2"
            />
            {/* Crystal Shards at 4 corners */}
            {[
              [12, 12, 45], [88, 12, 135], [88, 88, 225], [12, 88, 315]
            ].map(([cx, cy, rot], idx) => (
              <polygon
                key={idx}
                points={`${cx},${cy-7} ${cx+4},${cy+7} ${cx-4},${cy+7}`}
                fill="#3DDC97"
                transform={`rotate(${rot} ${cx} ${cy})`}
              />
            ))}
          </g>
        )}

        {/* 7. NEON OVERDRIVE CIRCUIT */}
        {key === 'frame_neon_overdrive' && (
          <g id="neon_overdrive">
            {/* Futuristic Hexagonal Circuit Outline */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="#FF5E6C" strokeWidth="4" filter={`url(#frame-glow-${key})`} />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#3DDC97" strokeWidth="2" strokeDasharray="14,6,4,6" />
            {/* Circuit Nodes */}
            {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 46;
              const cy = 50 + Math.sin(rad) * 46;
              return (
                <g key={idx}>
                  <rect x={cx-3} y={cy-3} width="6" height="6" fill="#1B1740" stroke="#FFC83D" strokeWidth="1.5" />
                  <circle cx={cx} cy={cy} r="1.5" fill="#3DDC97" />
                </g>
              );
            })}
          </g>
        )}

        {/* 8. GILDED TOP-CODER CREST (Epic) */}
        {key === 'frame_gilded_crest' && (
          <g id="gilded_crest">
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gold-metal-grad)" strokeWidth="8" filter={`url(#frame-glow-${key})`} />
            <circle cx="50" cy="50" r="49" fill="none" stroke="#B45309" strokeWidth="2" />
            <circle cx="50" cy="50" r="41" fill="none" stroke="#FDE68A" strokeWidth="1.5" />
            {/* Crown Crest atop the Frame */}
            <polygon points="40,12 45,2 50,7 55,2 60,12 58,16 42,16" fill="url(#gold-metal-grad)" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="50" cy="5" r="2.5" fill="#FF5E6C" />
            <circle cx="45" cy="4" r="1.5" fill="#4CC9F0" />
            <circle cx="55" cy="4" r="1.5" fill="#4CC9F0" />
            {/* Side Laurel Leaves */}
            <path d="M 8 50 Q 12 36 22 28" fill="none" stroke="#FFC83D" strokeWidth="3" />
            <path d="M 92 50 Q 88 36 78 28" fill="none" stroke="#FFC83D" strokeWidth="3" />
          </g>
        )}

        {/* 9. ASTRAL HALO OF THE ANCIENTS (Legendary) */}
        {key === 'frame_celestial_astral' && (
          <g id="celestial_astral">
            {/* Outer Pulsing Golden Sunburst / Celestial Rings */}
            <circle cx="50" cy="50" r="47" fill="none" stroke="#FFC83D" strokeWidth="3" strokeDasharray="3,3" filter={`url(#frame-glow-${key})`} />
            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#gold-metal-grad)" strokeWidth="6" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#FFFBEB" strokeWidth="1.5" />
            {/* 8 Prismatic Ray Stars */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 50 + Math.cos(rad) * 48;
              const cy = 50 + Math.sin(rad) * 48;
              return (
                <polygon
                  key={idx}
                  points={`${cx},${cy-4} ${cx+3},${cy} ${cx},${cy+4} ${cx-3},${cy}`}
                  fill="#FFFFFF"
                  filter={`url(#frame-glow-${key})`}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
