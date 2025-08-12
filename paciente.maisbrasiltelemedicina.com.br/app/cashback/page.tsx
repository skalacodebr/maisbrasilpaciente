"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, ArrowLeft, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency, formatarData } from "@/utils/format-utils"
import { CashbackCard } from "@/components/cashback/cashback-card"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

interface CashbackTransaction {
  id: string
  originalValue: number
  cashbackValue: number
  status: string
  createdAt: any
  confirmedAt?: any
  usedAt?: any
  expiresAt: any
}

export default function CashbackPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<CashbackTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        fetchTransactions(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchTransactions = async (userId: string, status?: string) => {
    try {
      setLoading(true)
      const url = status 
        ? `/api/cashback/transactions?userId=${userId}&status=${status}`
        : `/api/cashback/transactions?userId=${userId}`
        
      const response = await fetch(url)
      const data = await response.json()
      
      if (!response.ok) {
        console.error("Erro na API:", data.error)
        // Se for erro de coleção não existir, apenas retorna array vazio
        setTransactions([])
        return
      }
      
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error("Erro ao buscar transações:", err)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (user) {
      if (value === "all") {
        fetchTransactions(user.uid)
      } else {
        fetchTransactions(user.uid, value)
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      confirmed: { label: "Confirmado", variant: "success" as const },
      used: { label: "Usado", variant: "default" as const },
      expired: { label: "Expirado", variant: "destructive" as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Meu Cashback" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <div className="container mx-auto max-w-6xl">

      <div className="mb-6">
        <CashbackCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Cashback</CardTitle>
          <CardDescription>
            Acompanhe todas as suas transações de cashback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmados</TabsTrigger>
              <TabsTrigger value="used">Usados</TabsTrigger>
              <TabsTrigger value="expired">Expirados</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma transação encontrada
                  </h3>
                  <p className="text-sm text-gray-500">
                    Suas transações de cashback aparecerão aqui após suas consultas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              +{formatCurrency(transaction.cashbackValue)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              de {formatCurrency(transaction.originalValue)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatarData(transaction.createdAt)}
                          </div>
                          {transaction.expiresAt && (
                            <div className="text-xs text-muted-foreground">
                              Expira em: {formatarData(transaction.expiresAt)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
          </div>
        </main>
      </div>
    </div>
  )
}