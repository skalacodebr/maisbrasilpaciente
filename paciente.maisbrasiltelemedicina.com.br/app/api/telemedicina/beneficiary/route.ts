// app/api/telemedicina/beneficiary/route.ts
import { NextResponse } from "next/server";

type Err = {
  success: false;
  message: string;
  raw?: any;
  debug?: any;
};

export async function POST(req: Request) {
  try {
    // 1) Parse and normalize payload
    const body = await req.json();
    const payload = Array.isArray(body) ? body : [body];

    // 2) Load credentials and base URL
    const clientId = process.env.RAPIDOC_CLIENT_ID!;
    const token    = process.env.RAPIDOC_TOKEN!;
    const baseUrl  = process.env.RAPIDOC_BASE_URL || "https://api.rapidoc.tech/tema/api";

    // 3) Construct endpoint URL
    const url = `${baseUrl}/beneficiaries`;
    console.log("🔗 Rapidoc POST URL:", url);
    console.log("🔍 Rapidoc debug:", { clientId, token });

    // 4) Send request to Rapidoc
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        clientId,
        Accept: "application/json",
        "Content-Type": "application/vnd.rapidoc.tema-v2+json",
      },
      body: JSON.stringify(payload),
    });

    // 5) Always read body as text, then try parse
    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    // 6) Extract uuid: either data.uuid or data.beneficiaries[0].uuid
    const beneficiaries = Array.isArray(data?.beneficiaries) ? data.beneficiaries : null;
    const firstUuid = beneficiaries && beneficiaries.length > 0
      ? beneficiaries[0].uuid
      : null;
    const singleUuid = typeof data.uuid === "string" ? data.uuid : null;

    if (resp.ok && (singleUuid || firstUuid)) {
      const uuid = singleUuid || firstUuid!;
      return NextResponse.json({ success: true, uuid });
    }

    // 7) Check if it's an expired key error - if so, allow signup to continue
    const isExpiredKeyError = text.toLowerCase().includes('expired') || 
                             text.toLowerCase().includes('expirado') ||
                             text.toLowerCase().includes('key') ||
                             resp.status === 401 || resp.status === 403;
    
    if (isExpiredKeyError) {
      console.log("⚠️ Rapidoc key expired, allowing signup to continue without beneficiary creation");
      return NextResponse.json({ success: true, uuid: null, warning: "Rapidoc unavailable" });
    }

    // 8) On other errors, return details
    return NextResponse.json<Err>(
      {
        success: false,
        message: data?.message || "Erro Rapidoc",
        raw: data,
        debug: { clientId, token },
      },
      { status: resp.status }
    );
  } catch (e: any) {
    // Unexpected exception
    return NextResponse.json<Err>(
      {
        success: false,
        message: "Exceção no handler",
        raw: null,
        debug: String(e),
      },
      { status: 500 }
    );
  }
}
