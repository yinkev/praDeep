'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Film, Image as ImageIcon, Loader2 } from 'lucide-react'
import type { MediaItem } from '@/context/GlobalContext'

interface MediaUploadProps {
  media: MediaItem[]
  onMediaChange: (media: MediaItem[]) => void
  maxFiles?: number
  disabled?: boolean
  acceptedTypes?: string[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function MediaUpload({
  media,
  onMediaChange,
  maxFiles = 5,
  disabled = false,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'],
}: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    setError(null)

    const newMedia: MediaItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        setError(`Unsupported file type: ${file.type}`)
        continue
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name} (max 10MB)`)
        continue
      }

      // Check max files
      if (media.length + newMedia.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`)
        break
      }

      try {
        const base64 = await fileToBase64(file)
        const type = file.type.startsWith('video/') ? 'video' : 'image'

        newMedia.push({
          type,
          data: base64,
          mimeType: file.type,
          name: file.name,
        })
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error processing file:', err)
        }
        setError(`Failed to process: ${file.name}`)
      }
    }

    if (newMedia.length > 0) {
      onMediaChange([...media, ...newMedia])
    }

    setIsProcessing(false)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const removeMedia = (index: number) => {
    const newMedia = [...media]
    newMedia.splice(index, 1)
    onMediaChange(newMedia)
    setError(null)
  }

  const handleClick = () => {
    if (!disabled && !isProcessing && media.length < maxFiles) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-2">
      {/* Upload Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing || media.length >= maxFiles}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all
          ${
            disabled || isProcessing || media.length >= maxFiles
              ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }
        `}
        title={media.length >= maxFiles ? `Max ${maxFiles} files` : 'Add image or video'}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
        <span>{isProcessing ? 'Processing...' : 'Add Media'}</span>
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}

      {/* Media preview */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((item, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
            >
              {item.type === 'image' ? (
                <Image
                  src={`data:${item.mimeType};base64,${item.data}`}
                  alt={item.name || `Image ${index + 1}`}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600">
                  <Film className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
              )}

              {/* Type indicator */}
              <div className="absolute bottom-0.5 left-0.5 p-0.5 bg-black/50 rounded">
                {item.type === 'image' ? (
                  <ImageIcon className="w-2.5 h-2.5 text-white" />
                ) : (
                  <Film className="w-2.5 h-2.5 text-white" />
                )}
              </div>

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  aria-label={`Remove ${item.type === 'image' ? 'image' : 'video'} ${item.name || index + 1}`}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
