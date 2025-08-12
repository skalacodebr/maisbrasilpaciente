// Função para formatar CPF
export const formatarCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

// Função para formatar telefone
export const formatarTelefone = (telefone: string) => {
  return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
}

// Função para formatar data
export const formatarData = (timestamp: any) => {
  if (!timestamp) return "Data não disponível"

  try {
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(data)
  } catch (error) {
    console.error("Erro ao formatar data:", error)
    return "Data inválida"
  }
}

// Função para formatar moeda
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
