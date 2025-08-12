"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

interface Dependente {
  id?: string
  nome: string
  cpf: string
  telefone: string
  dataNascimento: string
  parentesco: string
}

interface DependenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dependente?: Dependente | null
  onSave: (dependente: Dependente) => Promise<void>
  isLoading?: boolean
}

export function DependenteDialog({
  open,
  onOpenChange,
  dependente,
  onSave,
  isLoading = false,
}: DependenteDialogProps) {
  const [formData, setFormData] = useState<Dependente>({
    nome: "",
    cpf: "",
    telefone: "",
    dataNascimento: "",
    parentesco: "",
  })

  React.useEffect(() => {
    if (dependente) {
      setFormData(dependente)
    } else {
      setFormData({
        nome: "",
        cpf: "",
        telefone: "",
        dataNascimento: "",
        parentesco: "",
      })
    }
  }, [dependente, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const isEditing = !!dependente?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Dependente" : "Adicionar Dependente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do dependente."
              : "Preencha as informações para adicionar um novo dependente."}
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
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: e.target.value })
                }
                className="col-span-3"
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                className="col-span-3"
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataNascimento" className="text-right">
                Data Nasc.
              </Label>
              <Input
                id="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={(e) =>
                  setFormData({ ...formData, dataNascimento: e.target.value })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parentesco" className="text-right">
                Parentesco
              </Label>
              <Input
                id="parentesco"
                value={formData.parentesco}
                onChange={(e) =>
                  setFormData({ ...formData, parentesco: e.target.value })
                }
                className="col-span-3"
                placeholder="Filho(a), Cônjuge, etc."
                required
              />
            </div>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}