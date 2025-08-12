// Interface para informações de videochamada
export interface VideochamadaInfo {
  roomId: string;
  videoLink: string;
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

// Interface principal para consulta
export interface Consulta {
  id: string;
  especialidade: string;
  medico: string;
  data: string;
  hora: string;
  status: 'agendada' | 'em_breve' | 'concluida' | 'cancelada';
  duracao?: number; // em minutos
  videochamada?: VideochamadaInfo;
}

// Interface para consulta imediata
export interface ConsultaImediata {
  id: string;
  patientId: string;
  roomId: string;
  status: 'pending' | 'waiting' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  videochamada?: VideochamadaInfo;
  duracao: number; // em minutos
}