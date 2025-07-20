/**
 * AIDA Assistentes - Assistants Page
 * Página de gerenciamento de assistentes de IA
 * PATTERN: CRUD interface with real-time updates
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/stores';
import { withAuth } from '@/lib/auth';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Bot, MoreVertical, Edit, Trash2, MessageSquare, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Assistant {
  id: string;
  name: string;
  description?: string;
  personality?: string;
  instructions?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  status: 'active' | 'inactive';
  whatsapp_number?: string;
  webhook_url?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    conversations: number;
  };
}

interface CreateAssistantData {
  name: string;
  description?: string;
  personality?: string;
  instructions?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  whatsapp_number?: string;
}

const AI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4 (Mais Inteligente)' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Mais Rápido)' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
];

function AssistantsPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<CreateAssistantData>({
    name: '',
    description: '',
    personality: '',
    instructions: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    max_tokens: 1000,
    whatsapp_number: ''
  });

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ assistants: Assistant[] }>('/api/assistants');
      
      if (response.success && response.data) {
        setAssistants(response.data.assistants);
      }
    } catch (error) {
      console.error('Error loading assistants:', error);
      toast.error('Erro ao carregar assistentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateAssistantData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      personality: '',
      instructions: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1000,
      whatsapp_number: ''
    });
    setEditingAssistant(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome do assistente é obrigatório');
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await apiClient.post<{ assistant: Assistant }>('/api/assistants', formData);
      
      if (response.success && response.data) {
        setAssistants(prev => [...prev, response.data!.assistant]);
        setShowCreateDialog(false);
        resetForm();
        toast.success('Assistente criado com sucesso!');
      }
    } catch (error: any) {
      console.error('Error creating assistant:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar assistente';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      description: assistant.description || '',
      personality: assistant.personality || '',
      instructions: assistant.instructions || '',
      model: assistant.model,
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
      whatsapp_number: assistant.whatsapp_number || ''
    });
    setShowCreateDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAssistant || !formData.name.trim()) {
      toast.error('Nome do assistente é obrigatório');
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await apiClient.put<{ assistant: Assistant }>(
        `/api/assistants/${editingAssistant.id}`, 
        formData
      );
      
      if (response.success && response.data) {
        setAssistants(prev => 
          prev.map(a => a.id === editingAssistant.id ? response.data!.assistant : a)
        );
        setShowCreateDialog(false);
        resetForm();
        toast.success('Assistente atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Error updating assistant:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar assistente';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (assistantId: string) => {
    if (!confirm('Tem certeza que deseja excluir este assistente?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/assistants/${assistantId}`);
      
      if (response.success) {
        setAssistants(prev => prev.filter(a => a.id !== assistantId));
        toast.success('Assistente excluído com sucesso!');
      }
    } catch (error: any) {
      console.error('Error deleting assistant:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao excluir assistente';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-500' : 'bg-gray-500';
  };

  const getModelLabel = (model: string) => {
    return AI_MODELS.find(m => m.value === model)?.label || model;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assistentes de IA</h1>
          <p className="text-muted-foreground">
            Gerencie seus assistentes virtuais para WhatsApp Business
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Assistente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAssistant ? 'Editar Assistente' : 'Criar Novo Assistente'}
              </DialogTitle>
              <DialogDescription>
                Configure as características e comportamento do seu assistente de IA
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editingAssistant ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Assistente de Vendas"
                    disabled={isCreating}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">Número WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                    placeholder="Ex: +5511999999999"
                    disabled={isCreating}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Breve descrição do assistente"
                  disabled={isCreating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personality">Personalidade</Label>
                <Textarea
                  id="personality"
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                  placeholder="Ex: Amigável, profissional, prestativo..."
                  disabled={isCreating}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => handleInputChange('instructions', e.target.value)}
                  placeholder="Instruções específicas sobre como o assistente deve se comportar..."
                  disabled={isCreating}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo de IA</Label>
                  <Select 
                    value={formData.model} 
                    onValueChange={(value) => handleInputChange('model', value)}
                    disabled={isCreating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="temperature">Criatividade</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                    disabled={isCreating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Máx. Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    min="100"
                    max="4000"
                    value={formData.max_tokens}
                    onChange={(e) => handleInputChange('max_tokens', parseInt(e.target.value))}
                    disabled={isCreating}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingAssistant ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingAssistant ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assistants Grid */}
      {assistants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum assistente criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro assistente de IA para começar a automatizar seu atendimento no WhatsApp
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Assistente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{assistant.name}</CardTitle>
                      {assistant.description && (
                        <CardDescription className="text-sm">
                          {assistant.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(assistant)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(assistant.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(assistant.status)} text-white`}
                  >
                    {assistant.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getModelLabel(assistant.model)}
                  </span>
                </div>
                
                {assistant.whatsapp_number && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{assistant.whatsapp_number}</span>
                  </div>
                )}
                
                {assistant._count && (
                  <div className="text-sm text-muted-foreground">
                    {assistant._count.conversations} conversas
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Temp: {assistant.temperature}</span>
                  <span>Tokens: {assistant.max_tokens}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(AssistantsPage);