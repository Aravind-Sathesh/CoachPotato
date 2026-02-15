'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
}

export function UploadDropzone({ onFileSelect, isLoading }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        onFileSelect(file)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      onFileSelect(files[0])
    }
  }

  return (
    <Card
      className={`border-2 p-6 text-center cursor-pointer transition-all ${
        isDragActive 
          ? 'border-blue-500 bg-blue-950/30' 
          : 'border-blue-500/30 bg-zinc-900/50'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
        disabled={isLoading}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-lg bg-blue-500/10">
          <Upload className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-medium">Drop ticket PDF</p>
          <p className="text-zinc-400 text-xs mt-1">or click to browse</p>
        </div>

        <Button
          onClick={() => inputRef.current?.click()}
          variant="default"
          className="mt-3 bg-blue-500 text-white hover:bg-blue-600"
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? 'Parsing...' : 'Upload'}
        </Button>
      </div>
    </Card>
  )
}
