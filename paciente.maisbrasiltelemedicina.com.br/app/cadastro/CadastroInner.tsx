// app/cadastro/page.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { InputMask } from "@/components/input-mask"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]

// Mapeia o planId para serviceType
const planoMap: Record<string, string> = {
  clinico:       "G",
  psicologia:    "P",
  GS:            "GS",
  nutricionista: "GS",
}

export default function Cadastro() {
  const router        = useRouter()
  const params        = useSearchParams()
  const { toast }     = useToast()

  // query params
  const planIdParam     = params.get("planId")         || ""
  const valorParam      = parseFloat(params.get("valor") || "0")
  const recurrenceParam = params.get("recorrencia")    || "avulsa"

  // form state
  const [nome, setNome]             = useState("")
  const [email, setEmail]           = useState("")
  const [whatsapp, setWhatsapp]     = useState("")
  const [cpf, setCpf]               = useState("")
  const [nascimento, setNascimento] = useState("")
  const [genero, setGenero]         = useState("")
  const [cep, setCep]               = useState("")
  const [endereco, setEndereco]     = useState("")
  const [estado, setEstado]         = useState("")
  const [cidade, setCidade]         = useState("")
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [loading, setLoading]       = useState(false)

  // busca endereço por CEP
  useEffect(() => {
    const fetchCep = async () => {
      const dig = cep.replace(/\D/g, "")
      if (dig.length !== 8) return
      const res = await fetch(`/api/cep?cep=${dig}`)
      const d = await res.json()
      if (!d.erro) {
        setEndereco(`${d.logradouro}, ${d.bairro}`)
        setEstado(d.uf)
        setCidade(d.localidade)
      }
    }
    fetchCep()
  }, [cep])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aceitaTermos) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa aceitar os termos." })
      return
    }

    setLoading(true)
    try {
      // 1) cria usuário com senha padrão
      const senha = cpf.replace(/\D/g, "").slice(-6)
      const cred  = await createUserWithEmailAndPassword(auth, email, senha)
      const userId = cred.user.uid

      // 2) salva no Firestore
      const userRef = doc(db, "usuarios", userId)
      await setDoc(userRef, {
        nome,
        email,
        whatsapp: whatsapp.replace(/\D/g, ""),
        cpf:      cpf.replace(/\D/g, ""),
        nascimento,
        genero,
        cep:      cep.replace(/\D/g, ""),
        endereco,
        estado,
        cidade,
        dataCadastro:       new Date(),
        tipoUsuario:        "paciente",
        planId:             planIdParam,
        valorPlano:         valorParam,
        recorrencia:        recurrenceParam,
        subscriptionStatus: "pending",
      })

      // define o tipo de serviço e pagamento antes
      const serviceType = planoMap[planIdParam] || "G"
      const paymentType = recurrenceParam === "mensal" ? "S" : "A"

      // define as sessões conforme o plano
      let sessoes_especiais = 0
      let sessoes_gerais    = 0
      let sessoes_nutri     = 0
      let sessoes_psico     = 0

      if (serviceType === "G") { // Clínico
        sessoes_gerais = 1
      } 
      else if (serviceType === "P") { // Psicologia
        if (recurrenceParam === "mensal") {
          sessoes_psico = 2
        } else {
          sessoes_psico = 1
        }
      }
      else if (serviceType === "GS") { // GS
        sessoes_especiais = 999999
        sessoes_gerais    = 999999
      }

      // 2.1) salva na usuarios_programas com sessões específicas
      const userProgramRef = doc(db, "usuarios_programas", userId)
      await setDoc(userProgramRef, {
        programa_id: planIdParam,
        qtd_usuarios: 1,
        usuario_id: userId,
        sessoes_especiais,
        sessoes_gerais,
        sessoes_nutri,
        sessoes_psico,
      })

      const payload = [
        {
          name:        nome,
          cpf:         cpf.replace(/\D/g, ""),
          birthday:    nascimento,
          phone:       whatsapp.replace(/\D/g, ""),
          email,
          zipCode:     cep.replace(/\D/g, ""),
          address:     endereco,
          city:        cidade,
          state:       estado,
          serviceType,
          paymentType,
        },
      ]

      console.log("📤 Beneficiary payload:", payload)
      const respBen = await fetch("/api/telemedicina/beneficiary", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      })
      const rtxt = await respBen.text()
      const rdata = (() => { try { return JSON.parse(rtxt) } catch { return { message: rtxt } } })()
      if (!respBen.ok || !rdata.uuid) {
        throw new Error(rdata.message || "Erro ao criar beneficiary")
      }
      await updateDoc(userRef, { beneficiaryUuid: rdata.uuid })

      // 4) solicita cobrança
      const respAss = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, name: nome, email, planId: planIdParam, value: valorParam })
      })
      const pay = await respAss.json()
      if (!respAss.ok) {
        toast({ variant: "destructive", title: "Erro ao gerar cobrança", description: pay.error })
        return
      }

      // 5) redireciona para checkout
      window.location.href = pay.invoiceUrl

    } catch (err: any) {
      console.error(err)
      toast({ variant: "destructive", title: "Erro no cadastro", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="relative h-16 w-48 mx-auto mb-2">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MaisBrasil-yy7n1soG44eoDE13iDtGslZRRiOTtI.png"
              alt="MaisBrasil Telemedicina"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1 className="text-2xl font-bold">Cadastro de Usuário</h1>
          <p className="text-sm text-muted-foreground">
            Plano: <strong>{planIdParam}</strong> — {valorParam.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium">Nome Completo</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} required disabled={loading} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium">WhatsApp</label>
              <InputMask mask="(00) 00000-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required disabled={loading} />
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium">CPF</label>
              <InputMask mask="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} required disabled={loading} />
              <p className="text-xs text-muted-foreground">Os últimos 6 dígitos do CPF serão usados como senha.</p>
            </div>

            {/* Nascimento e Gênero */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Data de Nascimento</label>
                <Input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} required disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium">Gênero</label>
                <Select value={genero} onValueChange={setGenero} disabled={loading}>
                  <SelectTrigger><SelectValue placeholder="Selecione o gênero"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Endereço */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">CEP</label>
                <InputMask mask="00000-000" value={cep} onChange={e => setCep(e.target.value)} required disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium">Endereço</label>
                <Input value={endereco} onChange={e => setEndereco(e.target.value)} required disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium">Estado</label>
                <Select value={estado} onValueChange={setEstado} disabled={loading}>       
                  <SelectTrigger><SelectValue placeholder="UF"/></SelectTrigger>
                  <SelectContent>
                    {estados.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium">Cidade</label>
                <Input value={cidade} onChange={e => setCidade(e.target.value)} required disabled={loading} />
              </div>
            </div>

            {/* Termos */}
            <div className="flex items-start space-x-2">
              <Checkbox checked={aceitaTermos} onCheckedChange={v => setAceitaTermos(!!v)} disabled={loading} />
              <label className="text-sm">Li e concordo com os Termos de Pagamento</label>
            </div>

            {/* Botão */}
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading || !aceitaTermos}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Processando...</> : "Cadastrar e Pagar"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
