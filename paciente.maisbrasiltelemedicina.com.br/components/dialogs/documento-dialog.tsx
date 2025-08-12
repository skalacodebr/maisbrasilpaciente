"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, File, X, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Documento {
  id?: string
  nome: string
  tipo: string
  arquivo?: File
  url?: string
}

interface DocumentoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documento?: Documento | null
  onSave: (documento: Documento) => Promise<void>
  isLoading?: boolean
}

const TIPOS_DOCUMENTO = [
  "RG",
  "CPF", 
  "CNH",
  "Comprovante de Residência",
  "Cartão do Plano",
  "Receita Médica",
  "Exame",
  "Atestado",
  "Outros"
]

export function DocumentoDialog({
  open,
  onOpenChange,
  documento,
  onSave,
  isLoading = false,
}: DocumentoDialogProps) {
  const [formData, setFormData] = useState<Documento>({
    nome: "",
    tipo: "",
  })
  const [dragActive, setDragActive] = useState(false)

  React.useEffect(() => {
    if (documento) {
      setFormData(documento)
    } else {
      setFormData({
        nome: "",
        tipo: "",
      })
    }
  }, [documento, open])

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    
    const file = fileList[0]
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!validTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use JPG, PNG ou PDF.')
      return
    }
    
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 10MB.')
      return
    }
    
    setFormData(prev => ({ ...prev, arquivo: file }))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = () => {
    setFormData(prev => ({ ...prev, arquivo: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isEditing = !!documento?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Documento" : "Adicionar Documento"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do documento."
              : "Preencha as informações e faça upload do documento."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                className="col-span-3"
                placeholder="Nome do documento"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">
                Tipo
              </Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({ ...formData, tipo: e.target.value })
                }
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Selecione o tipo</option>
                {TIPOS_DOCUMENTO.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {!isEditing && (
              <div>
                <Label>Arquivo do documento</Label>
                <div
                  className={cn(
                    "mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                    dragActive 
                      ? "border-primary bg-primary/10" 
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                    id="document-upload"
                  />
                  <label htmlFor="document-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Selecionar arquivo</span>
                    </Button>
                  </label>
                </div>

                {formData.arquivo && (
                  <div className="mt-4">
                    <Label>Arquivo selecionado:</Label>
                    <div className="flex items-center justify-between p-2 bg-muted rounded-lg mt-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">{formData.arquivo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(formData.arquivo.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!isEditing && !formData.arquivo)}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}