/**
 * AIDA Platform - Onboarding Components
 * Progressive disclosure and user guidance system
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Lightbulb, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';

// Onboarding Step Interface
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skippable?: boolean;
}

// Main Onboarding Component
interface OnboardingProps {
  steps: OnboardingStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

export function Onboarding({
  steps,
  isActive,
  onComplete,
  onSkip,
  className
}: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];

  // Update target position when step changes
  useEffect(() => {
    if (!isActive || !currentStepData?.target) return;

    const updatePosition = () => {
      const element = document.querySelector(currentStepData.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetPosition({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, currentStepData, isActive]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    onSkip?.();
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className={cn('fixed inset-0 z-50', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with spotlight effect */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm">
          {currentStepData?.target && (
            <motion.div
              className="absolute border-4 border-primary rounded-lg shadow-2xl"
              style={{
                left: targetPosition.x - 8,
                top: targetPosition.y - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
        </div>

        {/* Onboarding Card */}
        <motion.div
          className="absolute z-10"
          style={{
            left: currentStepData?.target ? 
              Math.min(targetPosition.x, window.innerWidth - 400) : 
              '50%',
            top: currentStepData?.target ? 
              targetPosition.y + targetPosition.height + 20 : 
              '50%',
            transform: currentStepData?.target ? 
              'none' : 
              'translate(-50%, -50%)'
          }}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Card className="w-96 max-w-[90vw] shadow-2xl border-primary/20">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {currentStep + 1} de {steps.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipOnboarding}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {currentStepData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Action Button */}
                {currentStepData.action && (
                  <Button
                    onClick={currentStepData.action.onClick}
                    className="w-full"
                    variant="outline"
                  >
                    {currentStepData.action.label}
                  </Button>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </Button>

                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === currentStep ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>

                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="flex items-center space-x-1"
                  >
                    <span>
                      {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    </span>
                    {currentStep === steps.length - 1 ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Feature Highlight Component
interface FeatureHighlightProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isNew?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function FeatureHighlight({
  title,
  description,
  icon = <Zap className="h-5 w-5" />,
  isNew = false,
  onDismiss,
  className
}: FeatureHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={cn(
        'relative p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20',
        className
      )}
    >
      {isNew && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
            Novo
          </div>
        </div>
      )}

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// Progress Indicator for multi-step processes
interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className
}: ProgressIndicatorProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors',
              completedSteps.includes(index) && 'bg-green-500 border-green-500 text-white',
              index === currentStep && !completedSteps.includes(index) && 'border-primary text-primary',
              index !== currentStep && !completedSteps.includes(index) && 'border-muted text-muted-foreground'
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {completedSteps.includes(index) ? (
              <Check className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </motion.div>
          
          {index < steps.length - 1 && (
            <motion.div
              className={cn(
                'w-12 h-0.5 mx-2 transition-colors',
                completedSteps.includes(index) ? 'bg-green-500' : 'bg-muted'
              )}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Quick Tips Component
interface QuickTipProps {
  tips: string[];
  className?: string;
}

export function QuickTips({ tips, className }: QuickTipProps) {
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (tips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
        <Lightbulb className="h-4 w-4" />
        <span className="font-medium">Dica</span>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.p
          key={currentTip}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-sm"
        >
          {tips[currentTip]}
        </motion.p>
      </AnimatePresence>

      {tips.length > 1 && (
        <div className="flex space-x-1 mt-3">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentTip ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Guided Tour Hook
export function useGuidedTour(steps: OnboardingStep[]) {
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const startTour = () => {
    setIsActive(true);
    setHasCompleted(false);
  };

  const completeTour = () => {
    setIsActive(false);
    setHasCompleted(true);
  };

  const skipTour = () => {
    setIsActive(false);
  };

  const resetTour = () => {
    setIsActive(false);
    setHasCompleted(false);
  };

  return {
    isActive,
    hasCompleted,
    startTour,
    completeTour,
    skipTour,
    resetTour
  };
}