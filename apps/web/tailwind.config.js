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
        // Campus Realm Palette Tokens
        realm: {
          twilight: '#1B1740', // Deep app background
          plum: '#2D2466',     // Panels, HUD surfaces, card backgrounds
          gold: '#FFC83D',     // Lantern gold, XP, primary buttons
          goldDark: '#D49F13', // 3D bevel shadow for primary buttons
          mint: '#3DDC97',     // Success, streak safe, correct answers
          mintDark: '#28A770', // Bevel shadow for mint
          coral: '#FF5E6C',    // Monsters, gentle wrong-answer nudge
          coralDark: '#D93B4A',// Bevel shadow for coral
          sky: '#4CC9F0',      // Links, shields, freezes, info
          skyDark: '#2BA6CC',  // Bevel shadow for sky
          // Daybreak (Light) theme palette
          daybreakBg: '#F8F6F0',
          daybreakCard: '#FFFFFF',
          daybreakBorder: '#E2D9F3',
          daybreakText: '#2D2466',
        },
        // Rarity Tokens
        rarity: {
          common: '#9AA3B2',
          uncommon: '#3DDC97',
          rare: '#4CC9F0',
          epic: '#B26CFF',
          legendaryStart: '#FFC83D',
          legendaryEnd: '#FF8A3D',
        },
      },
      fontFamily: {
        display: ['"Lilita One"', 'cursive', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        dyslexic: ['"OpenDyslexic"', '"Nunito Sans"', 'sans-serif'],
      },
      boxShadow: {
        'button-3d-gold': '0 4px 0 #D49F13',
        'button-3d-gold-active': '0 1px 0 #D49F13',
        'button-3d-plum': '0 4px 0 #181438',
        'button-3d-coral': '0 4px 0 #D93B4A',
        'button-3d-mint': '0 4px 0 #28A770',
        'button-3d-sky': '0 4px 0 #2BA6CC',
        'glow-gold': '0 0 24px rgba(255, 200, 61, 0.45)',
        'glow-mint': '0 0 24px rgba(61, 220, 151, 0.45)',
        'glow-coral': '0 0 24px rgba(255, 94, 108, 0.45)',
        'glow-sky': '0 0 24px rgba(76, 201, 240, 0.45)',
        'glow-epic': '0 0 24px rgba(178, 108, 255, 0.45)',
      },
    },
  },
  plugins: [],
};
