// app/api/telemedicina/specialties/route.ts
import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.RAPIDOC_CLIENT_ID
  const token    = process.env.RAPIDOC_TOKEN

  if (!clientId || !token) {
    return NextResponse.json(
      { message: "Credenciais Rapidoc não configuradas." },
      { status: 500 }
    )
  }

  // ATENÇÃO: no sandbox o endpoint singular falha; aqui usamos o plural
  const res = await fetch(
    "https://api.rapidoc.tech/tema/api/specialties",
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "clientId": clientId,
        "Content-Type": "application/vnd.rapidoc.tema-v2+json",
      },
    }
  )

  const text = await res.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = text }

  if (!res.ok) {
    return NextResponse.json(
      { message: "Erro da Rapidoc", status: res.status, body: data },
      { status: res.status }
    )
  }

  return NextResponse.json(data)
}
