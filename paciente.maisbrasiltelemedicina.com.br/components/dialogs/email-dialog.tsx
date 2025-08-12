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
import { Loader2, Mail, AlertCircle } from "lucide-react"

interface EmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail?: string
  onSave: (newEmail: string, password: string) => Promise<void>
  isLoading?: boolean
}

export function EmailDialog({
  open,
  onOpenChange,
  currentEmail = "",
  onSave,
  isLoading = false,
}: EmailDialogProps) {
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmEmail, setConfirmEmail] = useState("")

  React.useEffect(() => {
    if (!open) {
      setNewEmail("")
      setPassword("")
      setConfirmEmail("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newEmail !== confirmEmail) {
      alert("Os emails não coincidem")
      return
    }
    
    if (newEmail === currentEmail) {
      alert("O novo email deve ser diferente do atual")
      return
    }
    
    await onSave(newEmail, password)
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const canSubmit = newEmail && 
                   confirmEmail && 
                   password && 
                   newEmail === confirmEmail && 
                   isValidEmail(newEmail) &&
                   newEmail !== currentEmail

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <DialogTitle>Alterar Email</DialogTitle>
          </div>
          <DialogDescription>
            Digite o novo email e sua senha atual para confirmar a alteração.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Email atual: <strong>{currentEmail}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newEmail" className="text-right">
                Novo Email
              </Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="col-span-3"
                placeholder="novo@email.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmEmail" className="text-right">
                Confirmar Email
              </Label>
              <Input
                id="confirmEmail"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="col-span-3"
                placeholder="novo@email.com"
                required
              />
            </div>

            {newEmail && confirmEmail && newEmail !== confirmEmail && (
              <div className="col-span-4 text-sm text-red-600">
                Os emails não coincidem
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha Atual
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                placeholder="Digite sua senha atual"
                required
              />
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Importante:</p>
                <p>Você receberá um email de confirmação no novo endereço. A alteração só será efetivada após a confirmação.</p>
              </div>
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
            <Button 
              type="submit" 
              disabled={!canSubmit || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alterar Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}