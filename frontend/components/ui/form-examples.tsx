"use client"

import * as React from "react"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { EnhancedSelect, SelectItem } from "./select"
import { EnhancedCheckbox } from "./checkbox"
import { EnhancedRadioGroup } from "./radio-group"
import { EnhancedSwitch } from "./switch"
import { Button } from "./button"
import { 
  Form, 
  FormField, 
  FormSection, 
  FormActions, 
  FormErrorSummary,
  FormLoadingOverlay 
} from "./form"
import { Mail, User, Eye, EyeOff } from "lucide-react"
import { FormValidationExample } from "./form-validation-example"

// Exemplo de validação simples
const validateEmail = (email: string) => {
  if (!email) return "Email é obrigatório"
  if (!/\S+@\S+\.\S+/.test(email)) return "Email inválido"
  return undefined
}

const validateRequired = (value: string) => {
  if (!value || value.trim() === "") return "Este campo é obrigatório"
  return undefined
}

const validateMinLength = (min: number) => (value: string) => {
  if (value && value.length < min) return `Mínimo de ${min} caracteres`
  return undefined
}

// Exemplo completo de formulário
export const FormExamples: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (data: Record<string, string | boolean>) => {
    setIsSubmitting(true)
    console.log("Dados do formulário:", data)
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
  }

  const validationSchema = {
    name: validateRequired,
    email: validateEmail,
    password: validateMinLength(6),
    bio: validateMinLength(10)
  }

  const radioOptions = [
    { value: "individual", label: "Pessoa Física", description: "Para uso pessoal" },
    { value: "business", label: "Pessoa Jurídica", description: "Para empresas" },
    { value: "nonprofit", label: "Organização sem fins lucrativos", description: "Para ONGs e instituições" }
  ]

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Exemplos de Componentes de Formulário</h1>
        <p className="text-muted-foreground">
          Demonstração dos componentes de formulário aprimorados com validação e acessibilidade.
        </p>
      </div>

      {/* Exemplo de formulário completo */}
      <div className="relative">
        <Form
          onSubmit={handleSubmit}
          validationSchema={validationSchema}
          initialValues={{
            name: "",
            email: "",
            password: "",
            bio: "",
            accountType: "individual",
            notifications: true,
            terms: false
          }}
          className="space-y-6"
        >
          <FormErrorSummary />
          
          <FormSection 
            title="Informações Pessoais"
            description="Preencha seus dados básicos"
          >
            <FormField name="name">
              <Input
                label="Nome completo"
                placeholder="Digite seu nome"
                leadingIcon={<User className="h-4 w-4" />}
                helperText="Como você gostaria de ser chamado"
                required
              />
            </FormField>

            <FormField name="email">
              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                leadingIcon={<Mail className="h-4 w-4" />}
                helperText="Usaremos este email para contato"
                required
              />
            </FormField>

            <FormField name="password">
              <Input
                type={showPassword ? "text" : "password"}
                label="Senha"
                placeholder="Digite sua senha"
                helperText="Mínimo de 6 caracteres"
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />
            </FormField>
          </FormSection>

          <FormSection 
            title="Sobre Você"
            description="Conte-nos um pouco sobre você"
          >
            <FormField name="bio">
              <Textarea
                label="Biografia"
                placeholder="Escreva uma breve descrição sobre você..."
                helperText="Mínimo de 10 caracteres"
                maxLength={500}
                showCharCount
                rows={4}
              />
            </FormField>

            <FormField name="accountType">
              <EnhancedRadioGroup
                label="Tipo de conta"
                options={radioOptions}
                helperText="Selecione o tipo que melhor se adequa ao seu uso"
              />
            </FormField>
          </FormSection>

          <FormSection title="Preferências">
            <FormField name="notifications">
              <EnhancedSwitch
                label="Receber notificações"
                description="Receba atualizações sobre sua conta por email"
              />
            </FormField>

            <FormField name="terms">
              <EnhancedCheckbox
                label="Aceito os termos de uso"
                description="Li e concordo com os termos de serviço e política de privacidade"
                required
              />
            </FormField>
          </FormSection>

          <FormActions>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </FormActions>
        </Form>

        <FormLoadingOverlay 
          isLoading={isSubmitting} 
          message="Criando sua conta..." 
        />
      </div>

      {/* Exemplos individuais de componentes */}
      <div className="space-y-8 pt-8 border-t">
        <h2 className="text-xl font-semibold">Componentes Individuais</h2>

        {/* Input variants */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Input Variants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              variant="default"
              placeholder="Default variant"
              label="Default"
            />
            <Input
              variant="filled"
              placeholder="Filled variant"
              label="Filled"
            />
            <Input
              variant="underline"
              placeholder="Underline variant"
              label="Underline"
            />
            <Input
              variant="minimal"
              placeholder="Minimal variant"
              label="Minimal"
            />
          </div>
        </div>

        {/* Input states */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Input States</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              state="default"
              placeholder="Normal state"
              label="Normal"
              helperText="This is a helper text"
            />
            <Input
              state="error"
              placeholder="Error state"
              label="Error"
              errorMessage="This field has an error"
            />
            <Input
              state="success"
              placeholder="Success state"
              label="Success"
              helperText="This field is valid"
            />
            <Input
              state="warning"
              placeholder="Warning state"
              label="Warning"
              helperText="This field needs attention"
            />
          </div>
        </div>

        {/* Floating labels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Floating Labels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              floatingLabel
              label="Nome"
              placeholder="Digite seu nome"
            />
            <Input
              floatingLabel
              label="Email"
              type="email"
              placeholder="seu@email.com"
              leadingIcon={<Mail className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Select examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Select Component</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedSelect
              label="País"
              placeholder="Selecione um país"
              helperText="Escolha seu país de residência"
            >
              <SelectItem value="br">Brasil</SelectItem>
              <SelectItem value="us">Estados Unidos</SelectItem>
              <SelectItem value="ca">Canadá</SelectItem>
              <SelectItem value="mx">México</SelectItem>
            </EnhancedSelect>

            <EnhancedSelect
              label="Estado"
              placeholder="Selecione um estado"
              variant="filled"
              state="error"
              errorMessage="Estado é obrigatório"
            >
              <SelectItem value="sp">São Paulo</SelectItem>
              <SelectItem value="rj">Rio de Janeiro</SelectItem>
              <SelectItem value="mg">Minas Gerais</SelectItem>
              <SelectItem value="rs">Rio Grande do Sul</SelectItem>
            </EnhancedSelect>
          </div>
        </div>

        {/* Checkbox and Switch examples */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Checkbox & Switch</h3>
          <div className="space-y-4">
            <EnhancedCheckbox
              label="Aceito receber emails promocionais"
              description="Você pode cancelar a qualquer momento"
            />
            
            <EnhancedSwitch
              label="Modo escuro"
              description="Ativar tema escuro da interface"
            />
            
            <EnhancedCheckbox
              variant="success"
              label="Tarefa concluída"
              description="Marque quando finalizar esta tarefa"
            />
          </div>
        </div>

        {/* Sistema de Validação Avançado */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sistema de Validação Avançado</h3>
          <FormValidationExample />
        </div>
      </div>
    </div>
  )
}