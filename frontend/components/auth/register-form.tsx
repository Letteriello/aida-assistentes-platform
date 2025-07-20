'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AidaCard } from '@/components/aida';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Mail, Phone, User, Shield, Loader2, Sparkles, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Schema de validação com Zod
const registerSchema = z.object({
  businessName: z.string()
    .min(1, 'Nome da empresa é obrigatório')
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres'),
  contactName: z.string()
    .min(1, 'Nome do contato é obrigatório')
    .min(2, 'Nome do contato deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do contato deve ter no máximo 100 caracteres'),
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Email deve ter um formato válido'),
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^[\d\s\(\)\+\-]+$/, 'Telefone contém caracteres inválidos')
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface ApiKeysResponse {
  success: boolean;
  business: {
    id: string;
    name: string;
  };
  apiKeys: {
    live: string;
    test: string;
  };
}

export function RegisterForm() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ live: string; test: string } | null>(null);
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      contactName: '',
      email: '',
      phone: ''
    }
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: data.businessName,
          contact_name: data.contactName,
          email: data.email,
          phone: data.phone
        })});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const result: ApiKeysResponse = await response.json();
      
      setApiKeys(result.apiKeys);
      setIsRegistered(true);
      
      toast({
        title: "Conta criada com sucesso!",
        description: "Suas chaves de API foram geradas. Guarde-as em local seguro."});
    } catch (err) {
      toast({
        title: "Erro no registro",
        description: err instanceof Error ? err.message : "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string, keyType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyType);
      toast({
        title: "Chave copiada!",
        description: `Chave ${keyType} copiada para a área de transferência.`});
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a chave. Copie manualmente.",
        variant: "destructive"
      });
    }
  };

  const handleContinueToLogin = () => {
    router.push('/');
  };

  if (isRegistered && apiKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aida-gold-50 to-white p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl space-y-8"
        >
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            </motion.div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Conta Criada com Sucesso!
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Suas chaves de API foram geradas. Guarde-as em local seguro.
            </p>
          </div>

          <AidaCard variant="gold" className="border-0 shadow-xl backdrop-blur-md">
            <CardHeader className="space-y-1 text-center pb-6">
              <CardTitle className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                Suas Chaves de API
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Use essas chaves para acessar a plataforma AIDA. Mantenha-as seguras!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chave de Produção */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  Chave de Produção (Live)
                </label>
                <div className="relative">
                  <Input
                    type={showLiveKey ? 'text' : 'password'}
                    value={apiKeys.live}
                    readOnly
                    className="pr-20 font-mono text-sm border-red-200/50 focus:border-red-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLiveKey(!showLiveKey)}
                      className="h-8 w-8 p-0"
                    >
                      {showLiveKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKeys.live, 'live')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className={`h-4 w-4 ${copiedKey === 'live' ? 'text-green-600' : ''}`} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-red-600">
                  ⚠️ Use apenas em produção. Mantenha esta chave segura!
                </p>
              </div>

              {/* Chave de Teste */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Chave de Teste (Test)
                </label>
                <div className="relative">
                  <Input
                    type={showTestKey ? 'text' : 'password'}
                    value={apiKeys.test}
                    readOnly
                    className="pr-20 font-mono text-sm border-blue-200/50 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTestKey(!showTestKey)}
                      className="h-8 w-8 p-0"
                    >
                      {showTestKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKeys.test, 'test')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className={`h-4 w-4 ${copiedKey === 'test' ? 'text-green-600' : ''}`} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  💡 Use para desenvolvimento e testes.
                </p>
              </div>

              {/* Instruções de Segurança */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Instruções Importantes:</h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Nunca compartilhe suas chaves de API</li>
                  <li>• Armazene-as em um gerenciador de senhas</li>
                  <li>• Use a chave de teste para desenvolvimento</li>
                  <li>• Use a chave de produção apenas em ambiente live</li>
                  <li>• Você pode revogar e gerar novas chaves a qualquer momento</li>
                </ul>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleContinueToLogin}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Continuar para Login
                </Button>
              </motion.div>
            </CardContent>
          </AidaCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aida-gold-50 to-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Building2 className="mx-auto h-12 w-12 text-amber-600" />
          </motion.div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            AIDA Platform
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Crie sua conta empresarial para começar.
          </p>
        </div>

        <AidaCard variant="gold" className="border-0 shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Criar Conta Empresarial
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os dados da sua empresa para gerar suas chaves de API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        Nome da Empresa
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Minha Empresa Ltda"
                          className="border-amber-200/50 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-amber-600" />
                        Nome do Contato
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Seu nome completo"
                          className="border-amber-200/50 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-600" />
                        Email Empresarial
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="contato@minhaempresa.com"
                          className="border-amber-200/50 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-600" />
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="(11) 99999-9999"
                          className="border-amber-200/50 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-medium py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Criar Conta e Gerar API Keys
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link
                  href="/"
                  className="font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                >
                  Faça login
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </AidaCard>
      </motion.div>
    </div>
  );
}