'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function PendingPayment() {
  const router = useRouter()
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      const user = auth.currentUser
      if (!user) {
        setLoading(false)
        router.replace('/login')
        return
      }
      const snap = await getDoc(doc(db, 'usuarios', user.uid))
      const data = snap.data()

      if (data?.subscriptionStatus === 'paid') {
        setLoading(false)
        router.replace('/dashboard')
        return
      }

      setInvoiceUrl(data?.invoiceUrl || null)
      setLoading(false)
    }
    fetchInvoice()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-600">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Pagamento Pendente</h1>
      <p className="mb-6">Seu pagamento ainda não foi confirmado.</p>
      {invoiceUrl && (
        <Button onClick={() => window.open(invoiceUrl, '_blank')}>
          Pagar Agora
        </Button>
      )}
    </div>
  )
}
