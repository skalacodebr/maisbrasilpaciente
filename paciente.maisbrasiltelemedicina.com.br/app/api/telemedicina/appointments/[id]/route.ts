import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const clientId = process.env.RAPIDOC_CLIENT_ID!;
  const token    = process.env.RAPIDOC_TOKEN!;

  /* se a doc usar .../cancel, troque abaixo */
  const url = `https://api.rapidoc.tech/tema/api/appointments/${id}`;

  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      clientId,
      "Content-Type": "application/vnd.rapidoc.tema-v2+json",
    },
  });

  if (!resp.ok) {
    return NextResponse.json(
      { message: "Erro ao cancelar consulta", status: resp.status },
      { status: resp.status }
    );
  }

  return NextResponse.json({ ok: true });
}
