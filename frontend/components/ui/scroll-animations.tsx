/**
 * AIDA Platform - Scroll-based Animations
 * Components and hooks for scroll-triggered animations
 */

'use client';

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedButton } from './animated-button';

// Hook for intersection observer animations
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
    ...options
  });

  return { ref, isInView };
}

// Reveal animation component
export function ScrollReveal({ 
  children, 
  className,
  direction = 'up',
  delay = 0,
  duration = 0.6
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
}) {
  const { ref, isInView } = useScrollReveal();

  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 50, opacity: 0 };
      case 'down': return { y: -50, opacity: 0 };
      case 'left': return { x: 50, opacity: 0 };
      case 'right': return { x: -50, opacity: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : getInitialPosition()}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
    >
      {children}
    </motion.div>
  );
}

// Parallax component
export function ParallaxContainer({ 
  children, 
  className,
  speed = 0.5 
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

// Scroll progress indicator
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent-cyan-500 z-50 origin-left',
        className
      )}
      style={{ scaleX: scrollYProgress }}
    />
  );
}

// Scroll to top button
export function ScrollToTop({ 
  showAfter = 400,
  className 
}: { 
  showAfter?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className={cn('fixed bottom-6 right-6 z-50', className)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatedButton
        onClick={scrollToTop}
        size="sm"
        className="rounded-full w-12 h-12 shadow-lg hover:shadow-xl"
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-4 w-4" />
      </AnimatedButton>
    </motion.div>
  );
}

// Stagger reveal for lists
export function StaggerReveal({ 
  children, 
  className,
  staggerDelay = 0.1 
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const { ref, isInView } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerRevealItem({ 
  children, 
  className 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.5,
            ease: 'easeOut'
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale on scroll
export function ScaleOnScroll({ 
  children, 
  className,
  scale = [0.8, 1] 
}: {
  children: React.ReactNode;
  className?: string;
  scale?: [number, number];
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const scaleValue = useTransform(scrollYProgress, [0, 0.5, 1], [scale[0], scale[1], scale[0]]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ scale: scaleValue }}
    >
      {children}
    </motion.div>
  );
}

// Fade on scroll
export function FadeOnScroll({ 
  children, 
  className 
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ opacity }}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation
export function TextReveal({ 
  text, 
  className,
  delay = 0 
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useScrollReveal();
  const words = text.split(' ');

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay
          }
        }
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-2"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: {
                duration: 0.5,
                ease: 'easeOut'
              }
            }
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Counter animation on scroll
export function CounterOnScroll({ 
  from = 0, 
  to, 
  duration = 2,
  className 
}: {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
}) {
  const { ref, isInView } = useScrollReveal();
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(from + (to - from) * progress));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}