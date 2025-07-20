'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AidaCard } from '@/components/aida';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Key, Shield, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Schema de validação com Zod
const loginSchema = z.object({
  apiKey: z.string()
    .min(1, 'A chave de API é obrigatória')
    .min(10, 'A chave de API deve ter pelo menos 10 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'A chave de API contém caracteres inválidos')
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showApiKey, setShowApiKey] = useState(false);
  const { login } = useAuthStore();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      apiKey: ''
    }
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.apiKey, data.apiKey);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta à plataforma AIDA."});
    } catch (err) {
      toast({
        title: "Erro no login",
        description: "Chave de API inválida. Verifique e tente novamente.",
        variant: "destructive"
      });
    }
  };

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
            <Shield className="mx-auto h-12 w-12 text-amber-600" />
          </motion.div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
            AIDA Platform
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Acesse sua conta para gerenciar seus assistentes.
          </p>
        </div>

        <AidaCard variant="gold" className="border-0 shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Insira sua chave de API para continuar na plataforma AIDA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Key className="h-4 w-4 text-amber-600" />
                        Chave de API
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showApiKey ? 'text' : 'password'}
                            placeholder="Insira sua chave de API"
                            className="pr-10 border-amber-200/50 focus:border-amber-500 focus:ring-amber-500/20 transition-all duration-300"
                            disabled={isSubmitting}
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            disabled={isSubmitting}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground hover:text-amber-600 transition-colors" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-amber-600 transition-colors" />
                            )}
                          </motion.button>
                        </div>
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
                        Entrando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Entrar na AIDA
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
                Não tem uma conta?{' '}
                <Link
                  href="/register"
                  className="font-medium text-amber-600 hover:text-amber-700 hover:underline transition-colors"
                >
                  Registre-se agora
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </AidaCard>
      </motion.div>
    </div>
  );
}