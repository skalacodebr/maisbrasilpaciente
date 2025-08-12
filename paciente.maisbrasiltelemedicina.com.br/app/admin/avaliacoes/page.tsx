"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore"
import { Loader2, Star } from "lucide-react"
import { formatarData } from "@/utils/format-utils"

interface Avaliacao {
  id: string
  usuario_id: string
  medico_id: string | number
  consulta_id: string
  nota: number
  created_at: any
  updated_at: any
}

interface Usuario {
  nome: string
  email: string
}

export default function Avaliacoes() {
  const router = useRouter()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [usuarios, setUsuarios] = useState<Record<string, Usuario>>({})

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Carregar avaliações
  const carregarAvaliacoes = async () => {
    try {
      setLoading(true)

      // Consulta ao Firestore para buscar avaliações
      const q = query(collection(db, "avaliacao"), orderBy("created_at", "desc"))
      const querySnapshot = await getDocs(q)

      const avaliacoesData: Avaliacao[] = []
      querySnapshot.forEach((doc) => {
        avaliacoesData.push({
          id: doc.id,
          ...(doc.data() as Omit<Avaliacao, "id">),
        })
      })

      setAvaliacoes(avaliacoesData)

      // Carregar informações dos usuários
      const usuariosMap: Record<string, Usuario> = {}

      for (const avaliacao of avaliacoesData) {
        if (!usuariosMap[avaliacao.usuario_id]) {
          try {
            const userDoc = await getDoc(doc(db, "usuarios", avaliacao.usuario_id))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              usuariosMap[avaliacao.usuario_id] = {
                nome: userData.nome,
                email: userData.email,
              }
            }
          } catch (error) {
            console.error(`Erro ao carregar usuário ${avaliacao.usuario_id}:`, error)
          }
        }
      }

      setUsuarios(usuariosMap)
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as avaliações.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verificar se o usuário é administrador (em um sistema real, você verificaria isso no Firestore)
        await carregarAvaliacoes()
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Renderizar estrelas para a nota
  const renderEstrelas = (nota: number) => {
    return (
      <div className="flex items-center">
        {[...Array(10)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < nota ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
        ))}
        <span className="ml-2 font-medium">{nota}/10</span>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} />

      <div className="flex-1">
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Avaliações de Consultas</h1>
            <p className="text-gray-500">Visualize todas as avaliações de consultas realizadas pelos pacientes</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : avaliacoes.length > 0 ? (
            <div className="space-y-4">
              {avaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <h3 className="font-medium">
                          Paciente: {usuarios[avaliacao.usuario_id]?.nome || "Usuário não encontrado"}
                        </h3>
                        <p className="text-sm text-gray-500">Médico: Dr. {avaliacao.medico_id}</p>
                        <p className="text-sm text-gray-500">Data: {formatarData(avaliacao.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm font-medium mb-1">Avaliação:</p>
                        {renderEstrelas(avaliacao.nota)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-gray-500 mb-4">Ainda não há avaliações registradas no sistema.</p>
            </div>
          )}
        </main>
      </div>

      <Toaster />
    </div>
  )
}
