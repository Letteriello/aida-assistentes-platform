/**
 * AIDA Platform - Design System Showcase
 * Demonstrates design system components and utilities
 */

'use client';

import React from 'react';
import { 
  useDesignSystem, 
  useDesignTokens, 
  useResponsive, 
  useTheme, 
  useMotion, 
  useColors, 
  useSpacing 
} from '@/hooks/use-design-system';
import { ThemeToggle, SystemThemeIndicator } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnhancedToast } from '@/components/ui/enhanced-toast';
import { Palette, Smartphone, Monitor, Zap, Eye, Grid3X3, Bell } from 'lucide-react';

export function DesignSystemShowcase() {
  const designSystem = useDesignSystem();
  const tokens = useDesignTokens();
  const responsive = useResponsive();
  const theme = useTheme();
  const motion = useMotion();
  const colors = useColors();
  const spacing = useSpacing();
  const toast = useEnhancedToast();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Design System Showcase</h1>
          <p className="text-muted-foreground">
            Demonstrating the AIDA Platform design system utilities and components
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SystemThemeIndicator />
          <ThemeToggle />
        </div>
      </div>

      {/* Theme Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme System
          </CardTitle>
          <CardDescription>
            Current theme configuration and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current Theme</h4>
              <Badge variant={theme.isDark ? 'default' : 'secondary'}>
                {theme.theme} ({theme.colorScheme})
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Hydration Status</h4>
              <Badge variant={theme.isHydrated ? 'default' : 'destructive'}>
                {theme.isHydrated ? 'Hydrated' : 'Not Hydrated'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Actions</h4>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => theme.setTheme('light')}>
                  Light
                </Button>
                <Button size="sm" onClick={() => theme.setTheme('dark')}>
                  Dark
                </Button>
                <Button size="sm" onClick={() => theme.setTheme('system')}>
                  System
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Responsive System
          </CardTitle>
          <CardDescription>
            Current breakpoint and responsive utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Current Breakpoint</h4>
              <Badge variant="outline">{responsive.currentBreakpoint}</Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Device Type</h4>
              <Badge variant={responsive.isMobile ? 'default' : 'secondary'}>
                {responsive.isMobile ? 'Mobile' : responsive.isTablet ? 'Tablet' : 'Desktop'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Screen Size</h4>
              <Badge variant={responsive.isLargeScreen ? 'default' : 'secondary'}>
                {responsive.isLargeScreen ? 'Large' : 'Standard'}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Responsive Checks</h4>
              <div className="flex flex-wrap gap-1">
                <Badge variant={responsive.isBreakpointUp('md') ? 'default' : 'outline'}>
                  MD+
                </Badge>
                <Badge variant={responsive.isBreakpointUp('lg') ? 'default' : 'outline'}>
                  LG+
                </Badge>
                <Badge variant={responsive.isBreakpointUp('xl') ? 'default' : 'outline'}>
                  XL+
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motion Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Motion System
          </CardTitle>
          <CardDescription>
            Animation preferences and motion utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Motion Preference</h4>
              <Badge variant={motion.prefersReducedMotion ? 'destructive' : 'default'}>
                {motion.motionPreference}
              </Badge>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Should Animate</h4>
              <Badge variant={motion.shouldAnimate ? 'default' : 'secondary'}>
                {motion.shouldAnimate ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
          
          {/* Animation Demo */}
          <div className="space-y-2">
            <h4 className="font-medium">Animation Demo</h4>
            <div className="flex gap-4">
              <div 
                className={`
                  w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground
                  ${motion.shouldAnimate ? 'animate-bounce' : ''}
                `}
              >
                <Zap className="h-6 w-6" />
              </div>
              <div 
                className={`
                  w-16 h-16 bg-accent rounded-lg flex items-center justify-center text-accent-foreground
                  ${motion.shouldAnimate ? 'animate-pulse' : ''}
                `}
              >
                <Eye className="h-6 w-6" />
              </div>
              <div 
                className={`
                  w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-secondary-foreground
                  ${motion.shouldAnimate ? 'animate-spin' : ''}
                `}
              >
                <Smartphone className="h-6 w-6" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color System
          </CardTitle>
          <CardDescription>
            Design system color utilities and tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { name: 'Primary', value: colors.primary, bg: 'bg-primary' },
              { name: 'Secondary', value: colors.secondary, bg: 'bg-secondary' },
              { name: 'Accent', value: colors.accent, bg: 'bg-accent' },
              { name: 'Success', value: colors.success, bg: 'bg-green-500' },
              { name: 'Warning', value: colors.warning, bg: 'bg-yellow-500' },
              { name: 'Error', value: colors.error, bg: 'bg-red-500' },
              { name: 'Info', value: colors.info, bg: 'bg-blue-500' },
            ].map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`w-full h-16 rounded-lg ${color.bg}`} />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{color.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spacing System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Spacing System
          </CardTitle>
          <CardDescription>
            Design system spacing utilities and tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {[
              { name: 'XS', value: spacing.xs, key: 'xs' },
              { name: 'SM', value: spacing.sm, key: 'sm' },
              { name: 'MD', value: spacing.md, key: 'md' },
              { name: 'LG', value: spacing.lg, key: 'lg' },
              { name: 'XL', value: spacing.xl, key: 'xl' },
              { name: '2XL', value: spacing['2xl'], key: '2xl' },
            ].map((space) => (
              <div key={space.key} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium">{space.name}</div>
                <div 
                  className="bg-primary h-4 rounded"
                  style={{ width: space.value }}
                />
                <div className="text-xs text-muted-foreground font-mono">{space.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Design Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens</CardTitle>
          <CardDescription>
            Raw design token access and utilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Typography Scale</h4>
              <div className="space-y-2">
                {Object.entries(tokens.typography.fontSize).slice(0, 6).map(([key, [size, { lineHeight }]]) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-12 text-xs font-mono">{key}</div>
                    <div style={{ fontSize: size, lineHeight }} className="font-medium">
                      Sample Text
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{size}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Border Radius</h4>
              <div className="space-y-2">
                {Object.entries(tokens.borderRadius).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-12 text-xs font-mono">{key}</div>
                    <div 
                      className="w-8 h-8 bg-primary"
                      style={{ borderRadius: value }}
                    />
                    <div className="text-xs text-muted-foreground font-mono">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notification System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Toast Notification System
          </CardTitle>
          <CardDescription>
            Enhanced toast notifications with semantic variants and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Success Toast</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.success({
                  title: 'Success!',
                  description: 'Your changes have been saved successfully.'
                })}
              >
                Show Success
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Warning Toast</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.warning({
                  title: 'Warning',
                  description: 'Please review your input before continuing.'
                })}
              >
                Show Warning
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Error Toast</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.error({
                  title: 'Error',
                  description: 'Something went wrong. Please try again.'
                })}
              >
                Show Error
              </Button>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Info Toast</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info({
                  title: 'Information',
                  description: 'Here is some helpful information for you.'
                })}
              >
                Show Info
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Convenience Methods</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="ghost" size="sm" onClick={() => toast.saved()}>
                Saved
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.created()}>
                Created
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.deleted()}>
                Deleted
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toast.networkError()}>
                Network Error
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Utility Functions Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Utility Functions</CardTitle>
          <CardDescription>
            Design system utility function examples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Color Access</h4>
              <div className="space-y-2 font-mono text-sm">
                <div>getColor(&apos;primary.600&apos;): <span className="text-primary">{designSystem.getColor('primary.600')}</span></div>
                <div>getColor(&apos;accent.cyan.500&apos;): <span style={{ color: designSystem.getColor('accent.cyan.500') }}>{designSystem.getColor('accent.cyan.500')}</span></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Spacing Access</h4>
              <div className="space-y-2 font-mono text-sm">
                <div>getSpacing(&apos;4&apos;): {designSystem.getSpacing('4')}</div>
                <div>getSpacing(&apos;8&apos;): {designSystem.getSpacing('8')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}