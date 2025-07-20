/**
 * AIDA Platform - Authentication Middleware
 * Middleware para proteger rotas e redirecionar usuários não autenticados
 * PATTERN: Next.js middleware with cookie-based auth check
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register'];

// Rotas protegidas que precisam de autenticação
const protectedRoutes = ['/', '/dashboard', '/assistants', '/conversations', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // BYPASS TEMPORÁRIO PARA TESTES - REMOVER EM PRODUÇÃO
  const devBypass = process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true';
  
  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // Verificar se o usuário está autenticado
  const authToken = request.cookies.get('aida_auth_token')?.value;
  const isAuthenticated = !!authToken || devBypass;
  
  // Se está em rota pública e autenticado, redirecionar para dashboard
  if (isPublicRoute && isAuthenticated && !devBypass) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Se está em rota protegida e não autenticado, redirecionar para login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Adicionar parâmetro de redirecionamento
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};