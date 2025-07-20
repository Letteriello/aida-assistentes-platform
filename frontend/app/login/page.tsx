/**
 * AIDA Assistentes - Login Page
 * Página de login usando o sistema de autenticação do backend
 * PATTERN: Form-based authentication with validation
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { TechCard, TechCardContent, TechCardHeader, TechCardTitle, TechCardDescription } from '@/components/ui/tech-card';
import { TechButton } from '@/components/ui/tech-button';
import { TechInput } from '@/components/ui/tech-input';
import { AnimatedTechBackground } from '@/components/ui/animated-tech-background';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import AidaLogo from '@/components/ui/aida-logo';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus no campo de email quando o componente monta
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email ou nome da empresa é obrigatório';
        // Aceita tanto email quanto nome da empresa
        if (value.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Email deve ter um formato válido';
        }
        return '';
      case 'password':
        if (!value.trim()) return 'Senha ou chave API é obrigatória';
        if (value.length < 3) return 'Senha deve ter pelo menos 3 caracteres';
        return '';
      default:
        return '';
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      router.push(redirectTo);
    } catch (error: any) {
      console.error('Login error:', error);
      // Error is already handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedTechBackground variant="hybrid" intensity="subtle" className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md mx-auto animate-slide-in">
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
                Bem-vindo de volta
              </TechCardTitle>
              <TechCardDescription className="text-muted-foreground text-base leading-relaxed">
                Faça login para acessar sua conta AIDA Assistentes
              </TechCardDescription>
            </div>
          </TechCardHeader>
          <TechCardContent className="space-y-6 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Email ou Nome da Empresa
                  </label>
                  <TechInput
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="seu@email.com ou Nome da Empresa"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={(e) => handleFieldBlur('email', e.target.value)}
                    required
                    disabled={isLoading}
                    variant="tech"
                    size="lg"
                    errorText={fieldErrors.email}
                    className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg"
                  />
                </div>
              </div>
                <div className="space-y-2 group">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground/80 cursor-pointer flex items-center gap-2 transition-colors group-focus-within:text-tech-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Senha ou Chave API
                  </label>
                  <div className="relative">
                    <TechInput
                        id="password"
                       type={showPassword ? 'text' : 'password'}
                       autoComplete="current-password"
                       placeholder="Digite sua senha ou chave API"
                       value={password}
                       onChange={(e) => handleInputChange('password', e.target.value)}
                       onBlur={(e) => handleFieldBlur('password', e.target.value)}
                       required
                       disabled={isLoading}
                       variant="tech"
                       size="lg"
                       errorText={fieldErrors.password}
                       className="transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01] hover:shadow-lg focus:shadow-lg pr-12"
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
                </div>

                <TechButton 
                  type="submit" 
                  variant="default"
                  size="lg"
                  className="w-full mt-8 h-12 text-base font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus:scale-[1.02] focus:shadow-xl animate-glow group" 
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando na plataforma...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Entrar na Plataforma AIDA
                    </>
                  )}
                </TechButton>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-border/20">
                <p className="text-base text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Link 
                    href="/register" 
                    className="text-tech-blue-600 hover:text-tech-blue-700 font-semibold transition-all duration-200 hover:underline underline-offset-4 inline-flex items-center gap-1 group"
                  >
                    Criar conta
                    <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </p>
                <div className="mt-3">
                  <Link 
                    href="/forgot-password" 
                    className="text-tech-blue-600 hover:text-tech-blue-700 transition-colors duration-200 text-sm font-medium hover:underline underline-offset-4"
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border/10">
                <div className="text-xs text-muted-foreground space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-tech-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <p className="font-medium text-foreground/80">Recursos disponíveis</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-1.5 h-1.5 bg-tech-blue-500 rounded-full"></div>
                      Dashboard completo
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-1.5 h-1.5 bg-tech-blue-500 rounded-full"></div>
                      Assistentes de IA
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-1.5 h-1.5 bg-tech-blue-500 rounded-full"></div>
                      Integração via API
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-1.5 h-1.5 bg-tech-blue-500 rounded-full"></div>
                      Suporte técnico
                    </div>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Dica:</strong> Você pode usar seu email/senha ou nome da empresa/chave API
                    </p>
                  </div>
                </div>
              </div>
          </TechCardContent>
        </TechCard>
      </div>
    </AnimatedTechBackground>
  );
}