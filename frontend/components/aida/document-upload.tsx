'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AidaCard } from './aida-card';
import { AidaButton } from './aida-button';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/design-system';

interface UploadFile {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface DocumentUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  maxFiles?: number;
  maxFileSize?: number; // em MB
  acceptedFileTypes?: string[];
  currentUsage?: number;
  maxUsage?: number;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = ['.pdf', '.txt', '.docx', '.md'];
const DEFAULT_MAX_SIZE = 50; // 50MB

export function DocumentUpload({
  onUpload,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  currentUsage = 0,
  maxUsage = 10,
  className
}: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Verificar limite de documentos
    const remainingSlots = maxUsage - currentUsage;
    if (acceptedFiles.length > remainingSlots) {
      alert(`Você pode adicionar apenas ${remainingSlots} documentos. Faça upgrade para adicionar mais.`);
      return;
    }

    // Criar objetos de upload
    const newUploadFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'uploading',
      progress: 0
    }));

    setUploadFiles(newUploadFiles);
    setIsUploading(true);

    try {
      // Simular progresso de upload
      for (const uploadFile of newUploadFiles) {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: 50 }
            : f
        ));
      }

      await onUpload(acceptedFiles);

      // Marcar como sucesso
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'success',
        progress: 100
      })));

      // Limpar após 3 segundos
      setTimeout(() => {
        setUploadFiles([]);
      }, 3000);

    } catch (error) {
      // Marcar como erro
      setUploadFiles(prev => prev.map(f => ({
        ...f,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro no upload'
      })));
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, maxUsage, currentUsage]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md']
    },
    maxFiles,
    maxSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
    disabled: isUploading || currentUsage >= maxUsage
  });

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUpload = currentUsage < maxUsage && !isUploading;

  return (
    <AidaCard
      title="Base de Conhecimento"
      description={`${currentUsage}/${maxUsage} documentos utilizados`}
      className={className}
      header={
        <FileText className="w-5 h-5 text-amber-600" />
      }
    >
      <div className="space-y-4">
        {/* Usage indicator */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Documentos</span>
          <span className={cn(
            'font-medium',
            currentUsage >= maxUsage ? 'text-red-600' : 'text-green-600'
          )}>
            {currentUsage}/{maxUsage}
          </span>
        </div>

        {/* Upload area */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            isDragActive ? 'border-amber-400 bg-amber-50' : '',
            !canUpload ? 'opacity-50 cursor-not-allowed' : '',
            canUpload && !isDragActive ? 'border-gray-300 hover:border-amber-400 hover:bg-amber-50' : ''
          )}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-3">
            <Upload className={cn(
              'mx-auto w-8 h-8',
              isDragActive ? 'text-amber-600' : 'text-gray-400'
            )} />
            
            {canUpload ? (
              <>
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Solte os arquivos aqui' : 'Arraste documentos ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Suporte: PDF, TXT, DOCX, MD (máx. {maxFileSize}MB cada)
                  </p>
                </div>
                
                <AidaButton variant="outline" size="sm">
                  Selecionar Arquivos
                </AidaButton>
              </>
            ) : (
              <div>
                <p className="text-sm font-medium text-red-600">
                  Limite de documentos atingido
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faça upgrade para adicionar mais documentos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File rejections */}
        {fileRejections.length > 0 && (
          <div className="space-y-2">
            {fileRejections.map(({ file, errors }) => (
              <div key={file.name} className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* Upload progress */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Upload em andamento:</h4>
            {uploadFiles.map((uploadFile) => (
              <div key={uploadFile.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                    {uploadFile.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {uploadFile.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    
                    <span className="font-medium truncate max-w-[200px]">
                      {uploadFile.file.name}
                    </span>
                    <span className="text-muted-foreground">
                      ({formatFileSize(uploadFile.file.size)})
                    </span>
                  </div>
                  
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {uploadFile.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}
                
                {uploadFile.status === 'error' && uploadFile.error && (
                  <p className="text-xs text-red-600">{uploadFile.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upgrade prompt */}
        {currentUsage >= maxUsage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Limite de documentos atingido
                </p>
                <p className="text-xs text-amber-700">
                  Faça upgrade para adicionar mais documentos à sua base de conhecimento
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AidaCard>
  );
}