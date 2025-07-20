/**
 * AIDA Platform - Password Strength Indicator
 * Componente para indicar força da senha com feedback visual e sugestões
 * PATTERN: Real-time validation with visual feedback
 */

'use client';

import { useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
  suggestion: string;
}

const PASSWORD_CRITERIA: PasswordCriteria[] = [
  {
    label: 'Pelo menos 8 caracteres',
    test: (password) => password.length >= 8,
    suggestion: 'Use pelo menos 8 caracteres'
  },
  {
    label: 'Uma letra minúscula',
    test: (password) => /[a-z]/.test(password),
    suggestion: 'Adicione uma letra minúscula (a-z)'
  },
  {
    label: 'Uma letra maiúscula',
    test: (password) => /[A-Z]/.test(password),
    suggestion: 'Adicione uma letra maiúscula (A-Z)'
  },
  {
    label: 'Um número',
    test: (password) => /\d/.test(password),
    suggestion: 'Adicione um número (0-9)'
  },
  {
    label: 'Um caractere especial',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    suggestion: 'Adicione um caractere especial (!@#$%^&*)'
  }
];

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => {
    const passedCriteria = PASSWORD_CRITERIA.filter(criteria => criteria.test(password));
    const failedCriteria = PASSWORD_CRITERIA.filter(criteria => !criteria.test(password));
    const score = passedCriteria.length;
    
    let strength: 'weak' | 'medium' | 'strong';
    let strengthLabel: string;
    let strengthColor: string;
    
    if (score < 3) {
      strength = 'weak';
      strengthLabel = 'Fraca';
      strengthColor = 'text-red-500';
    } else if (score < 5) {
      strength = 'medium';
      strengthLabel = 'Média';
      strengthColor = 'text-yellow-500';
    } else {
      strength = 'strong';
      strengthLabel = 'Forte';
      strengthColor = 'text-green-500';
    }
    
    return {
      score,
      strength,
      strengthLabel,
      strengthColor,
      passedCriteria,
      failedCriteria
    };
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Barra de Força */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Força da senha:</span>
          <span className={cn('font-medium', analysis.strengthColor)}>
            {analysis.strengthLabel}
          </span>
        </div>
        
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                'h-2 flex-1 rounded-full transition-all duration-300',
                level <= analysis.score
                  ? analysis.strength === 'weak'
                    ? 'bg-red-500'
                    : analysis.strength === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Critérios */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Sua senha deve conter:</p>
        <div className="space-y-1">
          {PASSWORD_CRITERIA.map((criteria, index) => {
            const isPassed = criteria.test(password);
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center space-x-2 text-sm transition-colors duration-200',
                  isPassed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )}
              >
                {isPassed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{criteria.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sugestões */}
      {analysis.failedCriteria.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Para tornar sua senha mais forte:</span>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground ml-6">
            {analysis.failedCriteria.slice(0, 2).map((criteria, index) => (
              <li key={index} className="list-disc">
                {criteria.suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;