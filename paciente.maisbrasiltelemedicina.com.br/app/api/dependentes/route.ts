import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc } from "firebase/firestore"

// Criar relação de dependente
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { usuario_id, dependente_id } = data

    if (!usuario_id || !dependente_id) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Verificar se a relação já existe
    const q = query(
      collection(db, "dependentes"),
      where("usuario_id", "==", usuario_id),
      where("dependente_id", "==", dependente_id),
    )

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return NextResponse.json({ error: "Este dependente já está vinculado à sua conta" }, { status: 400 })
    }

    // Criar nova relação
    const docRef = await addDoc(collection(db, "dependentes"), {
      usuario_id,
      dependente_id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      id: docRef.id,
    })
  } catch (error: any) {
    console.error("Erro ao criar relação de dependente:", error)
    return NextResponse.json({ error: "Erro ao criar relação de dependente", details: error.message }, { status: 500 })
  }
}

// Excluir relação de dependente
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const usuario_id = searchParams.get("usuario_id")
    const dependente_id = searchParams.get("dependente_id")

    if (!dependente_id) {
      return NextResponse.json({ error: "ID do dependente é obrigatório" }, { status: 400 })
    }

    // Primeiro, tentar buscar pela combinação de usuario_id e dependente_id
    let q
    if (usuario_id) {
      q = query(
        collection(db, "dependentes"),
        where("usuario_id", "==", usuario_id),
        where("dependente_id", "==", dependente_id),
      )
    } else {
      // Se não tiver usuario_id, buscar apenas pelo dependente_id
      q = query(collection(db, "dependentes"), where("dependente_id", "==", dependente_id))
    }

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({ error: "Relação de dependente não encontrada" }, { status: 404 })
    }

    // Excluir o documento
    const docId = querySnapshot.docs[0].id
    await deleteDoc(doc(db, "dependentes", docId))

    return NextResponse.json({
      success: true,
      message: "Relação de dependente excluída com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao excluir relação de dependente:", error)
    return NextResponse.json(
      { error: "Erro ao excluir relação de dependente", details: error.message },
      { status: 500 },
    )
  }
}
