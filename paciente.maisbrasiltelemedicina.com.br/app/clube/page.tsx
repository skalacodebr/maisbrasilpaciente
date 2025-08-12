"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Crown } from "lucide-react"
import { ClubDashboard } from "@/components/club/club-dashboard"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"

export default function ClubePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("/login")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Clube de Benefícios" />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Clube VIP!</h2>
              <p className="opacity-90">
                Aproveite cashback exclusivo, descontos em parceiros, pontos por atividade e muito mais. 
                Quanto mais você usa, maiores são os benefícios!
              </p>
            </div>

            <ClubDashboard />
          </div>
        </main>
      </div>
    </div>
  )
}