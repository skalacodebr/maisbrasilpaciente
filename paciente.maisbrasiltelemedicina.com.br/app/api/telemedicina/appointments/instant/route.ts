import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const beneficiaryUuid = req.nextUrl.searchParams.get("beneficiaryUuid");
  if (!beneficiaryUuid) {
    return NextResponse.json({ message: "beneficiaryUuid é obrigatório" }, { status: 400 });
  }

  const token = process.env.RAPIDOC_TOKEN!;
  const clientId = process.env.RAPIDOC_CLIENT_ID!;

  const url = `https://api.rapidoc.tech/tema/api/beneficiaries/${beneficiaryUuid}/request-appointment`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      clientId,
      "Content-Type": "application/vnd.rapidoc.tema-v2+json",
    },
  });

  const json = await resp.json();
  const joinUrl = json?.url;
  
  if (!resp.ok || !joinUrl) {
    return NextResponse.json({ message: "Erro ao obter link", raw: JSON.stringify(json) }, { status: resp.status });
  }
  
  return NextResponse.json({ url: joinUrl });
  
}
