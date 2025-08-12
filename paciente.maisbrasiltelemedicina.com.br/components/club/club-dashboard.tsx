"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button" 
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  Gift, 
  Crown, 
  TrendingUp, 
  Users, 
  Calendar,
  MapPin,
  ExternalLink
} from "lucide-react"

interface ClubDashboardProps {
  memberLevel?: "bronze" | "prata" | "ouro" | "diamante"
  points?: number
  nextLevelPoints?: number
  benefits?: string[]
  nearbyPartners?: Array<{
    name: string
    category: string
    discount: string
    distance: string
  }>
  recentOffers?: Array<{
    title: string
    description: string
    validUntil: string
    discount: string
  }>
}

export function ClubDashboard({
  memberLevel = "bronze",
  points = 150,
  nextLevelPoints = 500,
  benefits = [
    "Desconto em farmácias",
    "Cashback em consultas", 
    "Acesso a eventos exclusivos"
  ],
  nearbyPartners = [
    {
      name: "Farmácia Central",
      category: "Farmácia",
      discount: "15%",
      distance: "2.1 km"
    },
    {
      name: "Ótica Visão",
      category: "Ótica", 
      discount: "20%",
      distance: "3.5 km"
    }
  ],
  recentOffers = [
    {
      title: "Consulta de Nutrição",
      description: "Desconto especial para membros do clube",
      validUntil: "31/12/2024",
      discount: "25%"
    }
  ]
}: ClubDashboardProps) {
  
  const levelColors = {
    bronze: "bg-orange-100 text-orange-800",
    prata: "bg-gray-100 text-gray-800", 
    ouro: "bg-yellow-100 text-yellow-800",
    diamante: "bg-purple-100 text-purple-800"
  }

  const levelLabels = {
    bronze: "Bronze",
    prata: "Prata",
    ouro: "Ouro", 
    diamante: "Diamante"
  }

  const progressPercentage = (points / nextLevelPoints) * 100

  return (
    <div className="space-y-6">
      {/* Status do Membro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Status de Membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Badge className={levelColors[memberLevel]}>
                <Star className="h-3 w-3 mr-1" />
                {levelLabels[memberLevel]}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{points}</p>
              <p className="text-sm text-muted-foreground">pontos</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para {levelLabels[memberLevel === "diamante" ? "diamante" : "prata"]}</span>
              <span>{points}/{nextLevelPoints}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefícios Ativos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-600" />
            Seus Benefícios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parceiros Próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Parceiros Próximos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nearbyPartners.map((partner, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{partner.name}</h4>
                  <p className="text-sm text-muted-foreground">{partner.category}</p>
                  <p className="text-xs text-muted-foreground">{partner.distance}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-2">
                    {partner.discount} OFF
                  </Badge>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ofertas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Ofertas Especiais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOffers.map((offer, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{offer.title}</h4>
                  <Badge className="bg-purple-100 text-purple-800">
                    {offer.discount} OFF
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {offer.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Válido até: {offer.validUntil}
                  </div>
                  <Button size="sm">
                    Usar Oferta
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            Resumo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-muted-foreground">Consultas</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">R$ 45</p>
              <p className="text-sm text-muted-foreground">Economia</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}