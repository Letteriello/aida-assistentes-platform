/**
 * Utilitários de validação para formulários
 * Todas as funções retornam uma mensagem de erro em português ou undefined se válido
 */

export type ValidatorFunction = (value: string) => string | undefined

// Validador obrigatório
export const obrigatorio = (mensagem = "Este campo é obrigatório"): ValidatorFunction => {
  return (value: string) => {
    if (!value || value.trim().length === 0) {
      return mensagem
    }
    return undefined
  }
}

// Validador de email
export const email = (mensagem = "Digite um email válido"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return mensagem
    }
    return undefined
  }
}

// Validador de comprimento mínimo
export const comprimentoMinimo = (min: number, mensagem?: string): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    if (value.length < min) {
      return mensagem || `Deve ter pelo menos ${min} caracteres`
    }
    return undefined
  }
}

// Validador de comprimento máximo
export const comprimentoMaximo = (max: number, mensagem?: string): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    if (value.length > max) {
      return mensagem || `Deve ter no máximo ${max} caracteres`
    }
    return undefined
  }
}

// Validador de senha forte
export const senhaForte = (mensagem = "A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    const temMaiuscula = /[A-Z]/.test(value)
    const temMinuscula = /[a-z]/.test(value)
    const temNumero = /\d/.test(value)
    const temSimbolo = /[!@#$%^&*(),.?":{}|<>]/.test(value)
    const temComprimento = value.length >= 8
    
    if (!temMaiuscula || !temMinuscula || !temNumero || !temSimbolo || !temComprimento) {
      return mensagem
    }
    return undefined
  }
}

// Validador de confirmação de senha
export const confirmarSenha = (senhaOriginal: string, mensagem = "As senhas não coincidem"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    if (value !== senhaOriginal) {
      return mensagem
    }
    return undefined
  }
}

// Validador de telefone brasileiro
export const telefone = (mensagem = "Digite um telefone válido"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    // Remove caracteres não numéricos
    const apenasNumeros = value.replace(/\D/g, '')
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
      return mensagem
    }
    
    // Verifica se o DDD é válido (11-99)
    const ddd = parseInt(apenasNumeros.substring(0, 2))
    if (ddd < 11 || ddd > 99) {
      return mensagem
    }
    
    return undefined
  }
}

// Validador de CPF
export const cpf = (mensagem = "Digite um CPF válido"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    // Remove caracteres não numéricos
    const apenasNumeros = value.replace(/\D/g, '')
    
    // Verifica se tem 11 dígitos
    if (apenasNumeros.length !== 11) {
      return mensagem
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(apenasNumeros)) {
      return mensagem
    }
    
    // Validação do algoritmo do CPF
    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += parseInt(apenasNumeros.charAt(i)) * (10 - i)
    }
    let resto = 11 - (soma % 11)
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(apenasNumeros.charAt(9))) {
      return mensagem
    }
    
    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += parseInt(apenasNumeros.charAt(i)) * (11 - i)
    }
    resto = 11 - (soma % 11)
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(apenasNumeros.charAt(10))) {
      return mensagem
    }
    
    return undefined
  }
}

// Validador de padrão personalizado
export const padrao = (regex: RegExp, mensagem = "Formato inválido"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    if (!regex.test(value)) {
      return mensagem
    }
    return undefined
  }
}

// Validador de URL
export const url = (mensagem = "Digite uma URL válida"): ValidatorFunction => {
  return (value: string) => {
    if (!value) return undefined
    
    try {
      new URL(value)
      return undefined
    } catch {
      return mensagem
    }
  }
}

// Combinar múltiplos validadores
export const combinarValidadores = (...validators: ValidatorFunction[]): ValidatorFunction => {
  return (value: string) => {
    for (const validator of validators) {
      const erro = validator(value)
      if (erro) {
        return erro
      }
    }
    return undefined
  }
}

// Validadores pré-configurados comuns
export const validadores = {
  emailObrigatorio: combinarValidadores(obrigatorio(), email()),
  senhaObrigatoria: combinarValidadores(obrigatorio(), senhaForte()),
  telefoneObrigatorio: combinarValidadores(obrigatorio(), telefone()),
  cpfObrigatorio: combinarValidadores(obrigatorio(), cpf()),
}