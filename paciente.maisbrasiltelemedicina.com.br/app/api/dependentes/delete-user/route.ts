import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore"

// Função para excluir usuário do Firestore e marcar para exclusão no Authentication
export async function POST(request: Request) {
  try {
    console.log("[DELETE-USER] Iniciando processo de exclusão de dependente")
    const data = await request.json()
    const { dependente_id } = data

    if (!dependente_id) {
      console.log("[DELETE-USER] Erro: ID do dependente não fornecido")
      return NextResponse.json({ error: "ID do dependente é obrigatório" }, { status: 400 })
    }

    console.log(`[DELETE-USER] Buscando dados do dependente ID: ${dependente_id}`)
    // 1. Buscar dados do dependente para obter o email e CPF
    const dependenteDoc = await getDoc(doc(db, "usuarios", dependente_id))
    if (!dependenteDoc.exists()) {
      console.log(`[DELETE-USER] Erro: Dependente ID ${dependente_id} não encontrado no Firestore`)
      return NextResponse.json({ error: "Dependente não encontrado" }, { status: 404 })
    }

    const dependenteData = dependenteDoc.data()
    const dependenteEmail = dependenteData.email
    const dependenteCpf = dependenteData.cpf

    console.log(`[DELETE-USER] Dados do dependente: Email=${dependenteEmail}, CPF=${dependenteCpf}`)

    // 2. Excluir a relação na coleção "dependentes"
    console.log(`[DELETE-USER] Buscando relação de dependente para ID: ${dependente_id}`)
    const q = query(collection(db, "dependentes"), where("dependente_id", "==", dependente_id))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`[DELETE-USER] Erro: Relação de dependente não encontrada para ID: ${dependente_id}`)
      return NextResponse.json({ error: "Relação de dependente não encontrada" }, { status: 404 })
    }

    // Excluir o documento de dependente
    const docId = querySnapshot.docs[0].id
    console.log(`[DELETE-USER] Excluindo relação de dependente, documento ID: ${docId}`)
    await deleteDoc(doc(db, "dependentes", docId))
    console.log(`[DELETE-USER] Relação de dependente excluída com sucesso`)

    // 3. Excluir o documento do usuário no Firestore
    console.log(`[DELETE-USER] Excluindo documento do usuário ID: ${dependente_id} do Firestore`)
    await deleteDoc(doc(db, "usuarios", dependente_id))
    console.log(`[DELETE-USER] Documento do usuário excluído com sucesso do Firestore`)

    // 4. Enviar email, CPF e ID para a API que vai excluir o usuário do Authentication
    console.log(`[DELETE-USER] Enviando requisição para excluir usuário do Authentication`)
    const authDeleteResponse = await fetch("/api/auth/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: dependente_id,
        email: dependenteEmail,
        cpf: dependenteCpf,
      }),
    })

    const authDeleteData = await authDeleteResponse.json()
    console.log(`[DELETE-USER] Resposta da API de exclusão do Authentication:`, authDeleteData)

    return NextResponse.json({
      success: true,
      message: "Dependente excluído com sucesso do sistema",
      authDelete: authDeleteData,
    })
  } catch (error: any) {
    console.error("[DELETE-USER] Erro ao excluir dependente:", error)
    return NextResponse.json({ error: "Erro ao excluir dependente", details: error.message }, { status: 500 })
  }
}
