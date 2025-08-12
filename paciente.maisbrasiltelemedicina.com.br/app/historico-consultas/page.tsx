"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Loader2, Calendar, Clock, Star, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatarData } from "@/utils/format-utils"
import { AvaliarConsultaDialog } from "@/components/dialogs/avaliar-consulta-dialog"
import { EnviarExameDialog } from "@/components/dialogs/enviar-exame-dialog"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"

interface Consulta {
  id: string
  tipo: string // especialidade do médico
  medico_id: number
  data_consulta: any
  hora: any
  status: string
  created_at: any
  usuario_id: string
  // campos opcionais que podem não existir em todas as consultas
  observacoes?: string
  receita?: boolean
  atestado?: boolean
  // Adicionando campo para armazenar a avaliação
  avaliacao?: {
    nota: number
    id: string
  }
}

interface Usuario {
  nome: string
  email: string
  whatsapp: string
  cpf: string
  cep: string
  endereco: string
  estado: string
  cidade: string
  dataCadastro: any
  tipo: string
}

export default function HistoricoConsultas() {
  const router = useRouter()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userData, setUserData] = useState<Usuario | null>(null)

  // Estados para filtros
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>("")
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos")
  const [filtroBusca, setFiltroBusca] = useState<string>("")

  // Estados para diálogos
  const [avaliarDialogOpen, setAvaliarDialogOpen] = useState(false)
  const [enviarExameDialogOpen, setEnviarExameDialogOpen] = useState(false)
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null)

  // Lista de especialidades para o filtro
  const especialidades = [
    "Todas",
    "Clínico Geral",
    "Cardiologia",
    "Dermatologia",
    "Neurologia",
    "Ortopedia",
    "Pediatria",
    "Psiquiatria",
  ]

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Carregar dados do usuário
  const carregarDadosUsuario = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid))
      if (userDoc.exists()) {
        setUserData(userDoc.data() as Usuario)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error)
    }
  }

  // Buscar avaliações para as consultas
  const buscarAvaliacoes = async (consultasData: Consulta[], uid: string) => {
    try {
      // Buscar todas as avaliações do usuário
      const q = query(collection(db, "avaliacao"), where("usuario_id", "==", uid))
      const avaliacoesSnapshot = await getDocs(q)

      // Criar um mapa de consulta_id -> avaliação
      const avaliacoesMap: Record<string, { nota: number; id: string }> = {}

      avaliacoesSnapshot.forEach((doc) => {
        const data = doc.data()
        avaliacoesMap[data.consulta_id] = {
          nota: data.nota,
          id: doc.id,
        }
      })

      // Adicionar as avaliações às consultas
      return consultasData.map((consulta) => {
        if (avaliacoesMap[consulta.id]) {
          return {
            ...consulta,
            avaliacao: avaliacoesMap[consulta.id],
          }
        }
        return consulta
      })
    } catch (error) {
      console.error("Erro ao buscar avaliações:", error)
      return consultasData
    }
  }

  // Carregar histórico de consultas do usuário
  // ---- NOVA VERSÃO ----
const carregarConsultas = async (uid: string) => {
  try {
    setLoading(true)

    // 1) pega o beneficiaryUuid do usuário
    const snap = await getDoc(doc(db, "usuarios", uid))
    const beneficiaryUuid = snap.data()?.beneficiaryUuid
    if (!beneficiaryUuid) {
      throw new Error("beneficiaryUuid não encontrado")
    }

    // 2) chama o endpoint interno
    const resp = await fetch(
      `/api/telemedicina/appointments/list?beneficiaryUuid=${beneficiaryUuid}`
    )
    if (!resp.ok) throw new Error("Falha ao buscar consultas")

    const dados = await resp.json() // array Rapidoc
    /* 3) converte para o formato <Consulta> */
    const consultasData: Consulta[] = dados.map((c: any) => ({
      id: c.id,
      tipo: c.specialty?.name ?? "Especialidade",
      medico_id: c.doctor?.name ?? "Médico",
      data_consulta: new Date(c.date),
      hora: c.time ?? "",
      status: c.status === "finished" ? "realizada" : c.status,
      created_at: c.createdAt ?? c.date,
      usuario_id: uid,
      observacoes: c.notes ?? "",
      receita: !!c.prescriptionUuid,
      atestado: !!c.reportUuid,
    }))

    // 4) adiciona avaliações
    const consultasComAval = await buscarAvaliacoes(consultasData, uid)
    setConsultas(consultasComAval)
  } catch (e: any) {
    console.error(e)
    toast({
      variant: "destructive",
      title: "Erro",
      description: e.message || "Não foi possível carregar consultas.",
    })
  } finally {
    setLoading(false)
  }
}


  // Verificar se a consulta já foi avaliada
  const verificarConsultaAvaliada = async (consultaId: string, usuarioId: string) => {
    try {
      const q = query(
        collection(db, "avaliacao"),
        where("consulta_id", "==", consultaId),
        where("usuario_id", "==", usuarioId),
      )

      const snapshot = await getDocs(q)
      return !snapshot.empty
    } catch (error) {
      console.error("Erro ao verificar avaliação:", error)
      return false
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        await Promise.all([carregarConsultas(user.uid), carregarDadosUsuario(user.uid)])
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Atualizar a lista de consultas após uma avaliação
  const atualizarAposAvaliacao = async (consultaId: string, nota: number, avaliacaoId: string) => {
    setConsultas((prevConsultas) =>
      prevConsultas.map((consulta) =>
        consulta.id === consultaId ? { ...consulta, avaliacao: { nota, id: avaliacaoId } } : consulta,
      ),
    )
  }

  // Filtrar consultas com base nos filtros selecionados
  const consultasFiltradas = consultas.filter((consulta) => {
    // Filtro de especialidade
    if (filtroEspecialidade && filtroEspecialidade !== "Todas" && consulta.tipo !== filtroEspecialidade) {
      return false
    }

    // Filtro de período
    if (filtroPeriodo !== "todos") {
      const hoje = new Date()
      const dataConsulta = new Date(consulta.data_consulta.toDate())

      if (
        filtroPeriodo === "mes" &&
        (dataConsulta.getMonth() !== hoje.getMonth() || dataConsulta.getFullYear() !== hoje.getFullYear())
      ) {
        return false
      }

      if (filtroPeriodo === "trimestre") {
        const tresMesesAtras = new Date()
        tresMesesAtras.setMonth(hoje.getMonth() - 3)
        if (dataConsulta < tresMesesAtras) {
          return false
        }
      }
    }

    // Filtro de busca (médico ou observações)
    if (filtroBusca) {
      const termoBusca = filtroBusca.toLowerCase()
      // Como não temos o nome do médico diretamente, vamos buscar apenas nas observações
      return consulta.observacoes?.toLowerCase().includes(termoBusca) || false
    }

    return true
  })

  // Função que devolve classes Tailwind conforme o status
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    /* concluída */
    case "finished":
    case "realizada":
    case "concluida":
      return "bg-green-100 text-green-800"

    /* agendada para data futura */
    case "confirmed":
    case "agendada":
      return "bg-blue-100 text-blue-800"

    /* consulta prestes a começar (em breve) */
    case "soon":
    case "em_breve":
      return "bg-yellow-100 text-yellow-800"

    /* cancelada */
    case "cancelled":
    case "cancelada":
      return "bg-red-100 text-red-800"

    /* fallback */
    default:
      return "bg-gray-100 text-gray-800"
  }
}


  // Função para formatar o status para exibição
  const formatarStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "realizada":
      case "concluida":
        return "Concluída"
      case "agendada":
        return "Agendada"
      case "cancelada":
        return "Cancelada"
      default:
        return status
    }
  }

  // Função para formatar data do Firestore
  const formatarDataFirestore = (timestamp: any) => {
    if (!timestamp) return "Data não disponível"

    try {
      // Verificar se é um timestamp do Firestore
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return formatarData(data)
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data inválida"
    }
  }

  // Função para abrir o diálogo de avaliação
  const abrirDialogoAvaliacao = async (consulta: Consulta) => {
    if (!userId) return

    // Se a consulta já tem avaliação, mostrar mensagem
    if (consulta.avaliacao) {
      toast({
        variant: "info",
        title: "Consulta já avaliada",
        description: `Você já avaliou esta consulta com nota ${consulta.avaliacao.nota}.`,
      })
      return
    }

    setConsultaSelecionada(consulta)
    setAvaliarDialogOpen(true)
  }

  // Renderizar estrelas para a nota
  const renderEstrelas = (nota: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < Math.round(nota / 2) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{nota}/10</span>
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
            <h1 className="text-2xl font-bold mb-1">Histórico de Consultas</h1>
            <p className="text-gray-500">Visualize todas as suas consultas realizadas e agendadas</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : consultasFiltradas.length > 0 ? (
            <div className="space-y-4">
              {consultasFiltradas.map((consulta) => (
                <Card key={consulta.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-l-4 border-l-green-500">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 hidden sm:flex">
                            <AvatarFallback>{consulta.medico_id}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{consulta.tipo}</h3>
                              <Badge className={getStatusColor(consulta.status)}>
                                {formatarStatus(consulta.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Médico: Dr. {consulta.medico_id} - {consulta.tipo}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatarDataFirestore(consulta.data_consulta).split(" ")[0]}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatarDataFirestore(consulta.hora).split(" ")[1]}
                              </div>
                            </div>

                            {/* Mostrar avaliação se existir */}
                            {consulta.avaliacao && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Sua avaliação:</p>
                                {renderEstrelas(consulta.avaliacao.nota)}
                              </div>
                            )}
                          </div>
                        </div>

                        {consulta.status.toLowerCase() === "realizada" && (
                          <div className="flex flex-wrap gap-2">
                            {!consulta.avaliacao ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirDialogoAvaliacao(consulta)}
                                className="flex items-center"
                              >
                                <Star className="h-4 w-4 mr-1" />
                                Avaliar
                              </Button>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Avaliada</Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConsultaSelecionada(consulta)
                                setEnviarExameDialogOpen(true)
                              }}
                              className="flex items-center"
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Enviar Exame
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhuma consulta encontrada</h3>
              <p className="text-gray-500 mb-4">
                {filtroBusca || filtroEspecialidade || filtroPeriodo !== "todos"
                  ? "Nenhuma consulta corresponde aos filtros selecionados."
                  : "Você ainda não possui consultas registradas."}
              </p>
              {(filtroBusca || filtroEspecialidade || filtroPeriodo !== "todos") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiltroBusca("")
                    setFiltroEspecialidade("")
                    setFiltroPeriodo("todos")
                  }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Diálogos */}
      {consultaSelecionada && userData && userId && (
        <>
          <AvaliarConsultaDialog
            open={avaliarDialogOpen}
            onOpenChange={setAvaliarDialogOpen}
            consultaId={consultaSelecionada.id}
            medicoId={consultaSelecionada.medico_id}
            usuarioId={userId}
            onAvaliacaoSalva={atualizarAposAvaliacao}
          />
          <EnviarExameDialog
            open={enviarExameDialogOpen}
            onOpenChange={setEnviarExameDialogOpen}
            consultaId={consultaSelecionada.id}
            medicoId={consultaSelecionada.medico_id}
            pacienteNome={userData.nome}
            pacienteId={userId}
          />
        </>
      )}

      <Toaster />
    </div>
  )
}
