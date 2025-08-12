"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Loader2, MapPin, Phone, Calendar, CreditCard, Building, Edit, X, Check } from "lucide-react"
import { InputMask } from "@/components/input-mask"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { formatarCPF, formatarTelefone, formatarData } from "@/utils/format-utils"
import { EmailDialog } from "@/components/dialogs/email-dialog"
import { CartaoVirtual } from "@/components/profile/cartao-virtual"
import { CredenciaisCard } from "@/components/profile/credenciais-card"

interface UserData {
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

const estados = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]

export default function Perfil() {
  const router = useRouter()
  const { toast } = useToast()
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Estados para edição
  const [editMode, setEditMode] = useState<"info" | "endereco" | null>(null)
  const [formData, setFormData] = useState<Partial<UserData>>({})

  // Estados para diálogos
  const [emailDialog, setEmailDialog] = useState(false)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoading(true)
          setUserId(user.uid)
          const userDoc = await getDoc(doc(db, "usuarios", user.uid))

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData
            setUserData(data)
            setFormData(data)
          } else {
            console.error("Documento do usuário não encontrado")
            router.push("/login")
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
        } finally {
          setLoading(false)
        }
      } else {
        router.push("/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Função para buscar endereço pelo CEP
  const buscarCep = async (cep: string) => {
    if (cep.replace(/[^0-9]/g, "").length !== 8) return

    try {
      const cepLimpo = cep.replace(/[^0-9]/g, "")
      const response = await fetch(`/api/cep?cep=${cepLimpo}`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          endereco: `${data.logradouro}, ${data.bairro}`,
          estado: data.uf,
          cidade: data.localidade,
        }))
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  // Função para iniciar edição
  const handleEdit = (section: "info" | "endereco") => {
    setEditMode(section)
    setFormData(userData || {})
  }

  // Função para cancelar edição
  const handleCancel = () => {
    setEditMode(null)
    setFormData(userData || {})
  }

  // Função para atualizar campo do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Função para salvar alterações
  const handleSave = async () => {
    if (!userId || !userData) return

    setSaving(true)
    try {
      // Preparar dados para atualização
      const updateData: Partial<UserData> = {}

      if (editMode === "info") {
        updateData.nome = formData.nome || userData.nome
        updateData.whatsapp = (formData.whatsapp || userData.whatsapp).replace(/\D/g, "")
      } else if (editMode === "endereco") {
        updateData.cep = (formData.cep || userData.cep).replace(/\D/g, "")
        updateData.endereco = formData.endereco || userData.endereco
        updateData.cidade = formData.cidade || userData.cidade
        updateData.estado = formData.estado || userData.estado
      }

      // Atualizar no Firestore
      await updateDoc(doc(db, "usuarios", userId), updateData)

      // Atualizar estado local
      setUserData((prev) => (prev ? { ...prev, ...updateData } : null))

      toast({
        variant: "success",
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      })

      setEditMode(null)
    } catch (error) {
      console.error("Erro ao atualizar dados:", error)
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar suas informações. Tente novamente.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Função para atualizar email no estado local
  const handleEmailUpdated = (newEmail: string) => {
    setUserData((prev) => (prev ? { ...prev, email: newEmail } : null))
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} />

      <div className="flex-1">
        <Header collapsed={collapsed} toggleSidebar={toggleSidebar} />

        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Perfil do Paciente</h1>
            <p className="text-gray-500">Visualize e gerencie suas informações pessoais</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
          ) : userData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cartão do Paciente */}
              <Card className="md:col-span-1 bg-white shadow-md">
                <CardHeader className="pb-0 flex flex-row items-start justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold">Informações Pessoais</h2>
                  </div>
                  {editMode !== "info" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit("info")}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-700"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center mb-6">
                    <Avatar className="h-24 w-24 mb-4">
                    <AvatarFallback className="text-2xl bg-green-100 text-green-600">
                      {(userData?.nome ?? "?").charAt(0)}
                    </AvatarFallback>
                    </Avatar>
                    {editMode === "info" ? (
                      <Input
                        name="nome"
                        value={formData.nome || ""}
                        onChange={handleChange}
                        className="text-center font-bold"
                        disabled={saving}
                      />
                    ) : (
                      <h2 className="text-xl font-bold text-center">{userData.nome}</h2>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
    {(userData?.tipo ?? "")
      .charAt(0)
      .toUpperCase() + (userData?.tipo ?? "").slice(1)}
  </span>
</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">CPF</p>
                        <p className="text-sm text-gray-500">{formatarCPF(userData.cpf)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-gray-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">WhatsApp</p>
                        {editMode === "info" ? (
                          <InputMask
                            mask="(00) 00000-0000"
                            name="whatsapp"
                            value={formData.whatsapp || ""}
                            onChange={handleChange}
                            className="h-8 text-sm"
                            disabled={saving}
                          />
                        ) : (
                          <p className="text-sm text-gray-500">{formatarTelefone(userData.whatsapp)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Data de Cadastro</p>
                        <p className="text-sm text-gray-500">{formatarData(userData.dataCadastro)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Endereço */}
              <Card className="md:col-span-2 bg-white shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold">Informações de Endereço</h2>
                  </div>
                  {editMode !== "endereco" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit("endereco")}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className="text-green-600 hover:text-green-700"
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {editMode === "endereco" ? (
                        <div className="space-y-2">
                          <label htmlFor="cep" className="text-sm font-medium">
                            CEP
                          </label>
                          <InputMask
                            id="cep"
                            mask="00000-000"
                            name="cep"
                            value={formData.cep || ""}
                            onChange={(e) => {
                              handleChange(e)
                              if (e.target.value.replace(/[^0-9]/g, "").length === 8) {
                                buscarCep(e.target.value)
                              }
                            }}
                            className="h-8 text-sm"
                            disabled={saving}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-3 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">CEP</p>
                            <p className="text-sm text-gray-500">
                              <InputMask
                                mask="00000-000"
                                value={userData.cep}
                                readOnly
                                className="bg-transparent border-none p-0 text-gray-500 text-sm"
                              />
                            </p>
                          </div>
                        </div>
                      )}

                      {editMode === "endereco" ? (
                        <div className="space-y-2">
                          <label htmlFor="endereco" className="text-sm font-medium">
                            Endereço Completo
                          </label>
                          <Input
                            id="endereco"
                            name="endereco"
                            value={formData.endereco || ""}
                            onChange={handleChange}
                            className="h-8 text-sm"
                            disabled={saving}
                          />
                        </div>
                      ) : (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Endereço Completo</p>
                            <p className="text-sm text-gray-500">{userData.endereco}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {editMode === "endereco" ? (
                        <>
                          <div className="space-y-2">
                            <label htmlFor="cidade" className="text-sm font-medium">
                              Cidade
                            </label>
                            <Input
                              id="cidade"
                              name="cidade"
                              value={formData.cidade || ""}
                              onChange={handleChange}
                              className="h-8 text-sm"
                              disabled={saving}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="estado" className="text-sm font-medium">
                              Estado
                            </label>
                            <Select
                              value={formData.estado || ""}
                              onValueChange={(value) => setFormData((prev) => ({ ...prev, estado: value }))}
                              disabled={saving}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {estados.map((uf) => (
                                  <SelectItem key={uf} value={uf}>
                                    {uf}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <Building className="h-5 w-5 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Cidade</p>
                              <p className="text-sm text-gray-500">{userData.cidade}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Building className="h-5 w-5 mr-3 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Estado</p>
                              <p className="text-sm text-gray-500">{userData.estado}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credenciais */}
              <CredenciaisCard email={userData.email} onChangeEmail={() => setEmailDialog(true)} />

              {/* Cartão Virtual */}
              <CartaoVirtual nome={userData.nome} cpf={userData.cpf} dataCadastro={userData.dataCadastro} />
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">Nenhuma informação de usuário encontrada.</p>
            </div>
          )}
        </main>
      </div>

      {/* Diálogos */}

      <EmailDialog
        open={emailDialog}
        onOpenChange={setEmailDialog}
        currentEmail={userData?.email || ""}
        userId={userId}
        onEmailUpdated={handleEmailUpdated}
      />

      <Toaster />
    </div>
  )
}
