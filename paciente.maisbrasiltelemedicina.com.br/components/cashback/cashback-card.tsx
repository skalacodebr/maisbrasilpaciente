"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, TrendingUp, Gift } from "lucide-react"

interface CashbackCardProps {
  balance?: number
  totalEarned?: number
  pendingAmount?: number
  onViewDetails?: () => void
  onWithdraw?: () => void
}

export function CashbackCard({
  balance = 0,
  totalEarned = 0,
  pendingAmount = 0,
  onViewDetails,
  onWithdraw,
}: CashbackCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-green-600" />
            Cashback
          </CardTitle>
          <Badge variant="secondary">
            <Gift className="h-3 w-3 mr-1" />
            Disponível
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance)}
            </div>
            <div className="text-sm text-muted-foreground">
              Saldo Disponível
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalEarned)}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Ganho
            </div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(pendingAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              Pendente
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {onViewDetails && (
            <Button variant="outline" onClick={onViewDetails} className="flex-1">
              <TrendingUp className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>
          )}
          {onWithdraw && balance > 0 && (
            <Button onClick={onWithdraw} className="flex-1">
              <Coins className="h-4 w-4 mr-2" />
              Sacar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}