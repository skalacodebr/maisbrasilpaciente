"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, User, Hash } from "lucide-react"

interface CartaoVirtualProps {
  nomeUsuario?: string
  numeroCartao?: string
  validadeCartao?: string
  planName?: string
  status?: "ativo" | "inativo" | "suspenso"
}

export function CartaoVirtual({
  nomeUsuario = "Nome do Usuário",
  numeroCartao = "0000 0000 0000 0000",
  validadeCartao = "12/25",
  planName = "Plano Básico",
  status = "ativo",
}: CartaoVirtualProps) {
  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, '$1 ').trim()
  }

  const statusColors = {
    ativo: "bg-green-100 text-green-800",
    inativo: "bg-gray-100 text-gray-800", 
    suspenso: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    ativo: "Ativo",
    inativo: "Inativo",
    suspenso: "Suspenso",
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-0">
        {/* Cartão Virtual */}
        <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-semibold">Mais Brasil</h3>
              <p className="text-sm opacity-90">Telemedicina</p>
            </div>
            <Badge className={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs opacity-75 mb-1">NÚMERO DO CARTÃO</p>
              <p className="text-lg font-mono tracking-wider">
                {formatCardNumber(numeroCartao)}
              </p>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs opacity-75 mb-1">TITULAR</p>
                <p className="font-medium text-sm uppercase">
                  {nomeUsuario}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75 mb-1">VALIDADE</p>
                <p className="font-mono">{validadeCartao}</p>
              </div>
            </div>
          </div>

          {/* Chip do cartão */}
          <div className="absolute top-6 right-6 w-8 h-6 bg-yellow-400 rounded opacity-90"></div>
        </div>

        {/* Informações do Plano */}
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">{planName}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <span>ID: {numeroCartao.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Val: {validadeCartao}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}