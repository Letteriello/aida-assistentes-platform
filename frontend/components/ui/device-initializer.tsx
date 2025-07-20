/**
 * AIDA Platform - Device Initializer Component
 * Inicializa detecção de dispositivos e aplica classes CSS apropriadas
 */

'use client';

import { useEffect } from 'react';
import { addDeviceClasses } from '@/lib/device-detection';

/**
 * Componente que inicializa a detecção de dispositivos
 * e aplica classes CSS apropriadas ao elemento HTML
 */
export function DeviceInitializer() {
  useEffect(() => {
    // Aplica classes de dispositivo ao carregar
    addDeviceClasses();

    // Reaplica classes quando a orientação muda
    const handleOrientationChange = () => {
      // Pequeno delay para garantir que as dimensões foram atualizadas
      setTimeout(() => {
        addDeviceClasses();
      }, 100);
    };

    // Reaplica classes quando a janela é redimensionada
    const handleResize = () => {
      addDeviceClasses();
    };

    // Event listeners
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
}