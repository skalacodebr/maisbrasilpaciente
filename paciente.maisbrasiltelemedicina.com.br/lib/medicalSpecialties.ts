export interface MedicalSpecialty {
  id: string
  name: string
  description: string
  uuid?: string
  available: boolean
}

export const MEDICAL_SPECIALTIES: Record<string, MedicalSpecialty> = {
  GENERAL: {
    id: "general",
    name: "Clínica Geral",
    description: "Consultas gerais e acompanhamento médico",
    uuid: process.env.NEXT_PUBLIC_RAPIDOC_GENERAL_SPECIALTY_UUID,
    available: true,
  },
  PSYCHOLOGY: {
    id: "psychology",
    name: "Psicologia",
    description: "Acompanhamento psicológico e terapia",
    uuid: process.env.NEXT_PUBLIC_RAPIDOC_PSYCHOLOGY_SPECIALTY_UUID,
    available: true,
  },
  NUTRITION: {
    id: "nutrition",
    name: "Nutrição",
    description: "Orientação nutricional e planejamento alimentar",
    uuid: process.env.NEXT_PUBLIC_RAPIDOC_NUTRITION_SPECIALTY_UUID,
    available: true,
  },
  CARDIOLOGY: {
    id: "cardiology",
    name: "Cardiologia",
    description: "Especialista em doenças do coração",
    available: false,
  },
  DERMATOLOGY: {
    id: "dermatology",
    name: "Dermatologia",
    description: "Cuidados com a pele",
    available: false,
  },
  PEDIATRICS: {
    id: "pediatrics",
    name: "Pediatria",
    description: "Cuidados médicos para crianças",
    available: false,
  },
}

export const getAvailableSpecialties = (): MedicalSpecialty[] => {
  return Object.values(MEDICAL_SPECIALTIES).filter(specialty => specialty.available)
}

export const getSpecialtyByUuid = (uuid: string): MedicalSpecialty | undefined => {
  return Object.values(MEDICAL_SPECIALTIES).find(specialty => specialty.uuid === uuid)
}

export const getSpecialtyById = (id: string): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES[id.toUpperCase()]
}