import { NextResponse } from "next/server";

type Err = { message: string; detail?: any };

export async function POST(req: Request) {
  /* ---------- 1. body ---------- */
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json<Err>(
      { message: "Body JSON inválido", detail: String(e) },
      { status: 400 }
    );
  }

  const { beneficiaryUuid, specialtyUuid } = body ?? {};
  if (!beneficiaryUuid || !specialtyUuid) {
    return NextResponse.json<Err>(
      { message: "beneficiaryUuid e specialtyUuid são obrigatórios." },
      { status: 400 }
    );
  }

  /* ---------- 2. credenciais ---------- */
  const clientId = process.env.RAPIDOC_CLIENT_ID;
  const token    = process.env.RAPIDOC_TOKEN;
  if (!clientId || !token) {
    return NextResponse.json<Err>(
      { message: "Credenciais Rapidoc não configuradas." },
      { status: 500 }
    );
  }

  /* ---------- 3. chamada Rapidoc ---------- */
  const url =
    `https://api.rapidoc.tech/tema/api/beneficiaries/` +
    `${beneficiaryUuid}/request-appointment?specialtyUuid=${specialtyUuid}`;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        clientId,
        "Content-Type": "application/vnd.rapidoc.tema-v2+json",
      },
    });
  } catch (e) {
    return NextResponse.json<Err>(
      { message: "Falha de rede ao chamar Rapidoc", detail: String(e) },
      { status: 502 }
    );
  }

  /* ---------- 4. status 204 -------------- */
  if (resp.status === 204) {
    return NextResponse.json({ pending: true }); // front deve aguardar
  }

  /* ---------- 5. extrai URL -------------- */
  const location = resp.headers.get("location") || resp.headers.get("Location");
  const text = await resp.text();

  let finalUrl: string | null = null;

  if (location?.startsWith("http")) {
    finalUrl = location;
  } else if (text.trim().startsWith("{")) {
    try {
      const j = JSON.parse(text);
      finalUrl = j.url ?? j.link ?? null;
    } catch {/* ignore */}
  } else if (text.trim().startsWith("http")) {
    finalUrl = text.trim();
  }

  if (!resp.ok || !finalUrl) {
    return NextResponse.json<Err>(
      {
        message: "Rapidoc retornou erro ou URL ausente",
        detail: { status: resp.status, text, location },
      },
      { status: resp.status || 500 }
    );
  }

  return NextResponse.json({ url: finalUrl });
}
