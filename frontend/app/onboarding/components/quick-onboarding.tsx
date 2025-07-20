'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/origin/card';
import { Button } from '@/components/ui/origin/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Phone, Building, MessageSquare, Zap, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { toast } from 'sonner';

interface OnboardingData {
  phoneNumber: string;
  verificationCode: string;
  businessName: string;
  businessType: string;
  whatsappConnected: boolean;
}

export function QuickOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    phoneNumber: '',
    verificationCode: '',
    businessName: '',
    businessType: '',
    whatsappConnected: false
  });

  const {
    sendVerificationCode,
    verifyCode,
    isLoading,
    error,
    verificationSent,
    pendingPhone,
    validatePhone,
    clearError,
    isAuthenticated
  } = useAuthStore();

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  // Mostrar erros como toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);
  
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const businessTypes = [
    'E-commerce',
    'Restaurante',
    'Serviços',
    'Consultoria',
    'Saúde',
    'Educação',
    'Imobiliária',
    'Outros'
  ];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSendCode = async () => {
    // Validar telefone antes de enviar
    const validation = validatePhone(data.phoneNumber);
    if (!validation.isValid) {
      toast.error(validation.error || 'Número de telefone inválido');
      return;
    }

    const success = await sendVerificationCode(validation.formattedPhone);
    if (success) {
      setData(prev => ({ ...prev, phoneNumber: validation.formattedPhone }));
      toast.success('Código enviado via WhatsApp!');
      nextStep();
    }
  };

  const handleVerifyCode = async () => {
    if (!data.verificationCode || data.verificationCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    const success = await verifyCode(data.phoneNumber, data.verificationCode);
    if (success) {
      toast.success('Verificação concluída!');
      nextStep();
    }
  };

  const handleBusinessSetup = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    nextStep();
  };

  const handleWhatsAppConnect = async () => {
    // Redirect to dashboard where user can manage instances
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-aida-primary via-aida-secondary to-aida-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-aida-gradient rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            AIDA Assistentes
          </CardTitle>
          <p className="text-gray-600">
            Configure seu assistente em 60 segundos
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-aida-gradient h-2 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Passo {currentStep} de {totalSteps}
          </p>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <Phone className="w-12 h-12 text-aida-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Verificação por WhatsApp</h3>
                  <p className="text-sm text-gray-600">
                    Digite seu número para receber o código
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="+55 11 99999-9999"
                    value={data.phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setData(prev => ({ ...prev, phoneNumber: value }));
                    }}
                    className="text-center text-lg"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Inclua o código do país (+55) e DDD
                  </p>
                  
                  {data.phoneNumber && (() => {
                    const validation = validatePhone(data.phoneNumber);
                    if (!validation.isValid && data.phoneNumber.length > 5) {
                      return (
                        <div className="flex items-center gap-1 text-red-500 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          {validation.error}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                <Button 
                  onClick={handleSendCode}
                  disabled={!data.phoneNumber || isLoading || (data.phoneNumber && !validatePhone(data.phoneNumber).isValid)}
                  className="w-full"
                  variant="aida"
                  size="lg"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <MessageSquare className="w-12 h-12 text-aida-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Digite o Código</h3>
                  <p className="text-sm text-gray-600">
                    Enviamos um código de 6 dígitos para seu WhatsApp
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">Código de Verificação</Label>
                  <Input
                    id="code"
                    placeholder="123456"
                    value={data.verificationCode}
                    onChange={(e) => setData(prev => ({ ...prev, verificationCode: e.target.value }))}
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button onClick={prevStep} variant="outline" className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleVerifyCode}
                    disabled={data.verificationCode.length !== 6 || isLoading}
                    variant="aida"
                    className="flex-1"
                  >
                    {isLoading ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <Building className="w-12 h-12 text-aida-primary mx-auto mb-2" />
                  <h3 className="text-lg font-semibold">Sobre seu Negócio</h3>
                  <p className="text-sm text-gray-600">
                    Conte-nos sobre sua empresa
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Nome da Empresa</Label>
                    <Input
                      id="business-name"
                      placeholder="Minha Empresa Ltda"
                      value={data.businessName}
                      onChange={(e) => setData(prev => ({ ...prev, businessName: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-type">Tipo de Negócio</Label>
                    <Select
                      value={data.businessType}
                      onValueChange={(value) => setData(prev => ({ ...prev, businessType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button onClick={prevStep} variant="outline" className="flex-1">
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleBusinessSetup}
                    disabled={!data.businessName || !data.businessType || isLoading}
                    variant="aida"
                    className="flex-1"
                  >
                    {isLoading ? 'Salvando...' : 'Continuar'}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  {data.whatsappConnected ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-aida-success mx-auto mb-2" />
                      <h3 className="text-lg font-semibold text-aida-success">Conectado!</h3>
                      <p className="text-sm text-gray-600">
                        Seu assistente está pronto para atender
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-aida-gradient rounded-full mx-auto mb-2 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Conectar WhatsApp</h3>
                      <p className="text-sm text-gray-600">
                        Escaneie o QR Code com seu WhatsApp Business
                      </p>
                    </>
                  )}
                </div>
                
                <div className="text-center">
                  <div className="w-48 h-48 bg-gradient-to-br from-aida-primary to-aida-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="text-white text-center">
                      <MessageSquare className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-sm font-medium">WhatsApp Business</p>
                      <p className="text-xs opacity-80">Pronto para conectar</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleWhatsAppConnect}
                    variant="aida"
                    size="lg"
                    className="w-full"
                  >
                    Continuar para Dashboard
                  </Button>
                </div>
                
                {data.whatsappConnected && (
                  <Button 
                    variant="aida"
                    size="lg"
                    className="w-full"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Ir para Dashboard
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}