import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { appointmentId } = await req.json();
  if (!appointmentId) {
    return NextResponse.json(
      { message: "appointmentId é obrigatório." },
      { status: 400 }
    );
  }

  const clientId = process.env.RAPIDOC_CLIENT_ID!;
  const token    = process.env.RAPIDOC_TOKEN!;

  /* verifique path exato na doc */
  const url =
    `https://api.rapidoc.tech/tema/api/appointments/` +
    `${appointmentId}/request-join`;

  const resp = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      clientId,
      "Content-Type": "application/vnd.rapidoc.tema-v2+json",
    },
  });

  if (resp.status === 204) {
    return NextResponse.json({ pending: true });
  }

  const location = resp.headers.get("location");
  const text = await resp.text();
  const joinUrl =
    location?.startsWith("http")
      ? location
      : text.trim().startsWith("http")
      ? text.trim()
      : null;

  if (!joinUrl) {
    return NextResponse.json(
      { message: "URL não encontrada", raw: text },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: joinUrl });
}
