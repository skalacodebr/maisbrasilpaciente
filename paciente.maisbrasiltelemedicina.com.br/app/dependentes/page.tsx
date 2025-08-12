"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { Loader2, Plus, UserPlus, Edit, Trash2, User } from "lucide-react"
import { formatarCPF, formatarTelefone, formatarData } from "@/utils/format-utils"
import { DependenteDialog } from "@/components/dialogs/dependente-dialog"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"

interface Dependente {
  id: string
  nome: string
  email: string
  whatsapp: string
  cpf: string
  cep: string
  endereco: string
  estado: string
  cidade: string
  dataCadastro: any
  status?: string
  ativo?: boolean
  auth_disabled?: boolean
}

export default function Dependentes() {
  const router = useRouter()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Estados para diálogos
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [dependenteAtual, setDependenteAtual] = useState<Dependente | null>(null)
  const [excluindo, setExcluindo] = useState(false)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Carregar dependentes do usuário
  const carregarDependentes = async (uid: string) => {
    try {
      setLoading(true)
      console.log(`[DEPENDENTES] Carregando dependentes para o usuário: ${uid}`)

      // Consulta para buscar os registros de dependentes
      const q = query(collection(db, "dependentes"), where("usuario_id", "==", uid))
      const querySnapshot = await getDocs(q)

      const dependentesIds: string[] = []
      querySnapshot.forEach((doc) => {
        dependentesIds.push(doc.data().dependente_id)
      })

      console.log(`[DEPENDENTES] IDs de dependentes encontrados:`, dependentesIds)

      // Se não houver dependentes, retornar lista vazia
      if (dependentesIds.length === 0) {
        console.log(`[DEPENDENTES] Nenhum dependente encontrado`)
        setDependentes([])
        setLoading(false)
        return
      }

      // Buscar os dados completos de cada dependente
      const dependentesData: Dependente[] = []

      for (const dependenteId of dependentesIds) {
        console.log(`[DEPENDENTES] Buscando dados do dependente ID: ${dependenteId}`)
        try {
          const dependenteDoc = await getDoc(doc(db, "usuarios", dependenteId))

          if (dependenteDoc.exists()) {
            const data = dependenteDoc.data()
            console.log(`[DEPENDENTES] Dados do dependente encontrados:`, data)

            // Verificar se o usuário está ativo (não excluído)
            if (data.status !== "excluido" && data.ativo !== false && data.auth_disabled !== true) {
              dependentesData.push({
                id: dependenteDoc.id,
                nome: data.nome,
                email: data.email,
                whatsapp: data.whatsapp,
                cpf: data.cpf,
                cep: data.cep,
                endereco: data.endereco,
                estado: data.estado,
                cidade: data.cidade,
                dataCadastro: data.dataCadastro,
                status: data.status,
                ativo: data.ativo,
              })
            } else {
              console.log(`[DEPENDENTES] Dependente ID ${dependenteId} está marcado como excluído/inativo`)
            }
          } else {
            console.log(`[DEPENDENTES] Documento do dependente ID ${dependenteId} não encontrado`)
          }
        } catch (error) {
          console.error(`[DEPENDENTES] Erro ao buscar dados do dependente ID ${dependenteId}:`, error)
        }
      }

      console.log(`[DEPENDENTES] Total de dependentes ativos encontrados: ${dependentesData.length}`)
      setDependentes(dependentesData)
    } catch (error) {
      console.error("[DEPENDENTES] Erro ao carregar dependentes:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar seus dependentes.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(`[DEPENDENTES] Usuário autenticado: ${user.uid}`)
        setUserId(user.uid)
        await carregarDependentes(user.uid)
      } else {
        console.log(`[DEPENDENTES] Usuário não autenticado, redirecionando para login`)
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Função para abrir o diálogo de edição
  const handleEdit = (dependente: Dependente) => {
    setDependenteAtual(dependente)
    setEditDialogOpen(true)
  }

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDelete = (dependente: Dependente) => {
    setDependenteAtual(dependente)
    setConfirmDialogOpen(true)
  }

  // Função para excluir dependente
  const excluirDependente = async () => {
    if (!userId || !dependenteAtual) return

    try {
      setExcluindo(true)
      console.log(`[DEPENDENTES] Iniciando exclusão do dependente: ${dependenteAtual.id} (${dependenteAtual.nome})`)

      // Chamar a API para excluir o usuário do Firestore e Authentication
      const response = await fetch("/api/dependentes/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dependente_id: dependenteAtual.id,
        }),
      })

      const data = await response.json()
      console.log(`[DEPENDENTES] Resposta da API de exclusão:`, data)

      if (data.success) {
        // Atualizar a lista de dependentes localmente
        setDependentes(dependentes.filter((d) => d.id !== dependenteAtual.id))

        // Mostrar mensagem de sucesso
        let mensagem = "O dependente foi removido com sucesso do sistema."

        // Se houve erro na exclusão do Authentication, adicionar informação
        if (data.authDelete && !data.authDelete.success) {
          console.log(
            `[DEPENDENTES] Aviso: Dependente removido do Firestore, mas houve erro no Authentication:`,
            data.authDelete,
          )
          mensagem +=
            " Nota: Os dados foram removidos, mas houve um problema técnico. Isso não afeta o funcionamento do sistema."
        }

        toast({
          variant: "success",
          title: "Dependente removido",
          description: mensagem,
        })

        setConfirmDialogOpen(false)
        setDependenteAtual(null)
      } else {
        throw new Error(data.error || "Erro ao excluir dependente")
      }
    } catch (error) {
      console.error("[DEPENDENTES] Erro ao excluir dependente:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o dependente. Tente novamente.",
      })
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} />

      <div className="flex-1">
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />

        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Meus Dependentes</h1>
              <p className="text-gray-500">Gerencie os dependentes vinculados ao seu plano</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Dependente
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : dependentes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dependentes.map((dependente) => (
                <Card key={dependente.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-base">{dependente.nome}</h3>
                        <p className="text-xs text-gray-500">{formatarCPF(dependente.cpf)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{dependente.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">WhatsApp:</span>
                        <span>{formatarTelefone(dependente.whatsapp)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cidade/UF:</span>
                        <span>
                          {dependente.cidade}/{dependente.estado}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cadastro:</span>
                        <span>{formatarData(dependente.dataCadastro).split(" ")[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(dependente)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(dependente)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhum dependente encontrado</h3>
              <p className="text-gray-500 mb-4">Você ainda não possui dependentes cadastrados.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Dependente
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Diálogo para adicionar dependente */}
      <DependenteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        onSuccess={() => carregarDependentes(userId || "")}
      />

      {/* Diálogo para editar dependente */}
      {dependenteAtual && (
        <DependenteDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={userId}
          dependente={dependenteAtual}
          onSuccess={() => carregarDependentes(userId || "")}
        />
      )}

      {/* Diálogo de confirmação para excluir */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="Excluir Dependente"
        description={`Tem certeza que deseja excluir o dependente ${dependenteAtual?.nome}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={excluirDependente}
        loading={excluindo}
        variant="destructive"
      />

      <Toaster />
    </div>
  )
}
