import { NextRequest, NextResponse } from 'next/server';
import { registerSchema, validateData } from '@/lib/validations';
import { RegisterResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação dos dados com Zod
    const validation = validateData(registerSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Dados inválidos',
          errors: validation.errors 
        },
        { status: 400 }
      );
    }
    
    const { name, contact_name, email, phone } = validation.data;
    
    // Simulação de criação de conta e geração de API keys
    // Em produção, isso seria feito no backend real
    const apiKeys = {
      live: `live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      test: `test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    };
    
    // Log para debug
    console.log('Conta criada:', { name, contact_name, email, phone });
    console.log('API Keys geradas:', apiKeys);
    
    const response: RegisterResponse = {
      business: {
        id: `business_${Math.random().toString(36).substring(2, 15)}`,
        name,
        contact_name,
        email,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      apiKeys
    };
    
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso',
      data: response
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}