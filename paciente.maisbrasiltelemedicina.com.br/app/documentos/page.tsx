"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Loader2, File, FileText, Image, Plus, Download, Eye } from "lucide-react"
import { formatarData } from "@/utils/format-utils"
import { DocumentoDialog } from "@/components/dialogs/documento-dialog"

interface Documento {
  id: string
  titulo: string
  tipo: string
  url: string
  caminho_storage?: string
  nome_arquivo?: string
  created_at: any
}

export default function Documentos() {
  const router = useRouter()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Carregar documentos do usuário
  const carregarDocumentos = async (uid: string) => {
    try {
      setLoading(true)

      // Consulta sem ordenação para evitar necessidade de índice composto
      const q = query(collection(db, "documentos"), where("usuario_id", "==", uid))

      const querySnapshot = await getDocs(q)

      const docs: Documento[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        docs.push({
          id: doc.id,
          titulo: data.titulo,
          tipo: data.tipo,
          url: data.url,
          caminho_storage: data.caminho_storage,
          nome_arquivo: data.nome_arquivo,
          created_at: data.created_at,
        })
      })

      // Ordenar manualmente por data de criação (mais recentes primeiro)
      docs.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(a.created_at || 0)
        const dateB = b.created_at?.toDate?.() || new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })

      setDocumentos(docs)
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar seus documentos.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        await carregarDocumentos(user.uid)
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Função para salvar novo documento usando API Route
  const salvarDocumento = async (titulo: string, arquivo: File) => {
    if (!userId) return false

    try {
      console.log("Iniciando upload do arquivo:", arquivo.name)
      console.log("Iniciando upload do documento:", titulo)

      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      formData.append("titulo", titulo)
      formData.append("userId", userId)

      // Enviar para a API Route
      const response = await fetch("/api/documentos/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erro na API:", errorData)
        throw new Error(errorData.details || "Erro ao fazer upload do documento")
      }

      const data = await response.json()
      console.log("Documento salvo com sucesso:", data)

      // Recarregar documentos
      await carregarDocumentos(userId)

      return true
    } catch (error: any) {
      console.error("Erro ao salvar documento:", error)
      return false
    }
  }

  // Função para obter ícone baseado no tipo de documento
  const getIconeDocumento = (tipo: string) => {
    switch (tipo) {
      case "pdf":
        return <File className="h-10 w-10 text-red-500" />
      case "doc":
        return <FileText className="h-10 w-10 text-blue-500" />
      case "imagem":
        return <Image className="h-10 w-10 text-green-500" />
      default:
        return <File className="h-10 w-10 text-gray-500" />
    }
  }

  // Função para baixar documento
  const baixarDocumento = async (documento: Documento) => {
    try {
      setDownloadLoading(documento.id)

      // Usar a URL armazenada diretamente
      const url = documento.url

      // Criar um elemento de link temporário para download
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", documento.titulo || documento.nome_arquivo || "documento")
      link.setAttribute("target", "_blank")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        variant: "success",
        title: "Download iniciado",
        description: "O download do documento foi iniciado.",
      })
    } catch (error: any) {
      console.error("Erro ao baixar documento:", error)

      toast({
        variant: "destructive",
        title: "Erro ao baixar",
        description: "Não foi possível baixar o documento. Tente novamente mais tarde.",
      })
    } finally {
      setDownloadLoading(null)
    }
  }

  // Função para visualizar documento
  const visualizarDocumento = (documento: Documento) => {
    // Abrir a URL em uma nova aba
    window.open(documento.url, "_blank")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} />

      <div className="flex-1">
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />

        <main className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Meus Documentos</h1>
              <p className="text-gray-500">Gerencie seus documentos e arquivos</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : documentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documentos.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center">
                      {getIconeDocumento(doc.tipo)}
                      <div className="ml-3">
                        <h3 className="font-medium text-base">{doc.titulo}</h3>
                        <p className="text-xs text-gray-500">{formatarData(doc.created_at)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-end space-x-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => visualizarDocumento(doc)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => baixarDocumento(doc)}
                        disabled={downloadLoading === doc.id}
                      >
                        {downloadLoading === doc.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-8 text-center">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
              <p className="text-gray-500 mb-4">Você ainda não possui documentos cadastrados.</p>
              <Button onClick={() => setDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>
          )}
        </main>
      </div>

      <DocumentoDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={salvarDocumento} />

      <Toaster />
    </div>
  )
}
