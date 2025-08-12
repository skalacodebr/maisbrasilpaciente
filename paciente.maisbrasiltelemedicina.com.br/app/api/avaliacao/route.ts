import { NextResponse } from "next/server"
import { db } from "@/lib/firebase" // Importar db já inicializado
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"

// Criar uma nova avaliação
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { usuario_id, medico_id, consulta_id, nota } = data

    if (!usuario_id || !medico_id || !consulta_id || nota === undefined) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Verificar se já existe uma avaliação para esta consulta
    const q = query(
      collection(db, "avaliacao"),
      where("consulta_id", "==", consulta_id),
      where("usuario_id", "==", usuario_id),
    )

    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return NextResponse.json({ error: "Esta consulta já foi avaliada" }, { status: 400 })
    }

    // Criar nova avaliação
    const avaliacaoData = {
      usuario_id,
      medico_id,
      consulta_id,
      nota,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "avaliacao"), avaliacaoData)

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: "Avaliação registrada com sucesso",
    })
  } catch (error: any) {
    console.error("Erro ao criar avaliação:", error)
    return NextResponse.json({ error: "Erro ao criar avaliação", details: error.message }, { status: 500 })
  }
}

// Verificar se uma consulta já foi avaliada
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const consulta_id = searchParams.get("consulta_id")
    const usuario_id = searchParams.get("usuario_id")

    if (!consulta_id || !usuario_id) {
      return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 })
    }

    const q = query(
      collection(db, "avaliacao"),
      where("consulta_id", "==", consulta_id),
      where("usuario_id", "==", usuario_id),
    )

    const querySnapshot = await getDocs(q)
    const jaAvaliada = !querySnapshot.empty

    return NextResponse.json({
      jaAvaliada,
      avaliacao: jaAvaliada ? querySnapshot.docs[0].data() : null,
    })
  } catch (error: any) {
    console.error("Erro ao verificar avaliação:", error)
    return NextResponse.json({ error: "Erro ao verificar avaliação", details: error.message }, { status: 500 })
  }
}
