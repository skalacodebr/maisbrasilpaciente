"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone } from "lucide-react"

interface ConsultaCardProps {
  id?: string
  specialty?: string
  doctor?: string
  date?: string
  time?: string
  status?: "scheduled" | "completed" | "cancelled" | "in_progress"
  type?: "video" | "phone" | "in_person"
  onAction?: () => void
  actionLabel?: string
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  in_progress: "bg-yellow-100 text-yellow-800",
}

const statusLabels = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  in_progress: "Em andamento",
}

export function ConsultaCard({
  id,
  specialty = "Clínica Geral",
  doctor = "Dr. João Silva",
  date = "2024-01-15",
  time = "14:30",
  status = "scheduled",
  type = "video",
  onAction,
  actionLabel = "Iniciar Consulta",
}: ConsultaCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{specialty}</CardTitle>
          <Badge className={statusColors[status]}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{doctor}</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{type === "video" ? "Videochamada" : type === "phone" ? "Telefone" : "Presencial"}</span>
        </div>

        {onAction && (
          <div className="pt-2">
            <Button onClick={onAction} className="w-full">
              {actionLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}