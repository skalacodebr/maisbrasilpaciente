// app/api/asaas/webhook/route.ts
import { NextResponse } from "next/server";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CashbackRule, CashbackTransaction } from "@/lib/cashback-types";
import { POINTS_CONFIG } from "@/lib/club-config";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("🔔 Webhook raw body:", payload);

    if (payload.event === "PAYMENT_RECEIVED") {
      const payment = payload.payment;
      const userId = payment.externalReference;
      if (!userId) {
        console.warn("⚠️ PAYMENT_RECEIVED sem externalReference");
        return NextResponse.json({}, { status: 200 });
      }

      // 1) Lê dados do usuário
      const userRef = doc(db, "usuarios", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};

      // 2) Atualiza usuário: status e lastPaymentDate
      await updateDoc(userRef, {
        subscriptionStatus: "paid",
        lastPaymentDate: payment.paymentDate
      });

      // 3) Busca a recorrência do plano
      let expirationDate: Date | null = null;
      if (userData.planId) {
        const planRef = doc(db, "programas", userData.planId);
        const planSnap = await getDoc(planRef);
        const planData = planSnap.data();
        if (planData?.recorrencia === "mensal") {
          // adiciona 1 mês a paymentDate
          const pd = new Date(payment.paymentDate);
          pd.setMonth(pd.getMonth() + 1);
          expirationDate = pd;
        }
      }

      // 4) Grava na coleção `payments`
      const paymentData = {
        userId,
        planId:         userData.planId || null,
        value:          payment.value,
        netValue:       payment.netValue || payment.value,
        date:           payment.paymentDate,
        asaasPaymentId: payment.id,
        expirationDate: expirationDate ? Timestamp.fromDate(expirationDate) : null,
        userEmail:      userData.email || null,
        userName:       userData.name || null,
        userCpf:        userData.cpf || null,
        paymentMethod:  payment.billingType || null,
        status:         "RECEIVED",
        webhookEvent:   "PAYMENT_RECEIVED",
        processedAt:    Timestamp.now()
      };
      
      const paymentRef = await addDoc(collection(db, "payments"), paymentData);

      // 5) Calcular e aplicar cashback
      await calculateAndApplyCashback({
        userId,
        paymentId: paymentRef.id,
        paymentValue: payment.value,
        planId: userData.planId
      });

      // 6) Adicionar pontos do clube
      await addClubPoints({
        userId,
        paymentValue: payment.value,
        paymentId: paymentRef.id
      });

      console.log(`✅ payment registrado user=${userId}, expirationDate=${expirationDate}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Erro em /api/asaas/webhook:", err);
    return NextResponse.json(
      { error: err.message || "Erro interno no webhook" },
      { status: 500 }
    );
  }
}

async function calculateAndApplyCashback({
  userId,
  paymentId,
  paymentValue,
  planId
}: {
  userId: string
  paymentId: string
  paymentValue: number
  planId?: string
}) {
  try {
    // Buscar regras de cashback ativas
    const rulesQuery = query(
      collection(db, "cashbackRules"),
      where("active", "==", true)
    );
    const rulesSnapshot = await getDocs(rulesQuery);
    
    let bestRule: CashbackRule | null = null;
    let highestCashback = 0;
    
    const now = new Date();
    
    rulesSnapshot.forEach((doc) => {
      const rule = { id: doc.id, ...doc.data() } as CashbackRule;
      
      // Verificar se a regra está dentro do período de validade
      const validFrom = rule.validFrom.toDate ? rule.validFrom.toDate() : rule.validFrom;
      const validUntil = rule.validUntil?.toDate ? rule.validUntil.toDate() : rule.validUntil;
      
      if (validFrom > now || (validUntil && validUntil < now)) {
        return;
      }
      
      // Verificar se a regra se aplica ao plano
      if (rule.planIds && rule.planIds.length > 0 && planId && !rule.planIds.includes(planId)) {
        return;
      }
      
      // Verificar valor mínimo
      if (rule.minValue && paymentValue < rule.minValue) {
        return;
      }
      
      // Calcular cashback para esta regra
      let cashbackValue = paymentValue * (rule.percentage / 100);
      
      // Aplicar limite máximo se existir
      if (rule.maxCashback && cashbackValue > rule.maxCashback) {
        cashbackValue = rule.maxCashback;
      }
      
      // Selecionar a melhor regra
      if (cashbackValue > highestCashback) {
        highestCashback = cashbackValue;
        bestRule = rule;
      }
    });
    
    if (bestRule && highestCashback > 0) {
      // Criar transação de cashback
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6); // Expira em 6 meses
      
      await addDoc(collection(db, "cashbackTransactions"), {
        userId,
        paymentId,
        ruleId: bestRule.id,
        originalValue: paymentValue,
        cashbackValue: highestCashback,
        status: "confirmed",
        createdAt: Timestamp.fromDate(now),
        confirmedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt)
      } as CashbackTransaction);
      
      // Atualizar ou criar saldo do usuário
      const userCashbackRef = doc(db, "usersCashback", userId);
      const userCashbackSnap = await getDoc(userCashbackRef);
      
      if (userCashbackSnap.exists()) {
        await updateDoc(userCashbackRef, {
          balance: increment(highestCashback),
          totalEarned: increment(highestCashback),
          lastUpdated: Timestamp.fromDate(now)
        });
      } else {
        await updateDoc(userCashbackRef, {
          userId,
          balance: highestCashback,
          totalEarned: highestCashback,
          totalUsed: 0,
          lastUpdated: Timestamp.fromDate(now)
        });
      }
      
      console.log(`💰 Cashback aplicado: R$ ${highestCashback.toFixed(2)} para user=${userId}`);
    }
  } catch (error) {
    console.error("❌ Erro ao calcular cashback:", error);
  }
}

async function addClubPoints({
  userId,
  paymentValue,
  paymentId
}: {
  userId: string
  paymentValue: number
  paymentId: string
}) {
  try {
    // Calcular pontos: 10 pontos por R$ 1 gasto
    const points = Math.floor(paymentValue * POINTS_CONFIG.PAYMENT);
    
    if (points > 0) {
      const response = await fetch('/api/club/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          points,
          reason: `Pagamento de R$ ${paymentValue.toFixed(2)}`,
          type: 'earned',
          relatedId: paymentId
        })
      });
      
      if (response.ok) {
        console.log(`🏆 Pontos adicionados: ${points} pontos para user=${userId}`);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao adicionar pontos do clube:", error);
  }
}
