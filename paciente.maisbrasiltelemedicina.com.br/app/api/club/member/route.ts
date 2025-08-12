import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClubMember } from "@/lib/club-types";
import { calculateUserLevel, getNextLevel, CLUB_LEVELS } from "@/lib/club-config";

// GET - Consultar status do membro
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
    
    // Buscar dados do membro
    const memberRef = doc(db, "clubMembers", userId);
    const memberSnap = await getDoc(memberRef);
    
    let memberData: ClubMember;
    
    if (memberSnap.exists()) {
      memberData = { id: memberSnap.id, ...memberSnap.data() } as ClubMember;
    } else {
      // Criar membro novo
      const now = new Date();
      memberData = {
        userId,
        level: 'bronze',
        points: 0,
        totalSpent: 0,
        consultationsCount: 0,
        monthsActive: 0,
        joinedAt: now,
        lastActivity: now
      };
      
      await updateDoc(memberRef, {
        ...memberData,
        joinedAt: new Date(memberData.joinedAt),
        lastActivity: new Date(memberData.lastActivity)
      });
    }
    
    // Calcular nível atual
    const currentLevelConfig = calculateUserLevel(memberData);
    const nextLevelConfig = getNextLevel(currentLevelConfig);
    
    // Calcular progresso para próximo nível
    let progress = 0;
    let nextLevelProgress = null;
    
    if (nextLevelConfig) {
      const pointsProgress = memberData.points / nextLevelConfig.minPoints;
      const spentProgress = memberData.totalSpent / nextLevelConfig.minSpent;
      const consultationsProgress = memberData.consultationsCount / nextLevelConfig.minConsultations;
      const monthsProgress = memberData.monthsActive / nextLevelConfig.minMonths;
      
      progress = Math.min(pointsProgress, spentProgress, consultationsProgress, monthsProgress);
      
      nextLevelProgress = {
        pointsNeeded: Math.max(0, nextLevelConfig.minPoints - memberData.points),
        spentNeeded: Math.max(0, nextLevelConfig.minSpent - memberData.totalSpent),
        consultationsNeeded: Math.max(0, nextLevelConfig.minConsultations - memberData.consultationsCount),
        monthsNeeded: Math.max(0, nextLevelConfig.minMonths - memberData.monthsActive)
      };
    }
    
    return NextResponse.json({
      member: memberData,
      currentLevel: currentLevelConfig,
      nextLevel: nextLevelConfig,
      progress: Math.round(progress * 100),
      nextLevelProgress
    });
    
  } catch (error: any) {
    console.error("❌ Erro ao buscar membro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar dados do membro
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    const memberRef = doc(db, "clubMembers", userId);
    await updateDoc(memberRef, {
      ...updateData,
      lastActivity: new Date()
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ Erro ao atualizar membro:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}