# Enhanced File Upload System

## Overview

Sistema completo de upload de arquivos baseado na Origin UI, implementado para a Plataforma AIDA. Oferece funcionalidades avançadas como drag-and-drop, rastreamento de progresso, validação e upload em chunks.

## Arquivos Implementados

### Core Files
- `frontend/types/file-upload.ts` - Definições TypeScript
- `frontend/hooks/use-file-upload.ts` - Hook principal
- `frontend/components/ui/file-upload.tsx` - Componente UI
- `frontend/lib/upload-utils.ts` - Utilitários avançados
- `frontend/app/origin-ui-demo/file-upload/page.tsx` - Página de demonstração

## Funcionalidades

### ✅ Hook useFileUpload
- **Drag-and-drop nativo** com feedback visual
- **Validação avançada** (tipo, tamanho, duplicatas)
- **Preview de imagens** automático
- **Gerenciamento de estado** otimizado
- **Callbacks customizáveis** para eventos

### ✅ Componente FileUpload
- **Interface rica** com design tokens AIDA
- **Progress bars animadas** para cada arquivo
- **Estados visuais** (dragging, uploading, completed)
- **Integração com lucide-react** para ícones
- **Responsivo** e acessível

### ✅ Upload Utilities
- **Progress tracking** com XMLHttpRequest
- **Upload em chunks** para arquivos grandes
- **Pause/resume** de uploads
- **Upload múltiplo** (sequencial ou concorrente)
- **Retry automático** com exponential backoff

## Uso Básico

```tsx
import { FileUpload } from '@/components/ui/file-upload'

function MyComponent() {
  const handleFilesChange = (files: FileWithPreview[]) => {
    console.log('Files selected:', files)
  }

  const handleUpload = async (files: FileWithPreview[]) => {
    // Sua lógica de upload
    console.log('Uploading files:', files)
  }

  return (
    <FileUpload
      accept="image/*,application/pdf"
      maxFiles={5}
      maxSize={10 * 1024 * 1024} // 10MB
      onFilesChange={handleFilesChange}
      onUpload={handleUpload}
    />
  )
}
```

## Uso Avançado

### Upload com Progress Tracking

```tsx
import { uploadFileWithProgress } from '@/lib/upload-utils'

const handleAdvancedUpload = async (file: File) => {
  try {
    const result = await uploadFileWithProgress(
      file,
      '/api/upload',
      {
        onProgress: (progress) => {
          console.log(`Progress: ${progress}%`)
        },
        onComplete: (response) => {
          console.log('Upload completed:', response)
        },
        onError: (error) => {
          console.error('Upload failed:', error)
        }
      }
    )
  } catch (error) {
    console.error('Upload error:', error)
  }
}
```

### Upload em Chunks

```tsx
import { uploadInChunks } from '@/lib/upload-utils'

const handleChunkedUpload = async (file: File) => {
  try {
    await uploadInChunks(
      file,
      '/api/upload-chunk',
      {
        chunkSize: 1024 * 1024, // 1MB chunks
        onProgress: (progress) => {
          console.log(`Chunk progress: ${progress}%`)
        },
        onComplete: (result) => {
          console.log('Chunked upload completed:', result)
        }
      }
    )
  } catch (error) {
    console.error('Chunked upload failed:', error)
  }
}
```

### Upload Múltiplo

```tsx
import { uploadMultipleFiles } from '@/lib/upload-utils'

const handleMultipleUpload = async (files: File[]) => {
  try {
    await uploadMultipleFiles(
      files,
      '/api/upload',
      {
        onFileProgress: (fileIndex, progress) => {
          console.log(`File ${fileIndex}: ${progress}%`)
        },
        onOverallProgress: (progress) => {
          console.log(`Overall: ${progress}%`)
        },
        concurrent: true, // Upload em paralelo
      }
    )
  } catch (error) {
    console.error('Multiple upload failed:', error)
  }
}
```

## Props do FileUpload

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `accept` | `string` | `"*/*"` | Tipos de arquivo aceitos |
| `multiple` | `boolean` | `false` | Permite múltiplos arquivos |
| `maxFiles` | `number` | `1` | Número máximo de arquivos |
| `maxSize` | `number` | `10MB` | Tamanho máximo por arquivo |
| `onFilesChange` | `function` | - | Callback quando arquivos mudam |
| `onUpload` | `function` | - | Callback para iniciar upload |
| `disabled` | `boolean` | `false` | Desabilita o componente |
| `className` | `string` | - | Classes CSS adicionais |

## Tipos TypeScript

### FileWithPreview
```typescript
interface FileWithPreview {
  id: string
  file: File
  preview?: string
  progress?: number
  status?: 'idle' | 'uploading' | 'completed' | 'error'
  error?: string
}
```

### UploadProgress
```typescript
interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
}
```

## Integração com Design Tokens

O componente utiliza os design tokens AIDA definidos em `globals.css`:

- **Cores OKLCH** para consistência visual
- **Animações suaves** com durations padronizadas
- **Espaçamentos** seguindo a escala de design
- **Tipografia** com hierarquia definida

## Demonstração

Acesse `/origin-ui-demo/file-upload` para ver todos os recursos em ação:

- Upload básico de imagens
- Upload múltiplo com validação
- Upload de arquivos grandes com chunks
- Exemplos de código e documentação

## Benefícios para a AIDA

1. **Onboarding 5min**: Upload rápido de documentos e arquivos
2. **UX Apple-like**: Animações suaves e feedback visual
3. **Performance**: Upload otimizado para arquivos grandes
4. **Acessibilidade**: Suporte completo a screen readers
5. **Escalabilidade**: Pronto para integração com APIs

## Próximos Passos

- [ ] Integração com API de upload do backend
- [ ] Suporte a preview de mais tipos de arquivo
- [ ] Implementação de thumbnails
- [ ] Cache de uploads para retry
- [ ] Métricas de performance

---

**Implementado como parte da TASK-UI-008 - Enhanced File Upload**  
*Plataforma AIDA - Origin UI Migration*