/**
 * MSOT Quest — Motion Tokens & Animation Presets
 * Single source of truth for all animation timings, spring physics, and variants.
 */

export const motionDurations = {
  instant: 0.08, // 80ms: button presses, toggles, instant micro-interactions
  quick: 0.16,   // 160ms: hover states, tooltips, tab indicator glides
  base: 0.24,    // 240ms: modal entrances, card expansions, standard transitions
  slow: 0.40,    // 400ms: drawer slides, page crossfades, accordion unfolds
  epic: 0.90,    // 900ms: chest unlocks, boss transformations, level-up fanfares
} as const;

export const motionDurationsMs = {
  instant: 80,
  quick: 160,
  base: 240,
  slow: 400,
  epic: 900,
} as const;

export const motionSprings = {
  snappy: { type: 'spring', stiffness: 420, damping: 28 },
  bouncy: { type: 'spring', stiffness: 260, damping: 16 },
  heavy: { type: 'spring', stiffness: 140, damping: 18 },
} as const;

export const motionEasings = {
  standard: [0.2, 0, 0, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
  accelerate: [0.4, 0, 1, 1] as const,
  bounceOut: [0.34, 1.56, 0.64, 1] as const,
};

export const motionStagger = {
  step: 0.04, // 40ms stagger between sequential list/grid items
  maxHeroConcurrent: 1, // Global limit of 1 hero animation at a time
};

/**
 * Standard Framer Motion variants for common UI roles
 */
export const entranceVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * motionStagger.step,
      duration: motionDurations.base,
      ease: motionEasings.decelerate,
    },
  }),
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: motionStagger.step,
    },
  },
};

export const cardHoverVariants = {
  rest: { y: 0, scale: 1, rotateX: 0, rotateY: 0 },
  hover: {
    y: -4,
    scale: 1.015,
    transition: motionSprings.snappy,
  },
  press: {
    scale: 0.97,
    y: 0,
    transition: motionSprings.snappy,
  },
};

export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: motionSprings.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 4,
    transition: { duration: motionDurations.quick },
  },
};
