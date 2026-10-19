/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sunset Realm Palette Tokens
        sunset: {
          violet: '#24104F',      // Base surfaces, panel fill
          purple: '#5B2EE0',      // Panel highlights, glows, secondary buttons
          magenta: '#FF3D9A',     // Hype accents, hits, league highlights
          orange: '#FF8A2B',      // Warm glow, streak flame, horizon
          yellow: '#FFD23F',      // XP, primary buttons, rewards
          cyan: '#22E3FF',        // Magic, shields, freezes, info
          lime: '#7CF36B',        // Correct, success, promotion
          candyRed: '#FF4D5E',    // Monsters, gentle wrong-answer feedback
          warmWhite: '#FFF8E7',   // Text on dark surfaces
          // Bevel shadow tones for 3D buttons
          yellowDark: '#D49B0E',
          purpleDark: '#3B1A99',
          orangeDark: '#C96008',
          cyanDark: '#0FA2B8',
          limeDark: '#4FA841',
        },
        // Backward-compatible realm aliases mapped to Sunset Realm
        realm: {
          twilight: '#24104F',
          plum: '#341A6E',
          gold: '#FFD23F',
          goldDark: '#D49B0E',
          mint: '#7CF36B',
          mintDark: '#4FA841',
          coral: '#FF4D5E',
          coralDark: '#C72A39',
          sky: '#22E3FF',
          skyDark: '#0FA2B8',
        },
        // Rarity Tokens
        rarity: {
          common: '#A6A2C2',
          uncommon: '#7CF36B',
          rare: '#22E3FF',
          epic: '#FF3D9A',
          legendaryStart: '#FFD23F',
          legendaryEnd: '#FF8A2B',
        },
      },
      fontFamily: {
        display: ['"Lilita One"', 'cursive', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        dyslexic: ['"OpenDyslexic"', '"Nunito Sans"', 'sans-serif'],
      },
      boxShadow: {
        'btn-3d-yellow': '0 5px 0 #D49B0E, 0 8px 16px rgba(255, 210, 63, 0.4)',
        'btn-3d-yellow-active': '0 2px 0 #D49B0E, 0 3px 6px rgba(255, 210, 63, 0.3)',
        'btn-3d-purple': '0 5px 0 #3B1A99, 0 8px 16px rgba(91, 46, 224, 0.4)',
        'btn-3d-purple-active': '0 2px 0 #3B1A99, 0 3px 6px rgba(91, 46, 224, 0.3)',
        'btn-3d-orange': '0 5px 0 #C96008, 0 8px 16px rgba(255, 138, 43, 0.4)',
        'btn-3d-cyan': '0 5px 0 #0FA2B8, 0 8px 16px rgba(34, 227, 255, 0.4)',
        'glow-yellow': '0 0 25px rgba(255, 210, 63, 0.65)',
        'glow-orange': '0 0 25px rgba(255, 138, 43, 0.65)',
        'glow-magenta': '0 0 25px rgba(255, 61, 154, 0.65)',
        'glow-cyan': '0 0 25px rgba(34, 227, 255, 0.65)',
        'glow-lime': '0 0 25px rgba(124, 243, 107, 0.65)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
      },
    },
  },
  plugins: [],
};
