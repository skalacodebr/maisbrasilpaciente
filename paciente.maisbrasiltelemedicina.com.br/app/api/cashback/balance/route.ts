import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    const userCashbackRef = doc(db, "usersCashback", userId);
    const userCashbackSnap = await getDoc(userCashbackRef);
    
    if (!userCashbackSnap.exists()) {
      return NextResponse.json({
        balance: 0,
        totalEarned: 0,
        totalUsed: 0
      });
    }
    
    const data = userCashbackSnap.data();
    return NextResponse.json({
      balance: data.balance || 0,
      totalEarned: data.totalEarned || 0,
      totalUsed: data.totalUsed || 0,
      lastUpdated: data.lastUpdated
    });
    
  } catch (error: any) {
    console.error("❌ Erro ao buscar saldo de cashback:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}