'use client';

import { InstanceManager } from '@/components/whatsapp/instance-manager';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WhatsAppDashboardPage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        router.push('/onboarding');
      }
    };

    verifyAuth();
  }, [checkAuth, router]);

  const handleInstanceConnected = (instanceId: string) => {
    console.log('Instance connected:', instanceId);
    // Aqui você pode redirecionar para uma página de chat ou mostrar uma notificação
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard AIDA
          </h1>
          <p className="text-gray-600">
            Gerencie suas instâncias WhatsApp e conecte seus assistentes de IA
          </p>
        </div>

        <InstanceManager onInstanceConnected={handleInstanceConnected} />
      </div>
    </div>
  );
}