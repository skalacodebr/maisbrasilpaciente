import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PointTransaction, UserPoints } from "@/lib/club-types";
import { POINTS_CONFIG } from "@/lib/club-config";

// GET - Consultar pontos do usuário
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
    
    const userPointsRef = doc(db, "userPoints", userId);
    const userPointsSnap = await getDoc(userPointsRef);
    
    if (!userPointsSnap.exists()) {
      return NextResponse.json({
        points: 0,
        earnedThisMonth: 0,
        usedThisMonth: 0,
        transactions: []
      });
    }
    
    const data = userPointsSnap.data();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error("❌ Erro ao buscar pontos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Adicionar pontos
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, points, reason, type = 'earned', relatedId } = body;
    
    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: "userId, points e reason são obrigatórios" },
        { status: 400 }
      );
    }
    
    const result = await runTransaction(db, async (transaction) => {
      const userPointsRef = doc(db, "userPoints", userId);
      const userPointsSnap = await transaction.get(userPointsRef);
      
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
      
      let currentData: UserPoints;
      
      if (userPointsSnap.exists()) {
        currentData = userPointsSnap.data() as UserPoints;
      } else {
        currentData = {
          userId,
          points: 0,
          earnedThisMonth: 0,
          usedThisMonth: 0,
          transactions: []
        };
      }
      
      // Atualizar pontos
      if (type === 'earned') {
        currentData.points += points;
        currentData.earnedThisMonth += points;
        currentData.lastEarned = now;
      } else if (type === 'used') {
        if (currentData.points < points) {
          throw new Error("Pontos insuficientes");
        }
        currentData.points -= points;
        currentData.usedThisMonth += points;
        currentData.lastUsed = now;
      }
      
      // Criar transação
      const newTransaction: PointTransaction = {
        userId,
        type,
        points,
        reason,
        date: now,
        relatedId
      };
      
      // Salvar transação separadamente
      const transactionRef = doc(collection(db, "pointTransactions"));
      transaction.set(transactionRef, {
        ...newTransaction,
        date: Timestamp.fromDate(now)
      });
      
      // Atualizar pontos do usuário
      transaction.set(userPointsRef, {
        ...currentData,
        lastEarned: currentData.lastEarned ? Timestamp.fromDate(currentData.lastEarned) : null,
        lastUsed: currentData.lastUsed ? Timestamp.fromDate(currentData.lastUsed) : null
      });
      
      return {
        success: true,
        newBalance: currentData.points,
        transactionId: transactionRef.id
      };
    });
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error("❌ Erro ao processar pontos:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}