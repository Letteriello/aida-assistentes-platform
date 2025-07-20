// Types for the enhanced file upload system from Origin UI

export interface FileWithPreview {
  id: string
  file: File
  preview?: string
  progress?: number
  error?: string
}

export interface UploadProgress {
  fileId: string
  progress: number
  completed: boolean
  error?: string
}

export interface UseFileUploadOptions {
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: string
  onFilesAdded?: (files: FileWithPreview[]) => void
  onFileRemoved?: (fileId: string) => void
  onError?: (error: string) => void
}

export interface UseFileUploadState {
  files: FileWithPreview[]
  isDragging: boolean
  errors: string[]
}

export interface UseFileUploadActions {
  handleDragEnter: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  openFileDialog: () => void
  removeFile: (fileId: string) => void
  clearFiles: () => void
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>
}

export type UseFileUploadReturn = [UseFileUploadState, UseFileUploadActions]

// Upload utilities types
export interface ChunkedUploadOptions {
  chunkSize?: number
  maxRetries?: number
  onProgress?: (progress: number) => void
  onComplete?: (response: any) => void
  onError?: (error: Error) => void
}

export interface PauseResumeUpload {
  pause: () => void
  resume: () => void
  cancel: () => void
  getProgress: () => number
}