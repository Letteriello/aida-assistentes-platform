/**
 * AIDA Platform - Animation System
 * Framer Motion animation variants and utilities
 * Provides consistent animations across the platform
 */

import { Variants, Transition } from 'framer-motion';

// === ANIMATION VARIANTS ===

// Fade animations
export const fadeVariants: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Slide animations
export const slideVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Scale animations
export const scaleVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  }
};

// Page transition animations
export const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    x: -20 
  },
  in: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  out: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Modal animations
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

// Backdrop animations
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};

// Button hover animations
export const buttonHoverVariants: Variants = {
  rest: { 
    scale: 1 
  },
  hover: { 
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: 'easeOut'
    }
  }
};

// Card hover animations
export const cardHoverVariants: Variants = {
  rest: { 
    scale: 1,
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
  },
  hover: { 
    scale: 1.02,
    y: -4,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  }
};

// Loading spinner animation
export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Pulse animation for status indicators
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// === TRANSITION PRESETS ===

export const transitions = {
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  normal: { duration: 0.25, ease: 'easeOut' } as Transition,
  slow: { duration: 0.35, ease: 'easeOut' } as Transition,
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  bounce: { type: 'spring', stiffness: 400, damping: 10 } as Transition,
};

// === EASING FUNCTIONS ===

export const easings = {
  easeOut: [0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  smooth: [0.25, 0.46, 0.45, 0.94],
} as const;

// === UTILITY FUNCTIONS ===

/**
 * Creates a stagger animation for child elements
 */
export const createStagger = (staggerDelay = 0.1, delayChildren = 0) => ({
  visible: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren
    }
  }
});

/**
 * Creates a slide animation with custom direction
 */
export const createSlide = (direction: 'up' | 'down' | 'left' | 'right' = 'up', distance = 20) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
    }
  };

  return {
    hidden: { 
      opacity: 0, 
      ...getInitialPosition() 
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: transitions.normal
    }
  };
};

/**
 * Creates a scale animation with custom scale values
 */
export const createScale = (initialScale = 0.95, finalScale = 1) => ({
  hidden: { 
    opacity: 0, 
    scale: initialScale 
  },
  visible: { 
    opacity: 1, 
    scale: finalScale,
    transition: transitions.normal
  }
});

// === ANIMATION HOOKS ===

/**
 * Common animation props for motion components
 */
export const getAnimationProps = (variant: keyof typeof animationVariants) => ({
  variants: animationVariants[variant],
  initial: 'hidden',
  animate: 'visible',
  exit: 'exit'
});

// Animation variants collection
export const animationVariants = {
  fade: fadeVariants,
  slide: slideVariants,
  scale: scaleVariants,
  page: pageVariants,
  modal: modalVariants,
  backdrop: backdropVariants,
  buttonHover: buttonHoverVariants,
  cardHover: cardHoverVariants,
  spinner: spinnerVariants,
  pulse: pulseVariants,
  staggerContainer,
  staggerItem
} as const;

export type AnimationVariant = keyof typeof animationVariants;