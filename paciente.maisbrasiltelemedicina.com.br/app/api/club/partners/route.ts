import { NextResponse } from "next/server";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// GET - Listar parceiros e seus benefícios
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userLevel = searchParams.get("level") || "bronze";
    const category = searchParams.get("category");
    
    let partnersQuery = query(
      collection(db, "clubPartners"),
      where("active", "==", true)
    );
    
    if (category) {
      partnersQuery = query(partnersQuery, where("category", "==", category));
    }
    
    const partnersSnapshot = await getDocs(partnersQuery);
    const partners = partnersSnapshot.docs.map(doc => {
      const partnerData = { id: doc.id, ...doc.data() };
      
      // Filtrar benefícios por nível do usuário
      const availableBenefits = partnerData.benefits?.filter((benefit: any) => 
        benefit.level.includes(userLevel) && benefit.active
      ) || [];
      
      return {
        ...partnerData,
        benefits: availableBenefits
      };
    });
    
    // Filtrar parceiros que têm pelo menos um benefício para o nível
    const filteredPartners = partners.filter(partner => partner.benefits.length > 0);
    
    return NextResponse.json({ partners: filteredPartners });
    
  } catch (error: any) {
    console.error("❌ Erro ao buscar parceiros:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}