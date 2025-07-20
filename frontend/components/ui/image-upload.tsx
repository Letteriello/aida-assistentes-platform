/**
 * AIDA Platform - Image Upload Component
 * Componente de upload de imagem com drag & drop, preview e validação
 * PATTERN: Origin UI Premium Image Upload with OKLCH theming
 */

import React, { useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ImageUploadProps {
  onUpload?: (file: File) => Promise<string>;
  onUploadComplete?: (url: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  value?: string; // URL da imagem atual
}

interface UploadState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  previewUrl: string | null;
}

export function ImageUpload({
  onUpload,
  onUploadComplete,
  onError,
  maxSize = 5, // 5MB default
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className,
  placeholder = 'Arraste e solte uma imagem ou clique para selecionar',
  disabled = false,
  value
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    previewUrl: value || null
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validação de arquivo
  const validateFile = useCallback((file: File): string | null => {
    // Verificar formato
    if (!acceptedFormats.includes(file.type)) {
      return `Formato não suportado. Use: ${acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}`;
    }

    // Verificar tamanho
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`;
    }

    // Verificar se é realmente uma imagem
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione apenas arquivos de imagem.';
    }

    return null;
  }, [acceptedFormats, maxSize]);

  // Processar arquivo selecionado
  const processFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      onError?.(validationError);
      return;
    }

    // Criar preview
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      previewUrl,
      error: null,
      isUploading: true,
      uploadProgress: 0
    }));

    try {
      if (onUpload) {
        // Simular progresso de upload
        const progressInterval = setInterval(() => {
          setState(prev => ({
            ...prev,
            uploadProgress: Math.min(prev.uploadProgress + 10, 90)
          }));
        }, 100);

        const uploadedUrl = await onUpload(file);
        
        clearInterval(progressInterval);
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100
        }));

        onUploadComplete?.(uploadedUrl);
      } else {
        // Se não há função de upload, apenas mostrar preview
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100
        }));
        onUploadComplete?.(previewUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isUploading: false,
        uploadProgress: 0
      }));
      onError?.(errorMessage);
      URL.revokeObjectURL(previewUrl);
    }
  }, [validateFile, onUpload, onUploadComplete, onError]);

  // Handlers de drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  // Handler de seleção de arquivo
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  // Remover imagem
  const handleRemove = useCallback(() => {
    if (state.previewUrl && state.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(state.previewUrl);
    }
    setState({
      isDragOver: false,
      isUploading: false,
      uploadProgress: 0,
      error: null,
      previewUrl: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [state.previewUrl]);

  // Abrir seletor de arquivo
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className={cn('w-full', className)}>
      {/* Área de Upload */}
      {!state.previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 cursor-pointer',
            'hover:border-primary/50 hover:bg-primary/5',
            'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
            {
              'border-primary bg-primary/10': state.isDragOver,
              'border-destructive bg-destructive/5': state.error,
              'border-muted-foreground/25 bg-muted/50 cursor-not-allowed': disabled,
              'border-muted-foreground/25': !state.isDragOver && !state.error && !disabled
            }
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Upload de imagem"
          />
          
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className={cn(
              'p-3 rounded-full transition-colors',
              state.isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <Upload className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {placeholder}
              </p>
              <p className="text-xs text-muted-foreground">
                Formatos: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • Máximo: {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Preview da Imagem */
        <div className="relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <img
              src={state.previewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            
            {/* Overlay de Loading */}
            {state.isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-background rounded-lg p-4 space-y-3 min-w-[200px]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="text-sm font-medium">Enviando...</span>
                  </div>
                  <Progress value={state.uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {state.uploadProgress}%
                  </p>
                </div>
              </div>
            )}
            
            {/* Botão de Remover */}
            {!state.isUploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            
            {/* Indicador de Sucesso */}
            {!state.isUploading && state.uploadProgress === 100 && (
              <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mensagem de Erro */}
      {state.error && (
        <div className="mt-3 flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}
    </div>
  );
}

// Accessibility improvements
ImageUpload.displayName = 'ImageUpload';

// Export types for external use
export type { ImageUploadProps, UploadState };