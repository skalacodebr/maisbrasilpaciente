import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get("cep")

  if (!cep) {
    return NextResponse.json({ error: "CEP não fornecido" }, { status: 400 })
  }

  try {
    // Usando o by pass para evitar erro de CORS
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar CEP" }, { status: 500 })
  }
}
