import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amount, description } = body;
    
    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "userId e amount (maior que 0) são obrigatórios" },
        { status: 400 }
      );
    }
    
    // Usar transação para garantir consistência
    const result = await runTransaction(db, async (transaction) => {
      const userCashbackRef = doc(db, "usersCashback", userId);
      const userCashbackSnap = await transaction.get(userCashbackRef);
      
      if (!userCashbackSnap.exists()) {
        throw new Error("Usuário não possui cashback");
      }
      
      const currentBalance = userCashbackSnap.data().balance || 0;
      
      if (currentBalance < amount) {
        throw new Error("Saldo insuficiente");
      }
      
      // Atualizar saldo
      transaction.update(userCashbackRef, {
        balance: currentBalance - amount,
        totalUsed: (userCashbackSnap.data().totalUsed || 0) + amount,
        lastUpdated: Timestamp.now()
      });
      
      // Criar registro de uso
      const usageRef = doc(collection(db, "cashbackUsage"));
      transaction.set(usageRef, {
        userId,
        amount,
        description: description || "Desconto aplicado",
        usedAt: Timestamp.now(),
        balanceAfter: currentBalance - amount
      });
      
      return {
        success: true,
        newBalance: currentBalance - amount,
        usageId: usageRef.id
      };
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error("❌ Erro ao usar cashback:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}