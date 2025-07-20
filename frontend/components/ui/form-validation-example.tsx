"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EnhancedSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidationMessage, ValidationAnnouncer, useValidationAnnouncements } from "@/components/ui/validation-message"
import { useFormValidation } from "@/hooks/use-form-validation"
import { 
  obrigatorio, 
  email, 
  senhaForte, 
  confirmarSenha, 
  telefone, 
  comprimentoMinimo,
  combinarValidadores 
} from "@/lib/validation-utils"
import { toast } from "sonner"

// Exemplo de validação assíncrona (simula verificação de email único)
const verificarEmailUnico = async (email: string): Promise<string | undefined> => {
  if (!email) return undefined
  
  // Simula delay de API
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simula emails já cadastrados
  const emailsExistentes = ["admin@exemplo.com", "usuario@teste.com"]
  if (emailsExistentes.includes(email.toLowerCase())) {
    return "Este email já está cadastrado"
  }
  
  return undefined
}

export function FormValidationExample() {
  const { announcements, announce } = useValidationAnnouncements()
  
  // Configuração do formulário
  const configuracaoFormulario = {
    nome: {
      validador: combinarValidadores(
        obrigatorio("Nome é obrigatório"),
        comprimentoMinimo(2, "Nome deve ter pelo menos 2 caracteres")
      ),
      modoValidacao: "onBlur" as const
    },
    email: {
      validador: combinarValidadores(
        obrigatorio("Email é obrigatório"),
        email("Digite um email válido")
      ),
      validacaoAssincrona: verificarEmailUnico,
      modoValidacao: "onChange" as const,
      debounceMs: 500
    },
    senha: {
      validador: combinarValidadores(
        obrigatorio("Senha é obrigatória"),
        senhaForte()
      ),
      modoValidacao: "onChange" as const
    },
    confirmarSenha: {
      validador: (valor: string) => {
        const senhaOriginal = formulario.campos.senha?.valor || ""
        return combinarValidadores(
          obrigatorio("Confirmação de senha é obrigatória"),
          confirmarSenha(senhaOriginal)
        )(valor)
      },
      modoValidacao: "onChange" as const
    },
    telefone: {
      validador: telefone("Digite um telefone válido"),
      modoValidacao: "onBlur" as const
    },
    bio: {
      validador: comprimentoMinimo(10, "Bio deve ter pelo menos 10 caracteres"),
      modoValidacao: "onBlur" as const
    },
    categoria: {
      validador: obrigatorio("Selecione uma categoria"),
      modoValidacao: "onBlur" as const
    },
    genero: {
      validador: obrigatorio("Selecione um gênero"),
      modoValidacao: "onBlur" as const
    }
  }
  
  const formulario = useFormValidation(configuracaoFormulario)
  
  // Estados adicionais
  const [aceitarTermos, setAceitarTermos] = React.useState(false)
  const [receberEmails, setReceberEmails] = React.useState(false)
  const [erroTermos, setErroTermos] = React.useState<string>()
  
  // Manipuladores de eventos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar termos
    if (!aceitarTermos) {
      setErroTermos("Você deve aceitar os termos de uso")
      announce("Erro: Você deve aceitar os termos de uso")
      return
    } else {
      setErroTermos(undefined)
    }
    
    // Validar formulário
    const formularioValido = await formulario.validarFormulario()
    
    if (formularioValido) {
      toast.success("Formulário enviado com sucesso!")
      announce("Formulário enviado com sucesso")
      
      // Simular envio
      console.log("Dados do formulário:", {
        ...Object.fromEntries(
          Object.entries(formulario.campos).map(([key, campo]) => [key, campo.valor])
        ),
        aceitarTermos,
        receberEmails
      })
    } else {
      toast.error("Corrija os erros no formulário")
      announce("Existem erros no formulário que precisam ser corrigidos")
    }
  }
  
  const handleReset = () => {
    formulario.resetarFormulario()
    setAceitarTermos(false)
    setReceberEmails(false)
    setErroTermos(undefined)
    toast.info("Formulário resetado")
  }
  
  return (
    <>
      <ValidationAnnouncer announcements={announcements} />
      
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Exemplo de Validação de Formulário</CardTitle>
          <CardDescription>
            Demonstração do sistema de validação com feedback em tempo real
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome *
              </label>
              <Input
                id="nome"
                value={formulario.campos.nome?.valor || ""}
                onChange={(e) => formulario.definirValor("nome", e.target.value)}
                onBlur={() => formulario.definirTocado("nome")}
                placeholder="Digite seu nome completo"
                state={formulario.campos.nome?.erro ? "error" : "default"}
              />
              <ValidationMessage 
                message={formulario.campos.nome?.erro}
                type="error"
              />
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formulario.campos.email?.valor || ""}
                onChange={(e) => formulario.definirValor("email", e.target.value)}
                onBlur={() => formulario.definirTocado("email")}
                placeholder="seu@email.com"
                state={formulario.campos.email?.erro ? "error" : "default"}
                disabled={formulario.campos.email?.validando}
              />
              {formulario.campos.email?.validando && (
                <p className="text-xs text-muted-foreground">
                  Verificando disponibilidade...
                </p>
              )}
              <ValidationMessage 
                message={formulario.campos.email?.erro}
                type="error"
              />
            </div>
            
            {/* Senha */}
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium">
                Senha *
              </label>
              <Input
                id="senha"
                type="password"
                value={formulario.campos.senha?.valor || ""}
                onChange={(e) => formulario.definirValor("senha", e.target.value)}
                onBlur={() => formulario.definirTocado("senha")}
                placeholder="Digite uma senha forte"
                state={formulario.campos.senha?.erro ? "error" : "default"}
              />
              <ValidationMessage 
                message={formulario.campos.senha?.erro}
                type="error"
              />
            </div>
            
            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmarSenha" className="text-sm font-medium">
                Confirmar Senha *
              </label>
              <Input
                id="confirmarSenha"
                type="password"
                value={formulario.campos.confirmarSenha?.valor || ""}
                onChange={(e) => formulario.definirValor("confirmarSenha", e.target.value)}
                onBlur={() => formulario.definirTocado("confirmarSenha")}
                placeholder="Confirme sua senha"
                state={formulario.campos.confirmarSenha?.erro ? "error" : "default"}
              />
              <ValidationMessage 
                message={formulario.campos.confirmarSenha?.erro}
                type="error"
              />
            </div>
            
            {/* Telefone */}
            <div className="space-y-2">
              <label htmlFor="telefone" className="text-sm font-medium">
                Telefone
              </label>
              <Input
                id="telefone"
                type="tel"
                value={formulario.campos.telefone?.valor || ""}
                onChange={(e) => formulario.definirValor("telefone", e.target.value)}
                onBlur={() => formulario.definirTocado("telefone")}
                placeholder="(11) 99999-9999"
                state={formulario.campos.telefone?.erro ? "error" : "default"}
              />
              <ValidationMessage 
                message={formulario.campos.telefone?.erro}
                type="error"
              />
            </div>
            
            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Biografia
              </label>
              <Textarea
                id="bio"
                value={formulario.campos.bio?.valor || ""}
                onChange={(e) => formulario.definirValor("bio", e.target.value)}
                onBlur={() => formulario.definirTocado("bio")}
                placeholder="Conte um pouco sobre você..."
                maxLength={500}
                showCharCount
                state={formulario.campos.bio?.erro ? "error" : "default"}
              />
              <ValidationMessage 
                message={formulario.campos.bio?.erro}
                type="error"
              />
            </div>
            
            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Categoria *
              </label>
              <EnhancedSelect
                value={formulario.campos.categoria?.valor || ""}
                onValueChange={(value) => formulario.definirValor("categoria", value)}
                placeholder="Selecione uma categoria"
                state={formulario.campos.categoria?.erro ? "error" : "default"}
              >
                <SelectContent>
                  <SelectItem value="desenvolvedor">Desenvolvedor</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="gerente">Gerente de Projeto</SelectItem>
                  <SelectItem value="analista">Analista</SelectItem>
                </SelectContent>
              </EnhancedSelect>
              <ValidationMessage 
                message={formulario.campos.categoria?.erro}
                type="error"
              />
            </div>
            
            {/* Gênero */}
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Gênero *
              </label>
              <RadioGroup
                value={formulario.campos.genero?.valor || ""}
                onValueChange={(value) => formulario.definirValor("genero", value)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="masculino" id="masculino" />
                  <label htmlFor="masculino" className="text-sm">Masculino</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feminino" id="feminino" />
                  <label htmlFor="feminino" className="text-sm">Feminino</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outro" id="outro" />
                  <label htmlFor="outro" className="text-sm">Outro</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao-informar" id="nao-informar" />
                  <label htmlFor="nao-informar" className="text-sm">Prefiro não informar</label>
                </div>
              </RadioGroup>
              <ValidationMessage 
                message={formulario.campos.genero?.erro}
                type="error"
              />
            </div>
            
            {/* Termos */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termos"
                  checked={aceitarTermos}
                  onCheckedChange={setAceitarTermos}
                />
                <label htmlFor="termos" className="text-sm">
                  Aceito os termos de uso e política de privacidade *
                </label>
              </div>
              <ValidationMessage 
                message={erroTermos}
                type="error"
              />
            </div>
            
            {/* Emails */}
            <div className="flex items-center space-x-2">
              <Switch
                id="emails"
                checked={receberEmails}
                onCheckedChange={setReceberEmails}
              />
              <label htmlFor="emails" className="text-sm">
                Desejo receber emails promocionais
              </label>
            </div>
            
            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                disabled={formulario.estaValidando}
                className="flex-1"
              >
                {formulario.estaValidando ? "Validando..." : "Enviar"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={formulario.estaValidando}
              >
                Limpar
              </Button>
            </div>
            
            {/* Status do formulário */}
            {formulario.formularioTocado && (
              <div className="text-xs text-muted-foreground text-center">
                {formulario.temErros 
                  ? "Existem erros no formulário" 
                  : "Formulário válido"
                }
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  )
}