'use client';

import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { type ButtonVariant } from '@/lib/design-system';

// Mapeamento de variantes AIDA para variantes do Button nativo
const variantMapping: Record<ButtonVariant, ButtonProps['variant']> = {
  primary: 'default',
  destructive: 'destructive',
  outline: 'outline',
  secondary: 'secondary',
  ghost: 'ghost',
  link: 'link',
  luxury: 'luxury',
  golden: 'golden',
  glass: 'glass',
} as const;

// Mapeamento de tamanhos AIDA para tamanhos do Button nativo
const sizeMapping = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
  xl: 'xl'
} as const;

interface AidaButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: keyof typeof sizeMapping;
}

// Componente otimizado que delega funcionalidades para o Button nativo
export const AidaButton = React.memo<AidaButtonProps>(function AidaButton({
  children,
  variant = 'primary',
  size = 'md',
  ...props
}) {
  // Mapeia variantes e tamanhos AIDA para o Button nativo
  const mappedVariant = variantMapping[variant];
  const mappedSize = sizeMapping[size];

  return (
    <Button 
      variant={mappedVariant}
      size={mappedSize}
      {...props}
    >
      {children}
    </Button>
  );
});