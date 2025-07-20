'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useFileUpload } from '@/hooks/use-file-upload'
import type { FileWithPreview, UploadProgress } from '@/types/file-upload'
import {
  ImageIcon,
  FileIcon,
  UploadIcon,
  XIcon,
  Trash2Icon,
  FileTextIcon,
  VideoIcon,
  MusicIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: string
  onFilesChange?: (files: FileWithPreview[]) => void
  onUpload?: (files: FileWithPreview[]) => Promise<void>
  className?: string
  disabled?: boolean
}

// Helper function to format file size
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Helper function to get file icon based on type
function getFileIcon(file: File) {
  const type = file.type
  
  if (type.startsWith('image/')) {
    return <ImageIcon className="size-4 opacity-60" />
  } else if (type.startsWith('video/')) {
    return <VideoIcon className="size-4 opacity-60" />
  } else if (type.startsWith('audio/')) {
    return <MusicIcon className="size-4 opacity-60" />
  } else if (type.includes('text') || type.includes('document')) {
    return <FileTextIcon className="size-4 opacity-60" />
  } else {
    return <FileIcon className="size-4 opacity-60" />
  }
}

export function FileUpload({
  multiple = false,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept,
  onFilesChange,
  onUpload,
  className,
  disabled = false,
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Handle files added
  const handleFilesAdded = (addedFiles: FileWithPreview[]) => {
    if (onFilesChange) {
      onFilesChange([...files, ...addedFiles])
    }
  }

  // Handle file removed
  const handleFileRemoved = (fileId: string) => {
    setUploadProgress(prev => prev.filter(p => p.fileId !== fileId))
  }

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] = useFileUpload({
    multiple,
    maxFiles,
    maxSize,
    accept,
    onFilesAdded: handleFilesAdded,
    onFileRemoved: handleFileRemoved,
  })

  // Handle upload
  const handleUpload = async () => {
    if (!onUpload || files.length === 0) return

    setIsUploading(true)
    
    // Initialize progress for all files
    const initialProgress = files.map(file => ({
      fileId: file.id,
      progress: 0,
      completed: false,
    }))
    setUploadProgress(initialProgress)

    try {
      await onUpload(files)
      
      // Mark all as completed
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, progress: 100, completed: true }))
      )
    } catch (error) {
      // Mark all as error
      setUploadProgress(prev => 
        prev.map(p => ({ ...p, error: 'Upload failed' }))
      )
    } finally {
      setIsUploading(false)
    }
  }

  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={disabled ? undefined : handleDragEnter}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDragOver={disabled ? undefined : handleDragOver}
        onDrop={disabled ? undefined : handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          // Base styles using design tokens
          'relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-all duration-200',
          // Border and background
          'border-input bg-background',
          // Hover and focus states
          'has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 has-[input:focus]:ring-[3px]',
          // Dragging state
          'data-[dragging=true]:border-primary data-[dragging=true]:bg-accent/50',
          // Files state
          'not-data-[files]:justify-center',
          // Disabled state
          'data-[disabled=true]:opacity-50 data-[disabled=true]:cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={disabled} />
        
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            {/* Header with actions */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Files ({files.length})
              </h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openFileDialog}
                  disabled={disabled || isUploading}
                >
                  <UploadIcon className="-ms-0.5 size-3.5 opacity-60" />
                  Add files
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearFiles}
                  disabled={disabled || isUploading}
                >
                  <Trash2Icon className="-ms-0.5 size-3.5 opacity-60" />
                  Remove all
                </Button>
              </div>
            </div>

            {/* Files list */}
            <div className="w-full space-y-2">
              {files.map((file) => {
                const fileProgress = uploadProgress.find(p => p.fileId === file.id)
                const isFileUploading = fileProgress && !fileProgress.completed && !fileProgress.error

                return (
                  <div
                    key={file.id}
                    data-uploading={isFileUploading || undefined}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border p-2 pe-3 transition-opacity duration-300',
                      'bg-background',
                      'data-[uploading=true]:opacity-75'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* File preview or icon */}
                        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="size-full rounded object-cover"
                            />
                          ) : (
                            getFileIcon(file.file)
                          )}
                        </div>
                        
                        {/* File info */}
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="truncate text-[13px] font-medium">
                            {file.file.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatBytes(file.file.size)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Remove button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                        onClick={() => removeFile(file.id)}
                        disabled={disabled || isUploading}
                        aria-label="Remove file"
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    {/* Progress bar */}
                    {fileProgress && !fileProgress.completed && !fileProgress.error && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${fileProgress.progress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-10 text-xs tabular-nums">
                          {fileProgress.progress}%
                        </span>
                      </div>
                    )}

                    {/* Error state */}
                    {fileProgress?.error && (
                      <p className="text-destructive text-xs mt-1">
                        {fileProgress.error}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upload button */}
            {onUpload && (
              <Button 
                onClick={handleUpload} 
                disabled={disabled || isUploading || files.length === 0}
                className="w-full"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            )}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border bg-background">
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">
              Drop your files here
            </p>
            <p className="text-muted-foreground text-xs">
              Max {maxFiles} files • Up to {maxSizeMB}MB
            </p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={openFileDialog}
              disabled={disabled}
            >
              <UploadIcon className="-ms-1 me-2 size-4 opacity-60" />
              Select files
            </Button>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <p key={index} className="text-destructive text-sm">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload