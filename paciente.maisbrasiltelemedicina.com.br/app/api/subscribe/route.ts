// app/api/subscribe/route.ts
import { NextResponse } from 'next/server'
import { createCustomer, createPayment } from '@/lib/asaas'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: Request) {
  // 1) Parse seguro do corpo
  let body: any
  try {
    body = await request.json()
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Corpo inválido: ' + e.message },
      { status: 400 }
    )
  }

  // 2) Validação dos campos obrigatórios
  const { userId, name, email, planId, value } = body
  if (!userId || !name || !email || !planId || !value) {
    return NextResponse.json(
      { error: 'Campos faltando: userId, name, email, planId e value são obrigatórios.' },
      { status: 400 }
    )
  }

  // 3) Busca dados extras (CPF, WhatsApp) no Firestore
  const userRef  = doc(db, 'usuarios', userId)
  const snapUser = await getDoc(userRef)
  const userData = snapUser.data() || {}

  if (!userData.cpf) {
    return NextResponse.json(
      { error: 'CPF não encontrado para este usuário.' },
      { status: 400 }
    )
  }

  try {
    // 4) Cria (ou reutiliza) o Customer no Asaas, incluindo CPF/CNPJ
    const customer = await createCustomer({
      name,
      email,
      cpfCnpj: userData.cpf,
      phone:   userData.whatsapp
    })

    // 5) Calcula dueDate dinâmico: hoje + 3 dias
    const due = new Date()
    due.setDate(due.getDate() + 3)
    const dueDate = due.toISOString().split('T')[0]  // formato "YYYY-MM-DD"

    // 6) Cria a cobrança (Payment) no Asaas
    const payment = await createPayment({
      customer:          customer.id,
      billingType:       'BOLETO',
      dueDate,                                 
      value,
      description:       `Plano ${planId}`,
      externalReference: userId
    })

    // 7) Atualiza o documento no Firestore com os dados do Asaas
    await updateDoc(userRef, {
      asaasCustomerId:    customer.id,
      asaasPaymentId:     payment.id,
      invoiceUrl:         payment.invoiceUrl,
      subscriptionStatus: 'pending'
    })

    // 8) Retorna o link do boleto/checkout para o front redirecionar
    return NextResponse.json({ invoiceUrl: payment.invoiceUrl })

  } catch (err: any) {
    console.error('Erro em /api/subscribe:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno ao gerar cobrança' },
      { status: 500 }
    )
  }
}
