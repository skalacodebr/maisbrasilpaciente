import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const beneficiaryUuid = new URL(req.url).searchParams.get("beneficiaryUuid");

  if (!beneficiaryUuid) {
    return NextResponse.json(
      { message: "Parâmetro beneficiaryUuid é obrigatório." },
      { status: 400 }
    );
  }

  const clientId = process.env.RAPIDOC_CLIENT_ID!;
  const token    = process.env.RAPIDOC_TOKEN!;

  const url =
    `https://api.rapidoc.tech/tema/api/appointments` +
    `?beneficiaryUuid=${beneficiaryUuid}`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      clientId,
      "Content-Type": "application/vnd.rapidoc.tema-v2+json",
    },
  });

  if (!resp.ok) {
    return NextResponse.json(
      { message: "Erro ao buscar agendamentos", status: resp.status },
      { status: resp.status }
    );
  }

  const data = await resp.json(); // deve ser um array de appointments
  return NextResponse.json(data);
}
