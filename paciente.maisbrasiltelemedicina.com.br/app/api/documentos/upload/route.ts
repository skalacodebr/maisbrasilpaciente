import { NextResponse } from "next/server"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytesResumable } from "firebase/storage"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const arquivo = formData.get("arquivo") as File
    const titulo = formData.get("titulo") as string
    const userId = formData.get("userId") as string

    if (!arquivo || !titulo || !userId) {
      return NextResponse.json({ error: "Arquivo, título e ID do usuário são obrigatórios" }, { status: 400 })
    }

    console.log("[SERVER] Iniciando upload para:", `documentos/${userId}/${Date.now()}_${arquivo.name}`)

    // Converter o arquivo para um array de bytes
    const bytes = await arquivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determinar o tipo de arquivo
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() || ""
    let tipo = "outro"

    if (["pdf"].includes(extensao)) {
      tipo = "pdf"
    } else if (["doc", "docx"].includes(extensao)) {
      tipo = "doc"
    } else if (["jpg", "jpeg", "png"].includes(extensao)) {
      tipo = "imagem"
    }

    try {
      // Criar um nome de arquivo único
      const timestamp = Date.now()
      const nomeArquivo = `${timestamp}_${arquivo.name}`
      const caminhoArquivo = `documentos/${userId}/${nomeArquivo}`
      const storageRef = ref(storage, caminhoArquivo)

      // Metadados para o arquivo
      const metadata = {
        contentType: arquivo.type || "application/octet-stream",
        customMetadata: {
          uploadedBy: userId,
          titulo: titulo,
          originalName: arquivo.name,
          timestamp: timestamp.toString(),
        },
      }

      // Upload do arquivo
      console.log("[SERVER] Iniciando upload com metadados:", metadata)
      await uploadBytesResumable(storageRef, buffer, metadata)
      console.log("[SERVER] Upload concluído com sucesso")

      // Construir URL manualmente (já que getDownloadURL está falhando)
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(caminhoArquivo)}?alt=media`
      console.log("[SERVER] URL construída manualmente:", downloadURL)

      // Salvar metadados no Firestore
      const docRef = await addDoc(collection(db, "documentos"), {
        usuario_id: userId,
        titulo: titulo,
        nome_arquivo: arquivo.name,
        tipo: tipo,
        url: downloadURL,
        tamanho: arquivo.size,
        caminho_storage: caminhoArquivo,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        timestamp_upload: timestamp,
      })

      console.log("[SERVER] Documento salvo no Firestore com ID:", docRef.id)

      return NextResponse.json({
        success: true,
        id: docRef.id,
        url: downloadURL,
        caminho_storage: caminhoArquivo,
      })
    } catch (uploadError) {
      console.error("[SERVER] Erro específico durante o upload:", uploadError)
      throw new Error(`Erro durante o upload: ${uploadError.message}`)
    }
  } catch (error: any) {
    console.error("[SERVER] Erro ao fazer upload:", error)

    return NextResponse.json({ error: "Erro ao fazer upload do documento", details: error.message }, { status: 500 })
  }
}
