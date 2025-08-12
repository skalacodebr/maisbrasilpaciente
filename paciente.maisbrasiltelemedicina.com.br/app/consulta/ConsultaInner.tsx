'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Brain, Apple, Loader2, AlertCircle, ArrowRight } from "lucide-react"

// UUIDs das especialidades do .env
const GENERAL_UUID = process.env.NEXT_PUBLIC_RAPIDOC_GENERAL_SPECIALTY_UUID!
const PSYCHOLOGY_UUID = process.env.NEXT_PUBLIC_RAPIDOC_PSYCHOLOGY_SPECIALTY_UUID!
const NUTRITION_UUID = process.env.NEXT_PUBLIC_RAPIDOC_NUTRITION_SPECIALTY_UUID!

// Plano Map para serviço (mesmo do dashboard)
const planoMap: Record<string, string> = {
  clinico:       "G",
  psicologia:    "P",
  GP:            "GP",
  GS:            "GS",
  GSP:           "GSP",
  nutricionista: "GS",
}

const allSpecialties = [
  {
    id: 'general',
    name: 'Clínica Geral',
    description: 'Consultas médicas gerais para cuidados de rotina e problemas de saúde comuns',
    icon: Stethoscope,
    uuid: GENERAL_UUID,
    color: 'blue'
  },
  {
    id: 'psychology',
    name: 'Psicologia',
    description: 'Acompanhamento psicológico e suporte emocional com profissionais qualificados',
    icon: Brain,
    uuid: PSYCHOLOGY_UUID,
    color: 'purple'
  },
  {
    id: 'nutrition',
    name: 'Nutrição',
    description: 'Orientação nutricional personalizada para uma vida mais saudável',
    icon: Apple,
    uuid: NUTRITION_UUID,
    color: 'green'
  }
]

export default function ConsultaPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [beneficiaryUuid, setBeneficiaryUuid] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [startingConsultation, setStartingConsultation] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [allowedSpecialties, setAllowedSpecialties] = useState<typeof allSpecialties>([])
  const [programaId, setProgramaId] = useState<string>('')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user)
        // Buscar beneficiaryUuid do usuário e programa
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setBeneficiaryUuid(userData.beneficiaryUuid || '')
            
            // Verificar se tem pagamento aprovado
            if (userData.subscriptionStatus !== 'paid') {
              router.push('/pending-payment')
              return
            }
          }

          // Buscar programa do usuário
          const programDoc = await getDoc(doc(db, 'usuarios_programas', user.uid))
          if (programDoc.exists()) {
            const programData = programDoc.data()
            const userProgramaId = programData.programa_id || ''
            setProgramaId(userProgramaId)
            
            // Filtrar especialidades baseado no programa
            const serviceType = planoMap[userProgramaId] || 'G' // Default clínico
            const filtered = []
            
            // Lógica de filtragem igual ao dashboard
            if (serviceType === 'G' || serviceType === 'GS') {
              filtered.push(allSpecialties.find(s => s.id === 'general')!)
            }
            
            if (serviceType === 'P') {
              filtered.push(allSpecialties.find(s => s.id === 'psychology')!)
            }
            
            if (serviceType === 'GS' || serviceType === 'GSP') {
              const nutrition = allSpecialties.find(s => s.id === 'nutrition')
              if (nutrition) filtered.push(nutrition)
            }
            
            setAllowedSpecialties(filtered.filter(Boolean))
          } else {
            // Se não tem programa, redireciona
            router.push('/pending-payment')
            return
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error)
        }
      } else {
        router.push('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Se já tiver parâmetros na URL, iniciar consulta diretamente
  useEffect(() => {
    const bUuid = params.get('beneficiaryUuid')
    const sUuid = params.get('specialtyUuid')
    
    if (bUuid && sUuid) {
      setStartingConsultation(true)
      fetch('/api/telemedicina/consulta-imediata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryUuid: bUuid, specialtyUuid: sUuid }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.url) {
            // Redireciona para a URL da consulta
            window.location.href = data.url
          } else if (data.pending) {
            setHtmlContent('<p style="color:blue">Aguardando médico disponível...</p>')
          } else {
            setHtmlContent(`<p style="color:red">${data.message || 'Erro desconhecido'}</p>`)
          }
        })
        .catch(() => {
          setHtmlContent('<p style="color:red">Erro interno ao iniciar consulta</p>')
        })
    }
  }, [params])

  const startConsultation = async (specialtyUuid: string) => {
    if (!beneficiaryUuid) {
      alert('Erro: UUID do beneficiário não encontrado')
      return
    }

    setSelectedSpecialty(specialtyUuid)
    setStartingConsultation(true)

    try {
      const response = await fetch('/api/telemedicina/consulta-imediata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beneficiaryUuid, specialtyUuid }),
      })

      const data = await response.json()
      
      if (data.url) {
        // Redireciona para a URL da consulta
        window.location.href = data.url
      } else if (data.pending) {
        setHtmlContent('<p style="color:blue">Aguardando médico disponível...</p>')
      } else {
        setHtmlContent(`<p style="color:red">${data.message || 'Erro desconhecido'}</p>`)
      }
    } catch (error) {
      console.error('Erro ao iniciar consulta:', error)
      setHtmlContent('<p style="color:red">Erro interno ao iniciar consulta</p>')
    } finally {
      setStartingConsultation(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Se já tem HTML content (consulta iniciada), mostrar mensagem
  if (htmlContent) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Consulta em Andamento" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <div className="container mx-auto max-w-2xl">
              <Card>
                <CardContent className="p-8 text-center">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Página de seleção de especialidade
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Nova Consulta" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Escolha a Especialidade</h2>
              <p className="text-gray-600">
                Selecione o tipo de atendimento que você precisa
              </p>
            </div>

            {!beneficiaryUuid && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Seu cadastro está incompleto. Por favor, complete seu perfil antes de iniciar uma consulta.
                  </p>
                </div>
              </div>
            )}

            {allowedSpecialties.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allowedSpecialties.map((specialty) => {
                  const Icon = specialty.icon
                  const isLoading = startingConsultation && selectedSpecialty === specialty.uuid
                  
                  return (
                    <Card 
                      key={specialty.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        isLoading ? 'opacity-50' : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-3 rounded-lg bg-${specialty.color}-100`}>
                            <Icon className={`h-6 w-6 text-${specialty.color}-600`} />
                          </div>
                          <Badge variant="secondary">Disponível</Badge>
                        </div>
                        <CardTitle>{specialty.name}</CardTitle>
                        <CardDescription>{specialty.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full"
                          onClick={() => startConsultation(specialty.uuid)}
                          disabled={!beneficiaryUuid || startingConsultation}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Iniciando...
                            </>
                          ) : (
                            <>
                              Iniciar Consulta
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Nenhuma especialidade disponível
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Seu plano atual ({programaId}) não inclui acesso a consultas imediatas.
                    Entre em contato para mais informações sobre upgrade de plano.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Como funciona?</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Escolha a especialidade desejada</li>
                <li>2. Aguarde a conexão com um profissional disponível</li>
                <li>3. Realize sua consulta por videochamada</li>
                <li>4. Receba orientações e prescrições quando necessário</li>
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
