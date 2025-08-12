import { NextResponse } from "next/server"
import { storage } from "@/lib/firebase"
import { ref, getBlob } from "firebase/storage"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const caminho = searchParams.get("caminho")
    const nome = searchParams.get("nome") || "documento"

    if (!caminho) {
      return NextResponse.json({ error: "Caminho do arquivo não fornecido" }, { status: 400 })
    }

    console.log("[SERVER] Tentando obter arquivo para:", caminho)

    try {
      // Obter o arquivo diretamente como blob
      const storageRef = ref(storage, caminho)
      const blob = await getBlob(storageRef)

      // Determinar o tipo de conteúdo com base na extensão do arquivo
      const extensao = caminho.split(".").pop()?.toLowerCase() || ""
      let contentType = "application/octet-stream"

      if (extensao === "pdf") {
        contentType = "application/pdf"
      } else if (["doc", "docx"].includes(extensao)) {
        contentType = "application/msword"
      } else if (["jpg", "jpeg"].includes(extensao)) {
        contentType = "image/jpeg"
      } else if (extensao === "png") {
        contentType = "image/png"
      }

      // Converter o blob para um array buffer
      const arrayBuffer = await blob.arrayBuffer()

      // Criar uma resposta com o arquivo
      const response = new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${nome}.${extensao}"`,
          "Content-Length": blob.size.toString(),
        },
      })

      return response
    } catch (error: any) {
      console.error("[SERVER] Erro ao obter arquivo:", error)
      return NextResponse.json({ error: "Erro ao obter arquivo", details: error.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[SERVER] Erro geral:", error)
    return NextResponse.json({ error: "Erro ao processar solicitação", details: error.message }, { status: 500 })
  }
}
