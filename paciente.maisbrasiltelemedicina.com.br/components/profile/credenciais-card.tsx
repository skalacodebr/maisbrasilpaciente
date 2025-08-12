"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Eye, EyeOff, Copy, Check } from "lucide-react"

interface CredenciaisCardProps {
  usuario?: string
  senha?: string
  ultimoLogin?: string
  status?: "ativo" | "inativo"
  onAlterarSenha?: () => void
}

export function CredenciaisCard({
  usuario = "usuario@email.com",
  senha = "********",
  ultimoLogin = "Hoje às 14:30",
  status = "ativo",
  onAlterarSenha,
}: CredenciaisCardProps) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopyUsername = async () => {
    try {
      await navigator.clipboard.writeText(usuario)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const statusColors = {
    ativo: "bg-green-100 text-green-800",
    inativo: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    ativo: "Ativo",
    inativo: "Inativo",
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Credenciais de Acesso
          </CardTitle>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usuário */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Usuário/Email
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-gray-50 rounded border text-sm font-mono">
              {usuario}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUsername}
              className="flex items-center gap-1"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Senha
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-gray-50 rounded border text-sm font-mono">
              {showPassword ? senha : "••••••••"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Último Login */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Último Login
          </label>
          <div className="p-2 bg-gray-50 rounded border text-sm">
            {ultimoLogin}
          </div>
        </div>

        {/* Ações */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onAlterarSenha}
              className="flex-1"
            >
              Alterar Senha
            </Button>
          </div>
        </div>

        {/* Dicas de Segurança */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Dicas de Segurança
          </h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Não compartilhe suas credenciais com terceiros</li>
            <li>• Altere sua senha periodicamente</li>
            <li>• Use uma senha forte com letras, números e símbolos</li>
            <li>• Sempre faça logout ao usar computadores públicos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}