/**
 * AIDA Platform - Responsive Wrapper Component
 * Componente para adaptação automática baseada no dispositivo
 */

'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getDeviceInfo, addDeviceClasses, type DeviceInfo } from '@/lib/device-detection';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  touchClassName?: string;
  noTouchClassName?: string;
  retinaClassName?: string;
  lowDpiClassName?: string;
  adaptiveContainer?: boolean;
  maxWidth?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

/**
 * Wrapper responsivo que adapta automaticamente baseado no dispositivo
 */
export function ResponsiveWrapper({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  touchClassName,
  noTouchClassName,
  retinaClassName,
  lowDpiClassName,
  adaptiveContainer = true,
  maxWidth,
  padding,
}: ResponsiveWrapperProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Adiciona classes CSS ao HTML
    addDeviceClasses();
    
    // Obtém informações do dispositivo
    setDeviceInfo(getDeviceInfo());
    setMounted(true);

    // Listener para mudanças de orientação
    const handleOrientationChange = () => {
      setTimeout(() => {
        addDeviceClasses();
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Renderização no servidor ou antes da hidratação
  if (!mounted || !deviceInfo) {
    return (
      <div className={cn('w-full', className)}>
        {children}
      </div>
    );
  }

  // Determina classes baseadas no dispositivo
  const deviceClasses = cn(
    // Classe base
    className,
    
    // Classes por tipo de dispositivo
    {
      [mobileClassName || '']: deviceInfo.isMobile && mobileClassName,
      [tabletClassName || '']: deviceInfo.isTablet && tabletClassName,
      [desktopClassName || '']: deviceInfo.isDesktop && desktopClassName,
    },
    
    // Classes por capacidade de toque
    {
      [touchClassName || '']: deviceInfo.features.touchSupport && touchClassName,
      [noTouchClassName || '']: !deviceInfo.features.touchSupport && noTouchClassName,
    },
    
    // Classes por densidade de pixels
    {
      [retinaClassName || '']: deviceInfo.screen.isRetina && retinaClassName,
      [lowDpiClassName || '']: !deviceInfo.screen.isRetina && lowDpiClassName,
    },
    
    // Container adaptativo
    {
      'container mx-auto': adaptiveContainer,
      'px-4 sm:px-6 lg:px-8': adaptiveContainer && !padding,
    }
  );

  // Estilos dinâmicos baseados no dispositivo
  const dynamicStyles: React.CSSProperties = {};

  // Max width adaptativo
  if (maxWidth) {
    if (deviceInfo.isMobile && maxWidth.mobile) {
      dynamicStyles.maxWidth = maxWidth.mobile;
    } else if (deviceInfo.isTablet && maxWidth.tablet) {
      dynamicStyles.maxWidth = maxWidth.tablet;
    } else if (deviceInfo.isDesktop && maxWidth.desktop) {
      dynamicStyles.maxWidth = maxWidth.desktop;
    }
  }

  // Padding adaptativo
  if (padding) {
    if (deviceInfo.isMobile && padding.mobile) {
      dynamicStyles.padding = padding.mobile;
    } else if (deviceInfo.isTablet && padding.tablet) {
      dynamicStyles.padding = padding.tablet;
    } else if (deviceInfo.isDesktop && padding.desktop) {
      dynamicStyles.padding = padding.desktop;
    }
  }

  return (
    <div 
      className={deviceClasses}
      style={dynamicStyles}
      data-device-type={deviceInfo.isMobile ? 'mobile' : deviceInfo.isTablet ? 'tablet' : 'desktop'}
      data-browser={deviceInfo.browser.name.toLowerCase()}
      data-os={deviceInfo.isIOS ? 'ios' : deviceInfo.isAndroid ? 'android' : deviceInfo.isWindows ? 'windows' : deviceInfo.isMac ? 'mac' : 'linux'}
      data-touch={deviceInfo.features.touchSupport}
      data-retina={deviceInfo.screen.isRetina}
    >
      {children}
    </div>
  );
}

/**
 * Hook para usar informações do dispositivo em componentes
 */
export function useResponsive() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
    setMounted(true);

    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return {
    deviceInfo,
    mounted,
    isMobile: deviceInfo?.isMobile || false,
    isTablet: deviceInfo?.isTablet || false,
    isDesktop: deviceInfo?.isDesktop || false,
    isTouch: deviceInfo?.features.touchSupport || false,
    isRetina: deviceInfo?.screen.isRetina || false,
    browser: deviceInfo?.browser.name || 'Unknown',
    orientation: deviceInfo?.screen.orientation || 'landscape',
  };
}

/**
 * Componente para renderização condicional baseada no dispositivo
 */
interface DeviceOnlyProps {
  children: ReactNode;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  touch?: boolean;
  retina?: boolean;
  browser?: string[];
  minWidth?: number;
  maxWidth?: number;
}

export function DeviceOnly({
  children,
  mobile,
  tablet,
  desktop,
  touch,
  retina,
  browser,
  minWidth,
  maxWidth,
}: DeviceOnlyProps) {
  const { deviceInfo, mounted } = useResponsive();

  if (!mounted || !deviceInfo) {
    return null;
  }

  // Verifica condições de exibição
  const shouldShow = (
    // Tipo de dispositivo
    (!mobile || deviceInfo.isMobile) &&
    (!tablet || deviceInfo.isTablet) &&
    (!desktop || deviceInfo.isDesktop) &&
    
    // Capacidades
    (touch === undefined || deviceInfo.features.touchSupport === touch) &&
    (retina === undefined || deviceInfo.screen.isRetina === retina) &&
    
    // Navegador
    (!browser || browser.includes(deviceInfo.browser.name.toLowerCase())) &&
    
    // Largura da tela
    (!minWidth || deviceInfo.screen.width >= minWidth) &&
    (!maxWidth || deviceInfo.screen.width <= maxWidth)
  );

  return shouldShow ? <>{children}</> : null;
}

/**
 * Componente para layout adaptativo baseado em grid
 */
interface AdaptiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function AdaptiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
}: AdaptiveGridProps) {
  const { deviceInfo, mounted } = useResponsive();

  if (!mounted || !deviceInfo) {
    return (
      <div className={cn('grid grid-cols-1 gap-4', className)}>
        {children}
      </div>
    );
  }

  // Determina configurações baseadas no dispositivo
  const gridCols = deviceInfo.isMobile 
    ? cols.mobile 
    : deviceInfo.isTablet 
    ? cols.tablet 
    : cols.desktop;

  const gridGap = deviceInfo.isMobile 
    ? gap.mobile 
    : deviceInfo.isTablet 
    ? gap.tablet 
    : gap.desktop;

  const gridClasses = cn(
    'grid',
    {
      'grid-cols-1': gridCols === 1,
      'grid-cols-2': gridCols === 2,
      'grid-cols-3': gridCols === 3,
      'grid-cols-4': gridCols === 4,
      'grid-cols-5': gridCols === 5,
      'grid-cols-6': gridCols === 6,
    },
    className
  );

  return (
    <div 
      className={gridClasses}
      style={{ gap: gridGap }}
    >
      {children}
    </div>
  );
}

/**
 * Componente para texto responsivo
 */
interface ResponsiveTextProps {
  children: ReactNode;
  className?: string;
  size?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  weight?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
}

export function ResponsiveText({
  children,
  className,
  size = { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-lg' },
  weight,
}: ResponsiveTextProps) {
  const { deviceInfo, mounted } = useResponsive();

  if (!mounted || !deviceInfo) {
    return <span className={cn('text-base', className)}>{children}</span>;
  }

  const textSize = deviceInfo.isMobile 
    ? size.mobile 
    : deviceInfo.isTablet 
    ? size.tablet 
    : size.desktop;

  const textWeight = weight ? (
    deviceInfo.isMobile 
      ? weight.mobile 
      : deviceInfo.isTablet 
      ? weight.tablet 
      : weight.desktop
  ) : undefined;

  return (
    <span className={cn(textSize, textWeight, className)}>
      {children}
    </span>
  );
}