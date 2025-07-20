import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica dos dados
    const { name, contact_name, email, phone } = body;
    
    if (!name || !contact_name || !email || !phone) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Simulação de criação de conta e geração de API keys
    // Em produção, isso seria feito no backend real
    const apiKeys = {
      live: `live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      test: `test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    };
    
    // Log para debug
    console.log('Conta criada:', { name, contact_name, email, phone });
    console.log('API Keys geradas:', apiKeys);
    
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso',
      business: {
        id: `business_${Math.random().toString(36).substring(2, 15)}`,
        name
      },
      apiKeys
    });
    
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}