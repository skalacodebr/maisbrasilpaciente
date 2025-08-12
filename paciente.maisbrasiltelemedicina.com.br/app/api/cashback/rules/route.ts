import { NextResponse } from "next/server";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CashbackRule } from "@/lib/cashback-types";

// GET - Listar todas as regras
export async function GET() {
  try {
    const rulesSnapshot = await getDocs(collection(db, "cashbackRules"));
    const rules = rulesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("❌ Erro ao buscar regras:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// POST - Criar nova regra
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, percentage, minValue, maxCashback, validFrom, validUntil, planIds, active } = body;
    
    if (!name || !percentage || !validFrom) {
      return NextResponse.json(
        { error: "name, percentage e validFrom são obrigatórios" },
        { status: 400 }
      );
    }
    
    const newRule: Omit<CashbackRule, 'id'> = {
      name,
      percentage,
      minValue: minValue || 0,
      maxCashback: maxCashback || null,
      validFrom: Timestamp.fromDate(new Date(validFrom)),
      validUntil: validUntil ? Timestamp.fromDate(new Date(validUntil)) : null,
      planIds: planIds || [],
      active: active !== false
    };
    
    const docRef = await addDoc(collection(db, "cashbackRules"), newRule);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      rule: { id: docRef.id, ...newRule }
    });
    
  } catch (error: any) {
    console.error("❌ Erro ao criar regra:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar regra
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }
    
    // Converter datas se fornecidas
    if (updateData.validFrom) {
      updateData.validFrom = Timestamp.fromDate(new Date(updateData.validFrom));
    }
    if (updateData.validUntil) {
      updateData.validUntil = Timestamp.fromDate(new Date(updateData.validUntil));
    }
    
    await updateDoc(doc(db, "cashbackRules", id), updateData);
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ Erro ao atualizar regra:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar regra
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "id é obrigatório" },
        { status: 400 }
      );
    }
    
    await deleteDoc(doc(db, "cashbackRules", id));
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("❌ Erro ao deletar regra:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}