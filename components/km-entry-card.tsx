"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface KMEntry {
  id: string
  imageData: string
  date: string
  type: "Entrada" | "Saída"
}

interface KMEntryCardProps {
  entry: KMEntry
  onUpdate: (updates: Partial<KMEntry>) => void
  onRemove: () => void
}

export function KMEntryCard({ entry, onUpdate, onRemove }: KMEntryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const compressImage = (file: File, callback: (compressed: string) => void) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const maxWidth = 450
        const maxHeight = 450
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height *= maxWidth / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width *= maxHeight / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader()
              reader.onload = (e) => {
                callback(e.target?.result as string)
              }
              reader.readAsDataURL(blob)
            }
          },
          "image/jpeg",
          0.7,
        )
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      compressImage(file, (compressed) => {
        onUpdate({ imageData: compressed })
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) {
      compressImage(file, (compressed) => {
        onUpdate({ imageData: compressed })
      })
    }
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg print-avoid-break",
        entry.type === "Entrada" ? "border-l-4 border-l-primary" : "border-l-4 border-l-accent",
      )}
    >
      <Button
        onClick={onRemove}
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full no-print"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide",
              entry.type === "Entrada" ? "text-primary" : "text-accent",
            )}
          >
            {entry.type}
          </span>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative aspect-square rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            entry.imageData ? "border-solid" : "",
          )}
        >
          {entry.imageData ? (
            <img src={entry.imageData || "/placeholder.svg"} alt={entry.type} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8" />
              <p className="text-sm text-center px-4">Clique ou arraste uma imagem</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`date-${entry.id}`} className="text-xs font-medium flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            Data
          </Label>
          <Input
            id={`date-${entry.id}`}
            type="date"
            value={entry.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}
