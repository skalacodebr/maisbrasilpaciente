import { NextResponse } from "next/server";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const maxResults = parseInt(searchParams.get("limit") || "50");
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    let q = query(
      collection(db, "cashbackTransactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    
    if (status) {
      q = query(
        collection(db, "cashbackTransactions"),
        where("userId", "==", userId),
        where("status", "==", status),
        orderBy("createdAt", "desc"),
        limit(maxResults)
      );
    }
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ transactions });
    
  } catch (error: any) {
    console.error("❌ Erro ao buscar transações de cashback:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}