'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  FileWithPreview,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from '@/types/file-upload'

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    multiple = false,
    maxFiles = 1,
    maxSize = 5 * 1024 * 1024, // 5MB default
    accept,
    onFilesAdded,
    onFileRemoved,
    onError,
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  // Generate unique ID for files
  const generateFileId = useCallback(() => {
    return `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Create preview URL for images
  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return undefined
  }, [])

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        const sizeMB = (maxSize / (1024 * 1024)).toFixed(1)
        return `File "${file.name}" exceeds the maximum size of ${sizeMB}MB`
      }

      // Check file type if accept is specified
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim())
        const isAccepted = acceptedTypes.some(acceptedType => {
          if (acceptedType.startsWith('.')) {
            // File extension
            return file.name.toLowerCase().endsWith(acceptedType.toLowerCase())
          } else if (acceptedType.includes('/*')) {
            // MIME type wildcard (e.g., image/*)
            const [mainType] = acceptedType.split('/')
            return file.type.startsWith(mainType)
          } else {
            // Exact MIME type
            return file.type === acceptedType
          }
        })

        if (!isAccepted) {
          return `File "${file.name}" is not an accepted file type`
        }
      }

      return null
    },
    [maxSize, accept]
  )

  // Process and add files
  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: FileWithPreview[] = []
      const newErrors: string[] = []

      const filesToProcess = Array.from(fileList)

      // Check total file count
      const totalFiles = files.length + filesToProcess.length
      if (totalFiles > maxFiles) {
        newErrors.push(`Maximum of ${maxFiles} files allowed`)
        if (onError) onError(`Maximum of ${maxFiles} files allowed`)
        return
      }

      filesToProcess.forEach(file => {
        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
          newErrors.push(validationError)
          if (onError) onError(validationError)
          return
        }

        // Check for duplicates
        const isDuplicate = files.some(existingFile => 
          existingFile.file.name === file.name && 
          existingFile.file.size === file.size
        )

        if (isDuplicate) {
          newErrors.push(`File "${file.name}" is already selected`)
          if (onError) onError(`File "${file.name}" is already selected`)
          return
        }

        // Create file with preview
        const fileWithPreview: FileWithPreview = {
          id: generateFileId(),
          file,
          preview: createPreview(file),
        }

        newFiles.push(fileWithPreview)
      })

      if (newFiles.length > 0) {
        setFiles(prev => {
          const updated = multiple ? [...prev, ...newFiles] : newFiles
          if (onFilesAdded) onFilesAdded(newFiles)
          return updated
        })
      }

      if (newErrors.length > 0) {
        setErrors(prev => [...prev, ...newErrors])
      }
    },
    [files, maxFiles, multiple, validateFile, generateFileId, createPreview, onFilesAdded, onError]
  )

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      dragCounterRef.current = 0

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    },
    [processFiles]
  )

  // File input handler
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles)
      }
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [processFiles]
  )

  // Open file dialog
  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }, [])

  // Remove file
  const removeFile = useCallback(
    (fileId: string) => {
      setFiles(prev => {
        const fileToRemove = prev.find(f => f.id === fileId)
        if (fileToRemove?.preview) {
          URL.revokeObjectURL(fileToRemove.preview)
        }
        const updated = prev.filter(f => f.id !== fileId)
        if (onFileRemoved) onFileRemoved(fileId)
        return updated
      })
      // Clear related errors
      setErrors(prev => prev.filter(error => !error.includes(fileId)))
    },
    [onFileRemoved]
  )

  // Clear all files
  const clearFiles = useCallback(() => {
    // Revoke all preview URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    setErrors([])
  }, [files])

  // Get input props
  const getInputProps = useCallback(
    () => ({
      ref: inputRef,
      type: 'file' as const,
      multiple,
      accept,
      onChange: handleFileChange,
      style: { display: 'none' },
    }),
    [multiple, accept, handleFileChange]
  )

  return [
    {
      files,
      isDragging,
      errors,
    },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ]
}

export type { FileWithPreview, UseFileUploadOptions, UseFileUploadReturn }