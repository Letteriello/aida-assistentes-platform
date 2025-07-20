/**
 * AIDA Platform - PWA Manager Component
 * Gerencia service worker, instalação PWA e notificações
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Bell, BellOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAManager() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('AIDA: Service Worker registrado:', registration);
          setSwRegistration(registration);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  if (confirm('Nova versão da AIDA Platform disponível. Atualizar agora?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('AIDA: Erro ao registrar Service Worker:', error);
        });
    }

    // Detectar se já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();
    window.addEventListener('appinstalled', checkIfInstalled);

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt após um tempo (não imediatamente)
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 10000); // 10 segundos
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar permissão de notificação
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', checkIfInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('AIDA: PWA instalada pelo usuário');
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('AIDA: Erro na instalação:', error);
    }
  };

  const handleNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted' && swRegistration) {
        // Subscrever para push notifications
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        // Enviar subscription para o servidor
        console.log('AIDA: Subscription criada:', subscription);
      }
    } catch (error) {
      console.error('AIDA: Erro ao solicitar permissão:', error);
    }
  };

  // Não mostrar se já estiver instalado ou não montado
  if (!mounted || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-card border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                  AI
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Instalar AIDA Platform</h3>
                  <p className="text-xs text-muted-foreground">Acesso rápido e offline</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallPrompt(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstallPrompt(false)}
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Permission Prompt */}
      {notificationPermission === 'default' && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-card border border-border rounded-lg p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">Ativar Notificações</h3>
                  <p className="text-xs text-muted-foreground">Receba atualizações importantes</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleNotificationPermission}
                size="sm"
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-2" />
                Permitir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationPermission('denied')}
              >
                <BellOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}