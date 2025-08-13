"use client";

import React, { useEffect, useState } from "react";
import { Phone, Check, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ConsultaCard } from "@/components/consulta-card";
import { Button } from "@/components/ui/button";
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, query, where, limit } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { MEDICAL_SPECIALTIES } from "@/lib/medicalSpecialties";
import { CashbackCard } from "@/components/cashback/cashback-card";
import { ConsultaImediata } from "@/types/consulta";

/* --- UUIDs vindos do .env --- */
const GENERAL_UUID     = process.env.NEXT_PUBLIC_RAPIDOC_GENERAL_SPECIALTY_UUID!;
const PSYCHOLOGY_UUID  = process.env.NEXT_PUBLIC_RAPIDOC_PSYCHOLOGY_SPECIALTY_UUID!;
const NUTRITION_UUID   = process.env.NEXT_PUBLIC_RAPIDOC_NUTRITION_SPECIALTY_UUID!;

/* --- Plano Map para serviço --- */
const planoMap: Record<string, string> = {
  clinico:       "G",
  psicologia:    "P",
  GP:            "GP",
  GS:            "GS",
  GSP:           "GSP",
  nutricionista: "GS",
};

type StatusConsulta = "agendada" | "em_breve" | "concluida" | "cancelada";
interface Agendamento {
  id: string;
  especialidade: string;
  medico: string;
  data: string;
  hora: string;
  status: StatusConsulta;
}
interface ConsultOption {
  title: string;
  uuid: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [allowed, setAllowed]                   = useState<boolean | null>(null);
  const [allowedConsults, setAllowedConsults]   = useState<ConsultOption[]>([]);
  const [agendamentos, setAgendamentos]         = useState<Agendamento[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [collapsed, setCollapsed]               = useState(false);
  const [rapidocEnabled, setRapidocEnabled]     = useState<boolean>(true);

  // 1) Protege rota e define opções de Consulta Imediata
  useEffect(() => {
    const init = async () => {
      if (loading) return; // Aguarda verificação do auth
      
      if (!user) {
        router.replace("/login");
        return;
      }
      const db = getFirestore();
      const snapUser = await getDoc(doc(db, "usuarios", user.uid));
      const { subscriptionStatus } = snapUser.data() || {};

      if (subscriptionStatus !== "paid") {
        router.replace("/pending-payment");
        return;
      }

      // Busca configuração do rapidoc
      try {
        const configSnap = await getDoc(doc(db, "api", "config"));
        console.log("Config exists:", configSnap.exists());
        
        if (configSnap.exists()) {
          const configData = configSnap.data();
          console.log("Config rapidoc data:", configData);
          setRapidocEnabled(configData?.rapidoc === true);
        } else {
          console.log("Documento api/config não existe");
          setRapidocEnabled(true);
        }
      } catch (error) {
        console.log("Erro ao buscar config:", error);
        setRapidocEnabled(true);
      }

      const snapProgram = await getDoc(doc(db, "usuarios_programas", user.uid));
      const { programa_id } = snapProgram.data() || {};

      const consults: ConsultOption[] = [];
      const serviceType = planoMap[programa_id] || "G"; // Default clínico

      if (serviceType === "G" || serviceType === "GS") {
        consults.push({ title: "Clínico Geral", uuid: GENERAL_UUID });
      }

      if (serviceType === "P") {
        consults.push({ title: "Psicologia", uuid: PSYCHOLOGY_UUID });
      }

      setAllowedConsults(consults);
      setAllowed(true);
    };

    init();
  }, [router, user, loading]);

  // 2) Busca consultas agendadas
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setLoadingAppointments(false);
        return;
      }
      const db = getFirestore();
      const snap = await getDoc(doc(db, "usuarios", user.uid));
      const beneficiaryUuid = snap.data()?.beneficiaryUuid;
      if (!beneficiaryUuid) {
        setLoadingAppointments(false);
        return;
      }
      const resp = await fetch(
        `/api/telemedicina/appointments/list?beneficiaryUuid=${beneficiaryUuid}`
      );
      if (!resp.ok) {
        setLoadingAppointments(false);
        return;
      }
      const payload = await resp.json();
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.appointments)
        ? payload.appointments
        : Array.isArray(payload.data)
        ? payload.data
        : [];

      const parsed: Agendamento[] = list.map((a: any) => ({
        id: a.id,
        especialidade: a.specialty?.name ?? "Especialidade",
        medico: a.doctor?.name ?? "Médico",
        data: a.date?.split("T")[0]?.split("-").reverse().join("/") ?? "",
        hora: a.time?.slice(0, 5) ?? "",
        status:
          a.status === "soon"
            ? "em_breve"
            : a.status === "confirmed"
            ? "agendada"
            : (a.status as StatusConsulta),
      }));
      setAgendamentos(parsed);
      setLoadingAppointments(false);
    };
    fetchAppointments();
  }, [user]);

  if (loading || allowed === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-600">Carregando...</span>
      </div>
    );
  }

  // cancel & access
  const cancelarConsulta = async (id: string) => {
    if (!confirm("Cancelar esta consulta?")) return;
    const resp = await fetch(`/api/telemedicina/appointments/${id}`, { method: "DELETE" });
    if (!resp.ok) return alert("Falha ao cancelar.");
    setAgendamentos(prev => prev.filter(c => c.id !== id));
  };
  const acessarConsulta = (id: string) => {
    router.push(`/consulta/espera?appointmentId=${id}`);
  };

  const userData = {
    name: user?.displayName ?? "Usuário",
    email: user?.email ?? ""
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={userData} collapsed={collapsed} />
      <div className="flex-1">
        <Header
          user={userData}
          collapsed={collapsed}
          toggleSidebar={() => setCollapsed(!collapsed)}
        />

        <main className="p-6">
          {/* Cashback Card */}
          {user && (
            <div className="mb-8">
              <CashbackCard userId={user.uid} />
            </div>
          )}

          {/* Cards de Consulta Imediata */}
          {rapidocEnabled ? (
            allowedConsults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {allowedConsults.map(opt => (
                  <CardConsulta key={opt.uuid} title={opt.title} uuid={opt.uuid} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-8">Seu plano não inclui consultas imediatas.</p>
            )
          ) : (
            <div className="mb-8">
              <CardConsultaImediata />
            </div>
          )}

          {/* Consultas Agendadas */}
          <div className="mt-12 bg-white rounded-lg border overflow-hidden">
            <div className="bg-blue-600 p-4 text-white">
              <h2 className="text-xl font-semibold">Consultas Agendadas</h2>
              <p className="text-sm opacity-90">Aqui estão suas próximas consultas</p>
            </div>
            <div className="p-4">
              {loadingAppointments ? (
                <p className="text-sm text-gray-500">Carregando consultas…</p>
              ) : agendamentos.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma consulta futura.</p>
              ) : (
                agendamentos.map(c => (
                  <ConsultaCard
                    key={c.id}
                    especialidade={c.especialidade}
                    medico={c.medico}
                    data={c.data}
                    hora={c.hora}
                    status={c.status}
                    onCancel={() => cancelarConsulta(c.id)}
                    onAccess={
                      c.status === "em_breve" ? () => acessarConsulta(c.id) : undefined
                    }
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// New component for immediate consultation when rapidoc is disabled
function CardConsultaImediata() {
  const router = useRouter();
  const [consultaAtiva, setConsultaAtiva] = useState<ConsultaImediata | null>(null);
  const [carregando, setCarregando] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Monitorar consulta ativa do usuário
    if (!user) return;

    const db = getFirestore();
    
    // Monitorar DIRETAMENTE a solicitação na coleção principal
    let unsubscribe1: (() => void) | null = null;
    let unsubscribe2: (() => void) | null = null;

    // Primeiro, monitorar consultas ativas do usuário
    const consultasQuery = query(
      collection(db, "consultas"), 
      where("patientId", "==", user.uid),
      where("status", "in", ["pending", "waiting", "agendada", "active"]),
      limit(1)
    );
    
    unsubscribe1 = onSnapshot(consultasQuery, (snapshot) => {
      if (!snapshot.empty) {
        const localDoc = snapshot.docs[0];
        const localData = { ...localDoc.data(), id: localDoc.id } as ConsultaImediata;
        
        setConsultaAtiva(localData);
        
        // Se há uma consulta ativa, monitorar a solicitação principal
        if (localData.id && !unsubscribe2) {
          console.log('Monitorando solicitação:', localData.id);
          
          unsubscribe2 = onSnapshot(doc(db, "solicitacoes_consulta", localData.id), async (solicitacaoDoc) => {
              if (solicitacaoDoc.exists()) {
                const solicitacaoData = solicitacaoDoc.data();
                console.log('Solicitação atualizada:', solicitacaoData);
                
                // Se médico aceitou (medico_id preenchido) e status ainda é pending
                if (solicitacaoData.medico_id && solicitacaoData.medico_id !== "" && localData.status === 'pending') {
                  console.log('Médico aceitou! Criando videochamada...');
                  
                  // Criar videochamada automaticamente
                  const roomIdFixo = 'room_gM5fyROCIPJ0vF3GtE87';
                  const videochamadaInfo = {
                    roomId: roomIdFixo,
                    videoLink: `/videochamada.html?roomId=${roomIdFixo}&consultaId=${localData.id}&duracao=30`,
                    status: 'waiting' as const,
                    createdAt: new Date(),
                  };

                  try {
                    // Atualizar consulta local
                    await updateDoc(doc(db, "consultas", localData.id), {
                      videochamada: videochamadaInfo,
                      status: 'waiting'
                    });
                    
                    console.log('Videochamada criada com sucesso!');
                    
                    // Atualizar estado local imediatamente
                    setConsultaAtiva({
                      ...localData,
                      status: 'waiting',
                      videochamada: videochamadaInfo
                    });
                    
                  } catch (error) {
                    console.error('Erro ao criar videochamada:', error);
                  }
                }
              }
            });
          }
      } else {
        setConsultaAtiva(null);
        if (unsubscribe2) {
          unsubscribe2();
          unsubscribe2 = null;
        }
      }
    });

    return () => {
      if (unsubscribe1) unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };
  }, [user]);

  const iniciarConsultaImediata = async () => {
    try {
      setCarregando(true);
      if (!user) {
        alert("Usuário não está logado");
        return;
      }

      const db = getFirestore();
      
      // Buscar dados do usuário
      const snapUser = await getDoc(doc(db, "usuarios", user.uid));
      const userData = snapUser.data();

      // Criar solicitação de consulta imediata
      const agora = new Date();
      const novaSolicitacao = {
        medico_id: "", // VAZIO - qualquer médico pode aceitar
        paciente: {
          nome: user.displayName || userData?.nome || "Paciente",
          email: user.email || userData?.email || "",
          telefone: userData?.telefone || "(11) 99999-9999",
          cidade: userData?.cidade || "São Paulo",
          estado: userData?.estado || "SP",
          idade: userData?.idade || 30,
          uid: user.uid
        },
        tipo: "Consulta Online",
        especialidade: "Clínica Médica",
        descricao: "Consulta imediata solicitada pelo paciente",
        data_solicitada: agora,
        hora_preferida: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        urgencia: "alta",
        status: "pendente",
        valor_proposto: 150,
        created_at: serverTimestamp()
      };

      // Adicionar à coleção solicitacoes_consulta
      const docRef = await addDoc(collection(db, 'solicitacoes_consulta'), novaSolicitacao);
      console.log('Solicitação criada com ID:', docRef.id);

      // Criar consulta imediata local para monitoramento  
      const novaConsulta: ConsultaImediata = {
        id: docRef.id,
        patientId: user.uid,
        roomId: 'room_gM5fyROCIPJ0vF3GtE87', // ROOMID FIXO PARA TESTE
        status: 'pending',
        createdAt: new Date(),
        duracao: 30
      };

      await setDoc(doc(db, "consultas", docRef.id), novaConsulta);

    } catch (error) {
      console.error('Erro ao criar consulta:', error);
      alert('Erro ao solicitar consulta imediata');
    } finally {
      setCarregando(false);
    }
  };

  const entrarVideochamada = () => {
    if (!consultaAtiva?.videochamada?.roomId) {
      alert('Videochamada não disponível');
      return;
    }

    // Usar o link da videochamada diretamente
    const videoUrl = consultaAtiva.videochamada.videoLink;
    window.open(videoUrl, '_blank', 'width=1200,height=800');
    
    // Marcar como ativa quando entrar
    const db = getFirestore();
    if (user && consultaAtiva) {
      updateDoc(doc(db, "consultas", consultaAtiva.id), {
        'videochamada.status': 'active',
        status: 'active'
      }).catch(console.error);
    }
  };

  const cancelarConsulta = async () => {
    try {
      if (!user || !consultaAtiva) return;

      const db = getFirestore();
      
      // Verificar se o documento da solicitação existe antes de tentar atualizar
      try {
        const solicitacaoDoc = await getDoc(doc(db, "solicitacoes_consulta", consultaAtiva.id));
        if (solicitacaoDoc.exists()) {
          await updateDoc(doc(db, "solicitacoes_consulta", consultaAtiva.id), {
            status: 'cancelada'
          });
          console.log('Solicitação cancelada na coleção solicitacoes_consulta');
        } else {
          console.log('Documento da solicitação não encontrado:', consultaAtiva.id);
        }
      } catch (solicitacaoError) {
        console.error('Erro ao cancelar solicitação:', solicitacaoError);
      }

      // Cancelar localmente sempre
      await updateDoc(doc(db, "consultas", consultaAtiva.id), {
        status: 'cancelled'
      });

      setConsultaAtiva(null);
      console.log('Consulta cancelada com sucesso');
      
    } catch (error) {
      console.error('Erro ao cancelar consulta:', error);
      // Mesmo com erro, remover da interface
      setConsultaAtiva(null);
    }
  };

  const showStatus = (message: string) => {
    // Implementar notificação/toast se necessário
    console.log(message);
  };

  if (consultaAtiva) {
    // Mostrar card de consulta ativa
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-blue-600 p-4 text-white">
          <h2 className="text-xl font-semibold">Consulta em Andamento</h2>
          <p className="text-sm opacity-90">Status: {getStatusText(consultaAtiva.status)}</p>
        </div>
        <div className="p-6 flex flex-col items-center">
          <div className="bg-blue-100 p-3 rounded-full mb-4">
            <Phone className="h-8 w-8 text-blue-600" />
          </div>
          
          {consultaAtiva.status === 'pending' && (
            <>
              <p className="text-gray-600 text-sm text-center mb-4">
                Procurando médico disponível...
              </p>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center"
                onClick={cancelarConsulta}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Procura
              </Button>
            </>
          )}
          
          {(consultaAtiva.status === 'waiting' || consultaAtiva.status === 'agendada') && (
            <>
              <p className="text-gray-600 text-sm text-center mb-4">
                🎉 Médico encontrado! Clique para entrar na videochamada
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center animate-pulse"
                onClick={entrarVideochamada}
              >
                <Phone className="h-4 w-4 mr-2" />
                Entrar na Consulta
              </Button>
            </>
          )}
          
          {consultaAtiva.status === 'active' && (
            <>
              <p className="text-gray-600 text-sm text-center mb-4">
                Consulta ativa! Clique para voltar à videochamada
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                onClick={entrarVideochamada}
              >
                <Phone className="h-4 w-4 mr-2" />
                Voltar à Consulta
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Card para iniciar consulta imediata
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="bg-emerald-600 p-4 text-white">
        <h2 className="text-xl font-semibold">Consulta Imediata</h2>
        <p className="text-sm opacity-90">Conecte-se agora com qualquer médico disponível</p>
      </div>
      <div className="p-6 flex flex-col items-center">
        <div className="bg-emerald-100 p-3 rounded-full mb-4">
          <Phone className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="text-gray-600 text-sm text-center mb-4">
          Clique no botão e aguarde um médico aceitar sua solicitação
        </p>
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center"
          onClick={iniciarConsultaImediata}
          disabled={carregando}
        >
          <Phone className="h-4 w-4 mr-2" />
          {carregando ? 'Solicitando...' : 'Iniciar Consulta Imediata'}
        </Button>
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending': return 'Aguardando médico';
    case 'waiting': return 'Médico aguardando';
    case 'agendada': return 'Médico aceitou';
    case 'active': return 'Consulta ativa';
    case 'completed': return 'Finalizada';
    case 'realizada': return 'Realizada';
    case 'cancelled': return 'Cancelada';
    default: return 'Desconhecido';
  }
}

// helper component
function CardConsulta({ title, uuid }: { title: string; uuid: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const iniciar = async () => {
    if (!user) return alert("Usuário não está logado");
  
    const db = getFirestore();
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    const beneficiaryUuid = snap.data()?.beneficiaryUuid;
  
    if (!beneficiaryUuid) return alert("beneficiaryUuid não encontrado");
  
    try {
      const resp = await fetch(`/api/telemedicina/appointments/instant?beneficiaryUuid=${beneficiaryUuid}`);
      const data = await resp.json();
  
      if (!resp.ok || !data.url) {
        console.error("Erro:", data);
        return alert("Erro ao iniciar consulta");
      }
  
      // Redireciona para o link de entrada na chamada
      window.location.href = data.url;
    } catch (err) {
      console.error("Erro na requisição:", err);
      alert("Erro interno");
    }
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden mb-8">
      <div className="bg-green-600 p-4 text-white">
        <h2 className="text-xl font-semibold">Consulta Imediata</h2>
        <p className="text-sm opacity-90">{title}</p>
      </div>
      <div className="p-6 flex flex-col items-center">
        <div className="bg-green-100 p-3 rounded-full mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
          onClick={iniciar}
        >
          <Phone className="h-4 w-4 mr-2" />
          Iniciar {title}
        </Button>
      </div>
    </div>
  );
}
