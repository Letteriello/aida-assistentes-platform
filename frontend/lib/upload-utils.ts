// Advanced upload utilities based on Origin UI implementation

import type { ChunkedUploadOptions, PauseResumeUpload } from '@/types/file-upload'

/**
 * Upload file with progress tracking using XMLHttpRequest
 */
export function uploadFileWithProgress(
  file: File,
  url: string,
  options: {
    onProgress?: (progress: number) => void
    onComplete?: (response: any) => void
    onError?: (error: Error) => void
    headers?: Record<string, string>
  } = {}
): Promise<any> {
  const { onProgress, onComplete, onError, headers = {} } = options

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progressPercent = Math.round((event.loaded / event.total) * 100)
        onProgress?.(progressPercent)
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          onComplete?.(response)
          resolve(response)
        } catch (error) {
          const err = new Error('Invalid JSON response')
          onError?.(err)
          reject(err)
        }
      } else {
        const err = new Error(`Upload failed with status ${xhr.status}`)
        onError?.(err)
        reject(err)
      }
    })

    // Handle error
    xhr.addEventListener('error', () => {
      const err = new Error('Network error during upload')
      onError?.(err)
      reject(err)
    })

    // Handle abort
    xhr.addEventListener('abort', () => {
      const err = new Error('Upload was aborted')
      onError?.(err)
      reject(err)
    })

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    // Open and send the request
    xhr.open('POST', url, true)
    xhr.send(formData)
  })
}

/**
 * Upload large files in chunks
 */
export function uploadInChunks(
  file: File,
  url: string,
  options: ChunkedUploadOptions = {}
): Promise<any> {
  const {
    chunkSize = 1024 * 1024, // 1MB default
    maxRetries = 3,
    onProgress,
    onComplete,
    onError,
  } = options

  const totalChunks = Math.ceil(file.size / chunkSize)
  let currentChunk = 0
  let uploadedBytes = 0

  const uploadNextChunk = async (retryCount = 0): Promise<any> => {
    if (currentChunk >= totalChunks) {
      // All chunks uploaded successfully
      const result = { success: true, totalChunks, fileSize: file.size }
      onComplete?.(result)
      return result
    }

    const start = currentChunk * chunkSize
    const end = Math.min(file.size, start + chunkSize)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('file', chunk)
    formData.append('fileName', file.name)
    formData.append('chunkIndex', currentChunk.toString())
    formData.append('totalChunks', totalChunks.toString())
    formData.append('fileSize', file.size.toString())

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Chunk upload failed with status ${response.status}`)
      }

      // Update progress
      uploadedBytes += chunk.size
      currentChunk++
      const progress = Math.round((uploadedBytes / file.size) * 100)
      onProgress?.(progress)

      // Continue with next chunk
      return uploadNextChunk()
    } catch (error) {
      if (retryCount < maxRetries) {
        // Retry the current chunk
        console.warn(`Retrying chunk ${currentChunk}, attempt ${retryCount + 1}`)
        return uploadNextChunk(retryCount + 1)
      } else {
        // Max retries reached
        const err = new Error(`Failed to upload chunk ${currentChunk} after ${maxRetries} retries`)
        onError?.(err)
        throw err
      }
    }
  }

  return uploadNextChunk()
}

/**
 * Create pausable/resumable upload
 */
export function createPauseResumeUpload(
  file: File,
  url: string,
  options: {
    onProgress?: (progress: number) => void
    onComplete?: (response: any) => void
    onError?: (error: Error) => void
    headers?: Record<string, string>
  } = {}
): PauseResumeUpload {
  const { onProgress, onComplete, onError, headers = {} } = options
  
  let xhr: XMLHttpRequest | null = null
  let isPaused = false
  let isCancelled = false
  let uploadedBytes = 0
  let currentProgress = 0

  const startUpload = () => {
    if (isCancelled) return

    xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('file', file)

    // Track progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && !isPaused) {
        uploadedBytes = event.loaded
        currentProgress = Math.round((event.loaded / event.total) * 100)
        onProgress?.(currentProgress)
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr && xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          onComplete?.(response)
        } catch (error) {
          onError?.(new Error('Invalid JSON response'))
        }
      } else {
        onError?.(new Error(`Upload failed with status ${xhr?.status}`))
      }
    })

    // Handle error
    xhr.addEventListener('error', () => {
      if (!isPaused && !isCancelled) {
        onError?.(new Error('Network error during upload'))
      }
    })

    // Set headers
    Object.entries(headers).forEach(([key, value]) => {
      xhr?.setRequestHeader(key, value)
    })

    // For resume functionality, set Content-Range header
    if (uploadedBytes > 0) {
      xhr.setRequestHeader(
        'Content-Range',
        `bytes ${uploadedBytes}-${file.size - 1}/${file.size}`
      )
    }

    xhr.open('POST', url, true)
    xhr.send(formData)
  }

  const pause = () => {
    if (xhr && !isPaused && !isCancelled) {
      xhr.abort()
      isPaused = true
    }
  }

  const resume = () => {
    if (isPaused && !isCancelled) {
      isPaused = false
      startUpload()
    }
  }

  const cancel = () => {
    isCancelled = true
    if (xhr) {
      xhr.abort()
    }
    xhr = null
  }

  const getProgress = () => currentProgress

  // Start initial upload
  startUpload()

  return {
    pause,
    resume,
    cancel,
    getProgress,
  }
}

/**
 * Batch upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(
  files: File[],
  url: string,
  options: {
    onFileProgress?: (fileIndex: number, progress: number) => void
    onOverallProgress?: (progress: number) => void
    onFileComplete?: (fileIndex: number, response: any) => void
    onAllComplete?: (responses: any[]) => void
    onError?: (fileIndex: number, error: Error) => void
    concurrent?: boolean
    headers?: Record<string, string>
  } = {}
): Promise<any[]> {
  const {
    onFileProgress,
    onOverallProgress,
    onFileComplete,
    onAllComplete,
    onError,
    concurrent = false,
    headers = {},
  } = options

  const results: any[] = []
  const fileProgresses: number[] = new Array(files.length).fill(0)

  const updateOverallProgress = () => {
    const totalProgress = fileProgresses.reduce((sum, progress) => sum + progress, 0)
    const overallProgress = Math.round(totalProgress / files.length)
    onOverallProgress?.(overallProgress)
  }

  const uploadFile = async (file: File, index: number): Promise<any> => {
    try {
      const response = await uploadFileWithProgress(file, url, {
        onProgress: (progress) => {
          fileProgresses[index] = progress
          onFileProgress?.(index, progress)
          updateOverallProgress()
        },
        headers,
      })

      results[index] = response
      onFileComplete?.(index, response)
      return response
    } catch (error) {
      const err = error as Error
      onError?.(index, err)
      throw err
    }
  }

  if (concurrent) {
    // Upload all files concurrently
    const promises = files.map((file, index) => uploadFile(file, index))
    await Promise.allSettled(promises)
  } else {
    // Upload files sequentially
    for (let i = 0; i < files.length; i++) {
      try {
        await uploadFile(files[i], i)
      } catch (error) {
        // Continue with next file even if one fails
        console.error(`Failed to upload file ${i}:`, error)
      }
    }
  }

  onAllComplete?.(results)
  return results
}

/**
 * Utility to validate file before upload
 */
export function validateFileForUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSize, allowedTypes, allowedExtensions } = options

  // Check file size
  if (maxSize && file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return {
      isValid: false,
      error: `File size exceeds ${sizeMB}MB limit`,
    }
  }

  // Check file type
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  // Check file extension
  if (allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension .${extension} is not allowed`,
      }
    }
  }

  return { isValid: true }
}