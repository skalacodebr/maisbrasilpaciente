import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithEmailAndPassword, deleteUser } from "firebase/auth"

// Configuração do Firebase para uso exclusivo desta API
const firebaseConfig = {
  apiKey: "AIzaSyC-rbGbbckRLOavCjg9t-cQK8oUk-K9338",
  authDomain: "maisbrasiltelemedicina-69285.firebaseapp.com",
  projectId: "maisbrasiltelemedicina-69285",
  storageBucket: "maisbrasiltelemedicina-69285.appspot.com",
  messagingSenderId: "425942173209",
  appId: "1:425942173209:web:14bcc35573513539698c88",
  measurementId: "G-G4K7LG5PKD",
}

// Função para extrair os últimos 6 dígitos do CPF como senha
const extrairSenhaDoCpf = (cpf: string): string => {
  const cpfLimpo = cpf.replace(/[^\d]/g, "")
  return cpfLimpo.slice(-6)
}

// Inicializa uma instância separada do Firebase para não interferir na autenticação do usuário atual
const app = initializeApp(firebaseConfig, "auth-delete-instance")
const authInstance = getAuth(app)

export async function POST(request: Request) {
  try {
    console.log("[AUTH-DELETE] Iniciando processo de exclusão de usuário do Authentication")
    const data = await request.json()
    const { email, userId, cpf } = data

    if (!email) {
      console.log("[AUTH-DELETE] Erro: Email do dependente não fornecido")
      return NextResponse.json({ error: "Email do dependente é obrigatório" }, { status: 400 })
    }

    console.log(`[AUTH-DELETE] Dados recebidos: Email=${email}, UserID=${userId}, CPF=${cpf || "não fornecido"}`)

    // Extrair senha dos últimos 6 dígitos do CPF
    let senha = ""
    if (cpf) {
      senha = extrairSenhaDoCpf(cpf)
      console.log(`[AUTH-DELETE] Senha extraída do CPF: ${senha} (CPF: ${cpf})`)
    } else {
      // Fallback para os últimos 6 dígitos do userId
      senha = userId.substring(userId.length - 6)
      console.log(`[AUTH-DELETE] Senha extraída do UserID (fallback): ${senha}`)
    }

    try {
      // Tentar fazer login com o usuário a ser excluído
      console.log(`[AUTH-DELETE] Tentando login com email: ${email} e senha: ${senha}`)
      const userCredential = await signInWithEmailAndPassword(authInstance, email, senha)
      console.log(`[AUTH-DELETE] Login bem-sucedido para o usuário: ${userCredential.user.uid}`)

      // Excluir o usuário
      console.log(`[AUTH-DELETE] Excluindo usuário do Authentication: ${userCredential.user.uid}`)
      await deleteUser(userCredential.user)
      console.log(`[AUTH-DELETE] Usuário excluído com sucesso do Authentication`)

      return NextResponse.json({
        success: true,
        message: "Usuário excluído do Authentication com sucesso",
      })
    } catch (authError: any) {
      console.error(`[AUTH-DELETE] Erro ao excluir usuário do Authentication: ${authError.code} - ${authError.message}`)
      console.log(`[AUTH-DELETE] Detalhes do erro:`, authError)

      // Tentar com diferentes variações de senha para debug
      if (authError.code === "auth/wrong-password" && cpf) {
        console.log(`[AUTH-DELETE] Tentando variações de senha para debug:`)

        // Variação 1: CPF completo
        console.log(`[AUTH-DELETE] - CPF completo: ${cpf}`)

        // Variação 2: CPF sem formatação
        const cpfSemFormatacao = cpf.replace(/[^\d]/g, "")
        console.log(`[AUTH-DELETE] - CPF sem formatação: ${cpfSemFormatacao}`)

        // Variação 3: Últimos 6 dígitos do CPF sem formatação
        const ultimos6Digitos = cpfSemFormatacao.slice(-6)
        console.log(`[AUTH-DELETE] - Últimos 6 dígitos do CPF: ${ultimos6Digitos}`)

        // Variação 4: Primeiros 6 dígitos do CPF
        const primeiros6Digitos = cpfSemFormatacao.slice(0, 6)
        console.log(`[AUTH-DELETE] - Primeiros 6 dígitos do CPF: ${primeiros6Digitos}`)
      }

      // Mesmo que falhe, retornamos informações detalhadas para debug
      return NextResponse.json({
        success: false,
        message: "Não foi possível excluir o usuário do Authentication, mas os dados foram removidos do Firestore",
        error: authError.code,
        errorMessage: authError.message,
        debug: {
          email,
          userId,
          cpf: cpf || "não fornecido",
          senhaUsada: senha,
        },
      })
    }
  } catch (error: any) {
    console.error("[AUTH-DELETE] Erro na API de exclusão:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar exclusão",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
