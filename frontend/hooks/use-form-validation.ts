"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { ValidatorFunction } from "@/lib/validation-utils"

// Tipos para o sistema de validacao
export interface CampoValidacao {
  valor: string
  erro?: string
  tocado: boolean
  validando: boolean
}

export interface ConfiguracaoCampo {
  validador?: ValidatorFunction
  validacaoAssincrona?: (valor: string) => Promise<string | undefined>
  modoValidacao?: "onChange" | "onBlur" | "onSubmit"
  debounceMs?: number
}

export interface ConfiguracaoFormulario {
  [nomeCampo: string]: ConfiguracaoCampo
}

export interface EstadoFormulario {
  [nomeCampo: string]: CampoValidacao
}

export interface UseFormValidationReturn {
  campos: EstadoFormulario
  definirValor: (nomeCampo: string, valor: string) => void
  definirTocado: (nomeCampo: string, tocado?: boolean) => void
  validarCampo: (nomeCampo: string) => Promise<boolean>
  validarFormulario: () => Promise<boolean>
  limparErros: (nomeCampo?: string) => void
  resetarFormulario: () => void
  temErros: boolean
  estaValidando: boolean
  formularioTocado: boolean
}

export function useFormValidation(
  configuracao: ConfiguracaoFormulario,
  valoresIniciais: Record<string, string> = {}
): UseFormValidationReturn {
  // Estado dos campos
  const [campos, setCampos] = useState<EstadoFormulario>(() => {
    const estadoInicial: EstadoFormulario = {}
    
    Object.keys(configuracao).forEach(nomeCampo => {
      estadoInicial[nomeCampo] = {
        valor: valoresIniciais[nomeCampo] || "",
        tocado: false,
        validando: false
      }
    })
    
    return estadoInicial
  })
  
  // Refs para debounce
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})
  
  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout)
    }
  }, [])
  
  // Definir valor de um campo
  const definirValor = useCallback((nomeCampo: string, valor: string) => {
    setCampos(prev => ({
      ...prev,
      [nomeCampo]: {
        ...prev[nomeCampo],
        valor,
        erro: undefined // Limpa erro ao digitar
      }
    }))
    
    // Validacao em tempo real se configurada
    const config = configuracao[nomeCampo]
    if (config?.modoValidacao === "onChange") {
      // Limpar timeout anterior
      if (timeoutsRef.current[nomeCampo]) {
        clearTimeout(timeoutsRef.current[nomeCampo])
      }
      
      // Configurar novo timeout para debounce
      const delay = config.debounceMs || 300
      timeoutsRef.current[nomeCampo] = setTimeout(() => {
        validarCampo(nomeCampo)
      }, delay)
    }
  }, [configuracao])
  
  // Marcar campo como tocado
  const definirTocado = useCallback((nomeCampo: string, tocado = true) => {
    setCampos(prev => ({
      ...prev,
      [nomeCampo]: {
        ...prev[nomeCampo],
        tocado
      }
    }))
    
    // Validar no blur se configurado
    const config = configuracao[nomeCampo]
    if (tocado && config?.modoValidacao === "onBlur") {
      validarCampo(nomeCampo)
    }
  }, [configuracao])
  
  // Validar um campo especifico
  const validarCampo = useCallback(async (nomeCampo: string): Promise<boolean> => {
    const config = configuracao[nomeCampo]
    const campo = campos[nomeCampo]
    
    if (!config || !campo) return true
    
    // Marcar como validando
    setCampos(prev => ({
      ...prev,
      [nomeCampo]: {
        ...prev[nomeCampo],
        validando: true
      }
    }))
    
    let erro: string | undefined
    
    try {
      // Validacao sincrona
      if (config.validador) {
        erro = config.validador(campo.valor)
      }
      
      // Validacao assincrona (apenas se passou na sincrona)
      if (!erro && config.validacaoAssincrona) {
        erro = await config.validacaoAssincrona(campo.valor)
      }
    } catch (e) {
      erro = "Erro na validacao"
    }
    
    // Atualizar estado
    setCampos(prev => ({
      ...prev,
      [nomeCampo]: {
        ...prev[nomeCampo],
        erro,
        validando: false
      }
    }))
    
    return !erro
  }, [configuracao, campos])
  
  // Validar todo o formulario
  const validarFormulario = useCallback(async (): Promise<boolean> => {
    const nomesCampos = Object.keys(configuracao)
    const resultados = await Promise.all(
      nomesCampos.map(nome => validarCampo(nome))
    )
    
    return resultados.every(Boolean)
  }, [configuracao, validarCampo])
  
  // Limpar erros
  const limparErros = useCallback((nomeCampo?: string) => {
    if (nomeCampo) {
      setCampos(prev => ({
        ...prev,
        [nomeCampo]: {
          ...prev[nomeCampo],
          erro: undefined
        }
      }))
    } else {
      setCampos(prev => {
        const novoEstado = { ...prev }
        Object.keys(novoEstado).forEach(nome => {
          novoEstado[nome] = {
            ...novoEstado[nome],
            erro: undefined
          }
        })
        return novoEstado
      })
    }
  }, [])
  
  // Resetar formulario
  const resetarFormulario = useCallback(() => {
    setCampos(prev => {
      const novoEstado = { ...prev }
      Object.keys(novoEstado).forEach(nome => {
        novoEstado[nome] = {
          valor: valoresIniciais[nome] || "",
          tocado: false,
          validando: false,
          erro: undefined
        }
      })
      return novoEstado
    })
    
    // Limpar timeouts
    Object.values(timeoutsRef.current).forEach(clearTimeout)
    timeoutsRef.current = {}
  }, [valoresIniciais])
  
  // Computed values
  const temErros = Object.values(campos).some(campo => !!campo.erro)
  const estaValidando = Object.values(campos).some(campo => campo.validando)
  const formularioTocado = Object.values(campos).some(campo => campo.tocado)
  
  return {
    campos,
    definirValor,
    definirTocado,
    validarCampo,
    validarFormulario,
    limparErros,
    resetarFormulario,
    temErros,
    estaValidando,
    formularioTocado
  }
}