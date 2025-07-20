/**
 * AIDA Assistentes - Register Page
 * Página de registro para criar nova conta de negócio
 * PATTERN: Multi-step form with validation and Origin UI theming
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TechCard, TechCardContent, TechCardHeader, TechCardTitle, TechCardDescription } from '@/components/ui/tech-card';
import { TechButton } from '@/components/ui/tech-button';
import { TechInput } from '@/components/ui/tech-input';
import { AnimatedTechBackground } from '@/components/ui/animated-tech-background';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepIndicator, type Step } from '@/components/ui/step-indicator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ImageUpload } from '@/components/ui/image-upload';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import AidaLogo from '@/components/ui/aida-logo';
import { Loader2, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const INDUSTRIES = [
  { value: 'technology', label: 'Tecnologia' },
  { value: 'retail', label: 'Varejo' },
  { value: 'healthcare', label: 'Saúde' },
  { value: 'education', label: 'Educação' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'real_estate', label: 'Imobiliário' },
  { value: 'automotive', label: 'Automotivo' },
  { value: 'food_beverage', label: 'Alimentação e Bebidas' },
  { value: 'beauty_wellness', label: 'Beleza e Bem-estar' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other', label: 'Outro' }
];

const REGISTRATION_STEPS: Step[] = [
  {
    id: 'info',
    title: 'Informações',
    description: 'Dados da empresa e conta'
  },
  {
    id: 'confirmation',
    title: 'Confirmação',
    description: 'Revisar dados'
  }
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    email: '',
    password: '',
        logo: null as File | null,
    confirmPassword: ''
  });
    const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { register, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no primeiro campo quando o componente monta
  useEffect(() => {
    if (currentStep === 1 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [currentStep]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (file: File | null) => {
    setFormData(prev => ({ ...prev, logo: file }));
  };

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Nome da empresa é obrigatório';
        if (value.trim().length < 2) return 'Nome deve ter pelo menos 2 caracteres';
        return '';
      case 'email':
        if (!value.trim()) return 'Email é obrigatório';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email deve ter um formato válido';
        return '';
      case 'password':
        if (!value.trim()) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula e 1 número';
        return '';
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      errors.name = validateField('name', formData.name);
      errors.email = validateField('email', formData.email);
      errors.password = validateField('password', formData.password);
    }

    const hasErrors = Object.values(errors).some(error => error !== '');
    setFieldErrors(errors);
    
    if (hasErrors) {
      const firstError = Object.entries(errors).find(([_, error]) => error !== '');
      if (firstError) {
        toast.error(firstError[1]);
      }
    }
    
    return !hasErrors;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => Math.min(prev + 1, REGISTRATION_STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    errors.name = validateField('name', formData.name);
    errors.email = validateField('email', formData.email);
    errors.password = validateField('password', formData.password);

    const hasErrors = Object.values(errors).some(error => error !== '');
    setFieldErrors(errors);
    
    if (hasErrors) {
      const firstError = Object.entries(errors).find(([_, error]) => error !== '');
      if (firstError) {
        toast.error(firstError[1]);
      }
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await register(formData.email, formData.password, formData.name);
      toast.success('Conta criada com sucesso!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Register error:', error);
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedTechBackground variant="hybrid" intensity="subtle" className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg mx-auto animate-slide-in">
        <TechCard variant="glass" size="lg" glow="subtle" className="backdrop-blur-xl bg-card/95 border border-border/30 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <TechCardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1" />
              <div className="flex justify-center transform hover:scale-105 transition-transform duration-300">
                <AidaLogo size="lg" className="animate-glow" />
              </div>
              <div className="flex-1 flex justify-end">
                <ThemeToggle />
              </div>
            </div>
            <div className="space-y-3">
              <TechCardTitle className="text-3xl font-bold bg-gradient-to-r from-tech-blue-500 via-tech-blue-600 to-tech-blue-700 bg-clip-text text-transparent animate-gradient">
                Criar Conta AIDA Assistentes
              </TechCardTitle>
              <TechCardDescription className="text-muted-foreground text-base leading-relaxed">
                Crie sua conta para começar a usar nossa plataforma de IA
              </TechCardDescription>
            </div>
            
            {/* Step Indicator */}
            <StepIndicator
              steps={REGISTRATION_STEPS}
              currentStep={currentStep}
              completedSteps={completedSteps}
              className="stagger-fade-in"
            />
          </TechCardHeader>
          <TechCardContent className="space-y-6 px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Combined Information */}
            {currentStep === 1 && (
              <div className="space-y-4 stagger-fade-in">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2 group">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Nome da Empresa *
                    </Label>
                    <TechInput
                      ref={nameInputRef}
                      id="name"
                      type="text"
                      placeholder="Ex: Minha Empresa Ltda"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={(e) => handleFieldBlur('name', e.target.value)}
                      disabled={isLoading}
                      variant="tech"
                      size="lg"
                      label="Nome da Empresa *"
                      errorText={fieldErrors.name}
                      className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="industry" className="text-sm font-semibold text-foreground/80 flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2" />
                      </svg>
                      Setor de Atuação
                    </Label>
                    <Select 
                      value={formData.industry} 
                      onValueChange={(value) => handleInputChange('industry', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12 text-base border-2 border-border/30 focus:border-tech-blue-500 focus:ring-2 focus:ring-tech-blue-200 transition-all duration-300 rounded-lg hover:shadow-lg hover:scale-[1.01] focus:scale-[1.01]">
                        <SelectValue placeholder="Selecione seu setor" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border shadow-lg backdrop-blur-sm">
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value} className="hover:bg-tech-blue-50 dark:hover:bg-tech-blue-950 transition-colors bg-background">
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      Email *
                    </Label>
                    <TechInput
                      ref={emailInputRef}
                      id="email"
                      type="email"
                      placeholder="contato@minhaempresa.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={(e) => handleFieldBlur('email', e.target.value)}
                      disabled={isLoading}
                      variant="tech"
                      size="lg"
                      label="Email *"
                      errorText={fieldErrors.email}
                      className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 group">
                    <Label htmlFor="password" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Senha *
                    </Label>
                    <div className="relative">
                      <TechInput
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        onBlur={(e) => handleFieldBlur('password', e.target.value)}
                        disabled={isLoading}
                        variant="tech"
                        size="lg"
                        label="Senha *"
                        errorText={fieldErrors.password}
                        className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 px-0 hover:bg-tech-blue-50 dark:hover:bg-tech-blue-950 rounded-lg transition-all duration-200 hover:scale-110"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-tech-blue-600 dark:text-tech-blue-400 transition-transform duration-200" />
                        ) : (
                          <Eye className="h-4 w-4 text-tech-blue-600 dark:text-tech-blue-400 transition-transform duration-200" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Indicador de Força da Senha */}
                    <PasswordStrengthIndicator 
                      password={formData.password}
                      className="mt-3"
                    />
                  </div>

                  <div className="space-y-2 group">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confirmar Senha *
                    </Label>
                                        <div className="relative">
                      <TechInput
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirme sua senha"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        onBlur={(e) => handleFieldBlur('confirmPassword', e.target.value)}
                        disabled={isLoading}
                        variant="tech"
                        size="lg"
                        label="Confirmar Senha *"
                        errorText={fieldErrors.confirmPassword}
                        className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 px-0 hover:bg-tech-blue-50 dark:hover:bg-tech-blue-950 rounded-lg transition-all duration-200 hover:scale-110"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-tech-blue-600 dark:text-tech-blue-400 transition-transform duration-200" />
                        ) : (
                          <Eye className="h-4 w-4 text-tech-blue-600 dark:text-tech-blue-400 transition-transform duration-200" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {fieldErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">
                      Logo da Empresa (Opcional)
                    </Label>
                    <ImageUpload
                      onFileSelect={handleLogoUpload}
                      disabled={isLoading}
                      className="w-full h-20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PNG, JPG, JPEG. Tamanho máximo: 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Confirmation */}
            {currentStep === 2 && (
              <div className="space-y-4 stagger-fade-in">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Confirme seus dados</span>
                  </h3>
                  <div className="space-y-3">
                    {formData.logo && (
                      <div className="flex items-center space-x-3">
                        <span className="text-muted-foreground text-sm">Logo:</span>
                        <div className="flex items-center space-x-2">
                          <img
                            src={URL.createObjectURL(formData.logo)}
                            alt="Logo da empresa"
                            className="w-12 h-12 object-cover rounded-lg border"
                          />
                          <span className="text-sm font-medium">{formData.logo.name}</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empresa:</span>
                        <span className="font-medium">{formData.name}</span>
                      </div>
                      {formData.industry && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Setor:</span>
                          <span className="font-medium">
                            {INDUSTRIES.find(i => i.value === formData.industry)?.label}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{formData.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between space-x-3 pt-6">
              {currentStep > 1 && (
                <TechButton
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </TechButton>
              )}
              
              {currentStep < REGISTRATION_STEPS.length ? (
                <TechButton
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                  variant="default"
                  size="lg"
                  className={`h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] animate-glow ${currentStep > 1 ? 'flex-1' : 'w-full'}`}
                >
                  Próximo
                </TechButton>
              ) : (
                <TechButton 
                  type="submit" 
                  disabled={isLoading}
                  variant="default"
                  size="lg"
                  className={`h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] animate-glow group ${currentStep > 1 ? 'flex-1' : 'w-full'}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Criar Conta
                    </div>
                  )}
                </TechButton>
              )}
            </div>
          </form>

          <div className="mt-4 text-center pt-4">
            <p className="text-sm text-foreground/70">
              Já tem uma conta?{' '}
              <Link 
                href="/login" 
                className="text-tech-blue-600 hover:text-tech-blue-700 dark:text-tech-blue-400 dark:hover:text-tech-blue-300 font-semibold transition-all duration-200 hover:underline inline-flex items-center gap-1 group"
              >
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Fazer login
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">✨ O que você ganha:</p>
              <ul className="space-y-1 ml-4">
                <li>• Chaves API para integração</li>
                <li>• Dashboard completo</li>
                <li>• Assistentes de IA ilimitados</li>
                <li>• Suporte técnico</li>
              </ul>
            </div>
          </div>
        </TechCardContent>
        </TechCard>
      </div>
    </AnimatedTechBackground>
  );
}