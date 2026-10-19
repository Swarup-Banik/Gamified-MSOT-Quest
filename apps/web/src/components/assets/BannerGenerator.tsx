'use client';

import React from 'react';

export interface BannerGeneratorProps {
  bannerKey?: string;
  className?: string;
  aspectRatio?: string; // e.g., '16/9', '21/9', '3/1'
  animated?: boolean;
}

export function BannerGenerator({
  bannerKey = 'banner_sunset_campus',
  className = '',
  aspectRatio = '21/9',
  animated = false,
}: BannerGeneratorProps) {
  // Normalize key
  const key = bannerKey.toLowerCase().replace(/['"]/g, '');

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl select-none shadow-xl ${className}`}
      style={{ aspectRatio }}
      role="img"
      aria-label={`Cosmetic Banner: ${bannerKey}`}
    >
      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shared Twilight Gradients */}
          <linearGradient id="sunset-sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B1740" />
            <stop offset="35%" stopColor="#4A1E5C" />
            <stop offset="70%" stopColor="#8A2E54" />
            <stop offset="100%" stopColor="#FF7A3D" />
          </linearGradient>

          <linearGradient id="courtyard-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B091F" />
            <stop offset="50%" stopColor="#1E1645" />
            <stop offset="100%" stopColor="#452778" />
          </linearGradient>

          <linearGradient id="library-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#140F2D" />
            <stop offset="50%" stopColor="#251A4A" />
            <stop offset="100%" stopColor="#3E2468" />
          </linearGradient>

          <linearGradient id="crystal-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0D1B2A" />
            <stop offset="50%" stopColor="#1B263B" />
            <stop offset="100%" stopColor="#415A77" />
          </linearGradient>

          <linearGradient id="cyber-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#050510" />
            <stop offset="60%" stopColor="#13092C" />
            <stop offset="100%" stopColor="#300854" />
          </linearGradient>

          <linearGradient id="aurora-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#051923" />
            <stop offset="40%" stopColor="#003554" />
            <stop offset="70%" stopColor="#006466" />
            <stop offset="100%" stopColor="#065A60" />
          </linearGradient>

          <linearGradient id="cosmic-sky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#08020F" />
            <stop offset="30%" stopColor="#220038" />
            <stop offset="70%" stopColor="#530066" />
            <stop offset="100%" stopColor="#8A0059" />
          </linearGradient>

          {/* Golden Sun & Moon Glow */}
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="1" />
            <stop offset="40%" stopColor="#FF8A3D" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF5E6C" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="aurora-beam" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#3DDC97" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#4CC9F0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3DDC97" stopOpacity="0" />
          </radialGradient>

          <filter id="banner-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. SUNSET TWILIGHT CAMPUS (Starter) */}
        {(key === 'banner_sunset_campus' || key === 'default') && (
          <g id="sunset_campus">
            <rect width="1200" height="400" fill="url(#sunset-sky-grad)" />
            {/* Massive Sunset Orb */}
            <circle cx="600" cy="280" r="140" fill="url(#sun-glow)" opacity="0.9" />
            {/* Distant Mountains */}
            <polygon points="0,320 220,240 450,330 700,220 950,310 1200,230 1200,400 0,400" fill="#24133B" opacity="0.7" />
            {/* Campus Skyline Silhouettes: Towers, Observatories */}
            <path
              d="M 50,400 L 50,260 L 90,260 L 90,230 L 110,210 L 130,230 L 130,260 L 170,260 L 170,400 Z"
              fill="#180C2A"
            />
            {/* Clock Tower / Spire */}
            <path
              d="M 320,400 L 320,180 L 340,160 L 350,110 L 360,160 L 380,180 L 380,400 Z"
              fill="#150824"
            />
            {/* Glowing Spire Lantern */}
            <circle cx="350" cy="140" r="5" fill="#FFC83D" filter="url(#banner-glow)" />
            {/* Great Dome */}
            <path
              d="M 520,400 L 520,280 Q 600,210 680,280 L 680,400 Z"
              fill="#1B0E2E"
            />
            <rect x="585" y="210" width="30" height="20" fill="#FFC83D" opacity="0.85" rx="3" />
            {/* Right Spire & Library Arch */}
            <path
              d="M 820,400 L 820,200 L 840,170 L 850,130 L 860,170 L 880,200 L 880,400 Z"
              fill="#150824"
            />
            <circle cx="850" cy="160" r="4" fill="#FFC83D" />
            {/* Fore-hills with Lantern Posts */}
            <path
              d="M 0,340 Q 300,310 600,350 T 1200,330 L 1200,400 L 0,400 Z"
              fill="#0D0717"
            />
            {/* Glowing Lanterns */}
            {[180, 420, 750, 980, 1100].map((lx, idx) => (
              <g key={idx}>
                <line x1={lx} y1="330" x2={lx} y2="360" stroke="#4A3B69" strokeWidth="3" />
                <circle cx={lx} cy="326" r="6" fill="#FFC83D" filter="url(#banner-glow)" />
                <circle cx={lx} cy="326" r="2.5" fill="#FFFFFF" />
              </g>
            ))}
          </g>
        )}

        {/* 2. LANTERN STUDY COURTYARD */}
        {key === 'banner_lantern_courtyard' && (
          <g id="lantern_courtyard">
            <rect width="1200" height="400" fill="url(#courtyard-sky)" />
            {/* Moon in sky */}
            <circle cx="950" cy="90" r="45" fill="#FFEBB0" opacity="0.8" />
            <circle cx="970" cy="80" r="40" fill="#1E1645" />
            {/* Stone Arches & Courtyard Pergola */}
            <path d="M 0,180 Q 200,120 400,180 L 400,400 L 0,400 Z" fill="#150F33" opacity="0.8" />
            <path d="M 800,180 Q 1000,120 1200,180 L 1200,400 L 800,400 Z" fill="#150F33" opacity="0.8" />
            {/* Center Stone Archways */}
            <path
              d="M 250,400 L 250,220 Q 400,160 550,220 L 550,400 L 500,400 L 500,260 Q 400,210 300,260 L 300,400 Z"
              fill="#0E0A24"
            />
            <path
              d="M 650,400 L 650,220 Q 800,160 950,220 L 950,400 L 900,400 L 900,260 Q 800,210 700,260 L 700,400 Z"
              fill="#0E0A24"
            />
            {/* Hanging Lantern Strings */}
            <path d="M 100,120 Q 300,190 500,140 Q 700,200 900,150 Q 1050,190 1200,130" fill="none" stroke="#FFC83D" strokeWidth="2" opacity="0.6" />
            {/* Hanging Lanterns */}
            {[200, 320, 460, 600, 720, 850, 1020].map((lx, idx) => (
              <g key={idx}>
                <line x1={lx} y1="160" x2={lx} y2="185" stroke="#FFE066" strokeWidth="1.5" />
                <polygon points={`${lx-7},185 ${lx+7},185 ${lx+10},205 ${lx-10},205`} fill="#FF8A3D" />
                <circle cx={lx} cy="195" r="5" fill="#FFEBB0" filter="url(#banner-glow)" />
              </g>
            ))}
            {/* Ground cobblestones */}
            <rect x="0" y="340" width="1200" height="60" fill="#0A071A" />
          </g>
        )}

        {/* 3. GREAT LIBRARY HALLS */}
        {key === 'banner_great_library' && (
          <g id="great_library">
            <rect width="1200" height="400" fill="url(#library-sky)" />
            {/* Massive Rose Window in Center */}
            <circle cx="600" cy="160" r="90" fill="#2E1C59" stroke="#FFC83D" strokeWidth="4" />
            <circle cx="600" cy="160" r="75" fill="none" stroke="#4CC9F0" strokeWidth="2" strokeDasharray="6,4" />
            <polygon points="600,75 620,160 600,245 580,160" fill="#FF5E6C" opacity="0.6" />
            <polygon points="515,160 600,180 685,160 600,140" fill="#FFC83D" opacity="0.6" />
            {/* Endless Multi-Tiered Bookcases Left & Right */}
            {[-80, 50, 180].map((bx, idx) => (
              <g key={`lb-${idx}`} fill="#181136">
                <rect x={bx} y="80" width="110" height="320" />
                {[120, 170, 220, 270, 320, 370].map((sy, sidx) => (
                  <rect key={sidx} x={bx+5} y={sy} width="100" height="6" fill="#4B3B6E" />
                ))}
              </g>
            ))}
            {[-80, 50, 180].map((bx, idx) => (
              <g key={`books-l-${idx}`}>
                <rect x={bx+10} y="130" width="15" height="36" fill="#FF5E6C" />
                <rect x={bx+30} y="135" width="12" height="31" fill="#4CC9F0" />
                <rect x={bx+45} y="128" width="18" height="38" fill="#FFC83D" />
                <rect x={bx+70} y="132" width="14" height="34" fill="#3DDC97" />
              </g>
            ))}
            {/* Right Bookcases */}
            {[910, 1040, 1170].map((bx, idx) => (
              <g key={`rb-${idx}`} fill="#181136">
                <rect x={bx} y="80" width="110" height="320" />
                {[120, 170, 220, 270, 320, 370].map((sy, sidx) => (
                  <rect key={sidx} x={bx+5} y={sy} width="100" height="6" fill="#4B3B6E" />
                ))}
              </g>
            ))}
            {/* Floating Glyphs / Knowledge Runes */}
            {[420, 480, 720, 780].map((gx, idx) => (
              <g key={idx} opacity="0.7">
                <circle cx={gx} cy={220 + (idx % 2) * 30} r="8" fill="none" stroke="#FFC83D" strokeWidth="2" filter="url(#banner-glow)" />
                <polygon points={`${gx},${214 + (idx % 2) * 30} ${gx+5},${225 + (idx % 2) * 30} ${gx-5},${225 + (idx % 2) * 30}`} fill="#FFC83D" />
              </g>
            ))}
            {/* Reading Floor */}
            <rect x="0" y="350" width="1200" height="50" fill="#0E0A21" />
          </g>
        )}

        {/* 4. FLOATING CRYSTAL PEAKS */}
        {key === 'banner_crystal_islands' && (
          <g id="crystal_islands">
            <rect width="1200" height="400" fill="url(#crystal-sky)" />
            {/* Stars */}
            {[50, 180, 320, 500, 700, 850, 1020, 1140].map((sx, idx) => (
              <circle key={idx} cx={sx} cy={30 + (idx * 17) % 120} r="1.5" fill="#FFFFFF" opacity="0.8" />
            ))}
            {/* Floating Islands */}
            <path d="M 120,240 Q 240,220 360,250 Q 240,340 120,240 Z" fill="#1B2838" />
            <polygon points="200,240 220,180 240,240" fill="#4CC9F0" opacity="0.9" filter="url(#banner-glow)" />
            <polygon points="230,245 250,160 270,245" fill="#3DDC97" opacity="0.85" />

            {/* Giant Central Floating Isle */}
            <path d="M 450,210 Q 600,180 780,220 Q 620,360 450,210 Z" fill="#141E2B" />
            {/* Towering Prismatic Crystal Spire */}
            <polygon points="580,210 610,60 640,210" fill="#64DFDF" filter="url(#banner-glow)" />
            <polygon points="610,60 625,210 640,210" fill="#48CAE4" />
            <polygon points="540,215 565,120 590,215" fill="#72EFDD" opacity="0.8" />
            <polygon points="630,215 655,130 680,215" fill="#52B788" opacity="0.75" />

            {/* Right Floating Isle */}
            <path d="M 880,260 Q 1000,230 1120,270 Q 1000,360 880,260 Z" fill="#1B2838" />
            <polygon points="980,260 1005,190 1030,260" fill="#4CC9F0" opacity="0.9" />
            {/* Glowing Leyline bridge */}
            <path d="M 360,250 Q 420,270 480,240" fill="none" stroke="#4CC9F0" strokeWidth="3" strokeDasharray="5,5" filter="url(#banner-glow)" />
            <path d="M 750,235 Q 820,280 900,265" fill="none" stroke="#3DDC97" strokeWidth="3" strokeDasharray="5,5" filter="url(#banner-glow)" />
          </g>
        )}

        {/* 5. BINARY CONSTELLATIONS */}
        {key === 'banner_binary_stars' && (
          <g id="binary_stars">
            <rect width="1200" height="400" fill="#08071A" />
            {/* Star Grid / Matrix Nodes */}
            <path
              d="M 100,120 L 250,80 L 400,150 L 580,90 L 740,160 L 920,80 L 1100,130"
              fill="none"
              stroke="#4CC9F0"
              strokeWidth="2"
              opacity="0.5"
            />
            <path
              d="M 180,240 L 320,190 L 520,270 L 680,200 L 860,260 L 1040,190"
              fill="none"
              stroke="#B26CFF"
              strokeWidth="2"
              opacity="0.4"
            />
            {/* Constellation Nodes */}
            {[
              [100,120], [250,80], [400,150], [580,90], [740,160], [920,80], [1100,130],
              [180,240], [320,190], [520,270], [680,200], [860,260], [1040,190]
            ].map(([cx, cy], idx) => (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="6" fill="#FFC83D" filter="url(#banner-glow)" />
                <circle cx={cx} cy={cy} r="2.5" fill="#FFFFFF" />
              </g>
            ))}
            {/* Binary Numbers glowing in background */}
            {['01001101', '01010011', '01001111', '01010100', '10101011', '00110001'].map((bin, idx) => (
              <text
                key={idx}
                x={120 + idx * 180}
                y={330 + (idx % 2) * 20}
                fill="#3DDC97"
                fontSize="18"
                fontFamily="monospace"
                opacity="0.65"
              >
                {bin}
              </text>
            ))}
          </g>
        )}

        {/* 6. GOLDEN AUTUMN GROVE */}
        {key === 'banner_autumn_grove' && (
          <g id="autumn_grove">
            <rect width="1200" height="400" fill="#240D1B" />
            {/* Golden gradient sunset backdrop */}
            <rect width="1200" height="400" fill="url(#sunset-sky-grad)" opacity="0.6" />
            {/* Stylized Autumn Trees */}
            {[80, 240, 420, 600, 780, 960, 1120].map((tx, idx) => (
              <g key={idx}>
                {/* Trunk */}
                <rect x={tx-6} y="220" width="12" height="150" fill="#3D1D16" rx="3" />
                {/* Foliage Orbs */}
                <circle cx={tx} cy="180" r={45 + (idx % 3) * 10} fill={idx % 2 === 0 ? '#FF8A3D' : '#FFC83D'} opacity="0.85" />
                <circle cx={tx-15} cy="160" r={30} fill="#FF5E6C" opacity="0.75" />
                <circle cx={tx+18} cy="165" r={28} fill="#FFE066" opacity="0.8" />
              </g>
            ))}
            {/* Ground foliage hill */}
            <path d="M 0,330 Q 300,290 600,340 T 1200,310 L 1200,400 L 0,400 Z" fill="#42131F" />
            {/* Floating Maple Leaf Specks */}
            {[150, 310, 520, 730, 890, 1050].map((lx, idx) => (
              <polygon
                key={idx}
                points={`${lx},${270 + (idx%3)*20} ${lx+8},${282 + (idx%3)*20} ${lx-8},${282 + (idx%3)*20}`}
                fill="#FFC83D"
                filter="url(#banner-glow)"
              />
            ))}
          </g>
        )}

        {/* 7. NEON CYBER SKYLINE */}
        {key === 'banner_cyber_skyline' && (
          <g id="cyber_skyline">
            <rect width="1200" height="400" fill="url(#cyber-sky)" />
            {/* Cyber Grid Lines on ground */}
            <polygon points="0,400 300,280 900,280 1200,400" fill="#13072B" />
            {[100, 250, 400, 550, 700, 850, 1000, 1150].map((gx, idx) => (
              <line key={idx} x1={gx} y1="400" x2={600} y2="280" stroke="#FF5E6C" strokeWidth="1" opacity="0.3" />
            ))}
            {/* Neon Skyscrapers */}
            <rect x="150" y="140" width="80" height="260" fill="#0B061A" stroke="#4CC9F0" strokeWidth="2" />
            <rect x="290" y="80" width="110" height="320" fill="#0E0821" stroke="#FF5E6C" strokeWidth="2" />
            <rect x="460" y="160" width="70" height="240" fill="#0B061A" stroke="#3DDC97" strokeWidth="2" />
            <rect x="580" y="60" width="130" height="340" fill="#12092E" stroke="#FFC83D" strokeWidth="2.5" />
            <rect x="760" y="120" width="90" height="280" fill="#0E0821" stroke="#B26CFF" strokeWidth="2" />
            <rect x="910" y="150" width="80" height="250" fill="#0B061A" stroke="#4CC9F0" strokeWidth="2" />
            {/* Neon Spire Beams */}
            <line x1="645" y1="0" x2="645" y2="60" stroke="#FFC83D" strokeWidth="4" filter="url(#banner-glow)" />
            <line x1="345" y1="20" x2="345" y2="80" stroke="#FF5E6C" strokeWidth="3" filter="url(#banner-glow)" />
          </g>
        )}

        {/* 8. RECURSION GOLDEN SPIRAL */}
        {key === 'banner_recursion_spiral' && (
          <g id="recursion_spiral">
            <rect width="1200" height="400" fill="#120D2E" />
            {/* Concentric / Fibonacci Arc Trails */}
            <circle cx="600" cy="200" r="180" fill="none" stroke="#FFC83D" strokeWidth="2" opacity="0.2" />
            <circle cx="600" cy="200" r="140" fill="none" stroke="#FF8A3D" strokeWidth="2.5" opacity="0.4" />
            <circle cx="600" cy="200" r="100" fill="none" stroke="#B26CFF" strokeWidth="3" opacity="0.6" />
            <circle cx="600" cy="200" r="65" fill="none" stroke="#4CC9F0" strokeWidth="3.5" opacity="0.8" />
            <circle cx="600" cy="200" r="35" fill="none" stroke="#3DDC97" strokeWidth="4" filter="url(#banner-glow)" />
            <circle cx="600" cy="200" r="12" fill="#FFE066" filter="url(#banner-glow)" />
            {/* Recursive Branch Lines */}
            <path
              d="M 600,200 Q 750,100 900,160 T 1100,120"
              fill="none"
              stroke="#FFC83D"
              strokeWidth="3"
              filter="url(#banner-glow)"
            />
            <path
              d="M 600,200 Q 450,300 300,240 T 100,280"
              fill="none"
              stroke="#FF8A3D"
              strokeWidth="3"
              filter="url(#banner-glow)"
            />
            <text x="560" y="360" fill="#FFC83D" fontSize="16" letterSpacing="4" fontFamily="monospace" opacity="0.75">
              BASE_CASE(RETURN 1)
            </text>
          </g>
        )}

        {/* 9. AURORA CITADEL OF MASTERY (Epic) */}
        {key === 'banner_aurora_citadel' && (
          <g id="aurora_citadel">
            <rect width="1200" height="400" fill="url(#aurora-sky)" />
            {/* Aurora Curtains */}
            <path
              d="M 0,80 Q 300,20 600,90 T 1200,40 L 1200,220 Q 900,140 600,200 T 0,160 Z"
              fill="url(#aurora-beam)"
              opacity="0.8"
            />
            <path
              d="M 0,40 Q 350,110 700,30 T 1200,70 L 1200,190 Q 800,250 400,180 T 0,120 Z"
              fill="#3DDC97"
              opacity="0.25"
              filter="url(#banner-glow)"
            />
            {/* Stately Citadel Spires */}
            <polygon points="500,400 550,150 600,400" fill="#041E26" />
            <polygon points="570,400 620,90 670,400" fill="#02141A" />
            <polygon points="640,400 690,160 740,400" fill="#041E26" />
            {/* Citadel Lanterns */}
            <circle cx="620" cy="90" r="5" fill="#3DDC97" filter="url(#banner-glow)" />
            <circle cx="550" cy="150" r="4" fill="#4CC9F0" filter="url(#banner-glow)" />
            <circle cx="690" cy="160" r="4" fill="#4CC9F0" filter="url(#banner-glow)" />
            {/* Reflective Lake Base */}
            <rect x="0" y="320" width="1200" height="80" fill="#021015" />
            <line x1="0" y1="320" x2="1200" y2="320" stroke="#3DDC97" strokeWidth="2" opacity="0.6" filter="url(#banner-glow)" />
          </g>
        )}

        {/* 10. SOVEREIGN NEBULA OF ETERNITY (Legendary) */}
        {key === 'banner_cosmic_nebula' && (
          <g id="cosmic_nebula">
            <rect width="1200" height="400" fill="url(#cosmic-sky)" />
            {/* Galactic Swirl Dust */}
            <ellipse cx="600" cy="200" rx="450" ry="140" fill="#B26CFF" opacity="0.3" transform="rotate(-15 600 200)" filter="url(#banner-glow)" />
            <ellipse cx="600" cy="200" rx="300" ry="80" fill="#FFC83D" opacity="0.35" transform="rotate(-15 600 200)" filter="url(#banner-glow)" />
            {/* Black Hole / Singularity Horizon */}
            <circle cx="600" cy="200" r="45" fill="#05000A" stroke="#FFC83D" strokeWidth="4" filter="url(#banner-glow)" />
            <circle cx="600" cy="200" r="52" fill="none" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.9" />
            {/* Starburst Prisms */}
            {[100, 220, 380, 520, 680, 840, 1000, 1120].map((sx, idx) => (
              <g key={idx}>
                <circle cx={sx} cy={50 + (idx * 33) % 280} r={idx % 3 === 0 ? 3.5 : 2} fill="#FFFFFF" />
                {idx % 2 === 0 && (
                  <line
                    x1={sx - 8}
                    y1={50 + (idx * 33) % 280}
                    x2={sx + 8}
                    y2={50 + (idx * 33) % 280}
                    stroke="#FFC83D"
                    strokeWidth="1"
                  />
                )}
              </g>
            ))}
          </g>
        )}

        {/* Subtle Vignette Overlay for Depth */}
        <rect
          width="1200"
          height="400"
          fill="none"
          stroke="#1B1740"
          strokeWidth="12"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
