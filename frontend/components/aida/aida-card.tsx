'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { aidaComponents, cn, type CardVariant } from '@/lib/design-system';

interface AidaCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  variant?: CardVariant;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AidaCard({ 
  children, 
  title, 
  description, 
  variant = 'default',
  className,
  header,
  footer 
}: AidaCardProps) {
  const cardClasses = cn(
    'transition-all duration-200 hover:shadow-md',
    aidaComponents.cardVariants[variant],
    className
  );

  return (
    <Card className={cardClasses}>
      {(title || description || header) && (
        <CardHeader>
          {header}
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      
      <CardContent className="pt-0">
        {children}
      </CardContent>
      
      {footer && (
        <div className="border-t px-6 py-4">
          {footer}
        </div>
      )}
    </Card>
  );
}