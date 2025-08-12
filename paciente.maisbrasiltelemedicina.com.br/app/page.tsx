"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"

interface Programa {
  id: string
  nome: string
  descricao: string[]
  valor: number
  recorrencia: string
  status: string
  quantidadeUsuarios: number
  dataUltimaAtualizacao: any
}

export default function Home() {
  const router = useRouter()
  const [programas, setProgramas] = useState<Programa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregarProgramas = async () => {
      try {
        setLoading(true)
        // Buscar apenas programas ativos
        const q = query(collection(db, "programas"), where("status", "==", "ativo"))
        const querySnapshot = await getDocs(q)

        const programasData: Programa[] = []
        querySnapshot.forEach((doc) => {
          programasData.push({
            id: doc.id,
            ...(doc.data() as Omit<Programa, "id">),
          })
        })

        setProgramas(programasData)
      } catch (error) {
        console.error("Erro ao carregar programas:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarProgramas()
  }, [])

  const formatarValor = (valor: number) => {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="relative h-12 w-40">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MaisBrasil-yy7n1soG44eoDE13iDtGslZRRiOTtI.png"
              alt="Mais Brasil Telemedicina"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <Link href="/login">
            <Button className="bg-green-600 hover:bg-green-700">Entrar</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Programas de Telemedicina</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conheça nossos programas de telemedicina e escolha o que melhor atende às suas necessidades. Atendimento
            médico de qualidade sem sair de casa.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programas.map((programa) => (
              <Card key={programa.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{programa.nome}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">
                      {programa.recorrencia === "mensal" ? "Mensal" : programa.recorrencia}
                    </Badge>
                  </div>
                  <CardDescription>
                    {formatarValor(programa.valor)} / {programa.recorrencia === "mensal" ? "mês" : programa.recorrencia}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {programa.descricao &&
                      programa.descricao.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-600 mr-2">•</span>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                  </ul>
                </CardContent>
                <CardFooter>
                <Link
                  href={{
                    pathname: '/cadastro',
                    query: {
                      planId: programa.id,
                      valor: programa.valor
                    }
                  }}
                  className="w-full"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Cadastrar-se
                  </Button>
                </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2025 MaisBrasil Telemedicina. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
