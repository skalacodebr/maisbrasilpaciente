import { NextResponse } from "next/server"
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore"

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
const app = initializeApp(firebaseConfig, "auth-create-instance")
const authInstance = getAuth(app)
const dbInstance = getFirestore(app)

export async function POST(request: Request) {
  try {
    console.log("[CREATE-USER] Iniciando processo de criação de dependente")
    const data = await request.json()
    const { nome, email, whatsapp, cpf, cep, endereco, estado, cidade } = data

    if (!email || !cpf || !nome) {
      console.log("[CREATE-USER] Erro: Dados obrigatórios não fornecidos")
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    console.log(`[CREATE-USER] Dados recebidos: Email=${email}, Nome=${nome}, CPF=${cpf}`)

    // Extrair senha dos últimos 6 dígitos do CPF
    const senha = extrairSenhaDoCpf(cpf)
    console.log(`[CREATE-USER] Senha extraída do CPF: ${senha}`)

    try {
      // Criar usuário no Firebase Authentication
      console.log(`[CREATE-USER] Criando usuário no Authentication: ${email}`)
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, senha)
      const dependenteId = userCredential.user.uid
      console.log(`[CREATE-USER] Usuário criado com sucesso no Authentication: ${dependenteId}`)

      // Limpar dados para salvar no Firestore
      const cpfLimpo = cpf.replace(/[^\d]/g, "")
      const whatsappLimpo = whatsapp.replace(/[^\d]/g, "")
      const cepLimpo = cep.replace(/[^\d]/g, "")

      // Salvar dados do usuário no Firestore
      console.log(`[CREATE-USER] Salvando dados do usuário no Firestore: ${dependenteId}`)
      await setDoc(doc(dbInstance, "usuarios", dependenteId), {
        nome,
        email,
        whatsapp: whatsappLimpo,
        cpf: cpfLimpo,
        cep: cepLimpo,
        endereco,
        estado,
        cidade,
        dataCadastro: serverTimestamp(),
        tipo: "dependente",
      })
      console.log(`[CREATE-USER] Dados do usuário salvos com sucesso no Firestore`)

      return NextResponse.json({
        success: true,
        message: "Dependente criado com sucesso",
        dependenteId,
      })
    } catch (authError: any) {
      console.error(`[CREATE-USER] Erro ao criar usuário: ${authError.code} - ${authError.message}`)

      return NextResponse.json(
        {
          success: false,
          error: authError.code,
          errorMessage: authError.message,
        },
        { status: 400 },
      )
    }
  } catch (error: any) {
    console.error("[CREATE-USER] Erro na API de criação:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar criação",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
