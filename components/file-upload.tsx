'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number
}

export function FileUpload({ onFileSelect, accept = '.csv,.pdf', maxSize = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowedExtensions = accept.split(',')
    
    if (!allowedExtensions.includes(extension)) {
      setError(`Use ${accept} files only`)
      return false
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`Max ${maxSize}MB`)
      return false
    }

    setError(null)
    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }, [accept, maxSize, onFileSelect])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
      onFileSelect(file)
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 transition-colors flex flex-col items-center justify-center cursor-pointer ${
            isDragging ? "border-zinc-400 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"
          }`}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
          <Upload className={`w-6 h-6 mb-3 ${isDragging ? 'text-zinc-600' : 'text-zinc-400'}`} />
          <p className="text-sm text-zinc-600">
            Drop file or <span className="font-medium text-zinc-900">browse</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">PDF or CSV up to {maxSize}MB</p>
        </div>
      ) : (
        <div className="border border-zinc-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center">
              <File className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{selectedFile.name}</p>
              <p className="text-xs text-zinc-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button 
            onClick={clearFile}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
