"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, app as firebaseApp } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function Login() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1) Autentica no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, senha)
      const uid = userCredential.user.uid

      // 2) Busca dados do usuário no Firestore
      const db = getFirestore(firebaseApp)
      const userRef = doc(db, "usuarios", uid)
      const userSnap = await getDoc(userRef)
      if (!userSnap.exists()) {
        throw new Error("Usuário não encontrado no Firestore")
      }

      // 3) sucesso
      toast({
        variant: "success",
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      })
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Erro no login:", error)
      let mensagemErro = "Ocorreu um erro ao fazer login. Verifique suas credenciais."
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        mensagemErro = "E-mail ou senha incorretos."
      } else if (error.message) {
        mensagemErro = error.message
      }
      toast({ variant: "destructive", title: "Erro no login", description: mensagemErro })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-2 text-center">
          <div className="relative h-16 w-48 mb-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MaisBrasil-yy7n1soG44eoDE13iDtGslZRRiOTtI.png"
              alt="Mais Brasil Telemedicina"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais para acessar o sistema. A senha padrão são
            os últimos 6 dígitos do CPF.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* email e senha */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email" type="email" placeholder="Digite seu email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium">Senha</label>
              <Input
                id="senha" type="password" placeholder="Digite sua senha"
                value={senha} onChange={(e) => setSenha(e.target.value)}
                required disabled={loading} maxLength={6}
              />
            </div>

            <Button
              type="submit" className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-primary hover:underline">
              Não tem conta? Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
