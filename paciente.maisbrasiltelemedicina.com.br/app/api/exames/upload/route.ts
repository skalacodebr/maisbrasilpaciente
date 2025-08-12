import { NextResponse } from "next/server"
import { db, storage } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytesResumable } from "firebase/storage"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const arquivo = formData.get("arquivo") as File
    const titulo = formData.get("titulo") as string
    const consultaId = formData.get("consultaId") as string
    const medicoId = formData.get("medicoId") as string
    const pacienteNome = formData.get("pacienteNome") as string
    const pacienteId = formData.get("pacienteId") as string

    if (!arquivo || !titulo || !consultaId || !medicoId || !pacienteNome || !pacienteId) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    console.log("[SERVER] Iniciando upload para:", `exames/${pacienteId}/${Date.now()}_${arquivo.name}`)

    // Converter o arquivo para um array de bytes
    const bytes = await arquivo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Criar um nome de arquivo único
      const timestamp = Date.now()
      const nomeArquivo = `${timestamp}_${arquivo.name}`
      const caminhoArquivo = `exames/${pacienteId}/${nomeArquivo}`
      const storageRef = ref(storage, caminhoArquivo)

      // Metadados para o arquivo
      const metadata = {
        contentType: "application/pdf",
        customMetadata: {
          uploadedBy: pacienteId,
          titulo: titulo,
          originalName: arquivo.name,
          timestamp: timestamp.toString(),
          consultaId: consultaId,
          medicoId: medicoId,
        },
      }

      // Upload do arquivo
      console.log("[SERVER] Iniciando upload com metadados:", metadata)
      await uploadBytesResumable(storageRef, buffer, metadata)
      console.log("[SERVER] Upload concluído com sucesso")

      // Construir URL manualmente (já que getDownloadURL está falhando)
      const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/${encodeURIComponent(caminhoArquivo)}?alt=media`
      console.log("[SERVER] URL construída manualmente:", downloadURL)

      // Salvar metadados no Firestore
      const docRef = await addDoc(collection(db, "exames"), {
        usuario_id: pacienteId,
        consulta_id: consultaId,
        medico_id: medicoId,
        titulo: titulo,
        nome_arquivo: arquivo.name,
        url: downloadURL,
        tamanho: arquivo.size,
        caminho_storage: caminhoArquivo,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        timestamp_upload: timestamp,
        status: "enviado",
        paciente_nome: pacienteNome,
      })

      console.log("[SERVER] Exame salvo no Firestore com ID:", docRef.id)

      // Enviar email para o médico usando Nodemailer com configuração direta
      let emailEnviado = false
      try {
        // Email do médico (em produção, seria buscado do banco de dados)
        const emailMedico = `medico${medicoId}@maisbrasiltelemedicina.com.br`
        console.log("[SERVER] Preparando para enviar email para:", emailMedico)

        // Configurar o transporte do Nodemailer com timeout aumentado
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false, // true para 465, false para outras portas
          auth: {
            user: "SuporteMaisbrasilTelemedicina@gmail.com",
            pass: "nnno fzjy upmc iwfh",
          },
          connectionTimeout: 10000, // 10 segundos
          greetingTimeout: 10000,
          socketTimeout: 10000,
          // Desativar a verificação de DNS para evitar problemas no ambiente serverless
          tls: {
            rejectUnauthorized: false,
          },
        })

        // Configurar o email
        const mailOptions = {
          from: '"MaisBrasil Telemedicina" <SuporteMaisbrasilTelemedicina@gmail.com>',
          to: emailMedico,
          subject: `Novo exame enviado pelo paciente ${pacienteNome}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2e7d32;">MaisBrasil Telemedicina</h2>
              </div>
              
              <p>Olá Dr(a),</p>
              
              <p>O paciente <strong>${pacienteNome}</strong> enviou um novo exame para sua análise.</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Título do exame:</strong> ${titulo}</p>
                <p><strong>Data de envio:</strong> ${new Date().toLocaleDateString("pt-BR")}</p>
              </div>
              
              <p>Você pode acessar o exame através do link abaixo:</p>
              
              <div style="text-align: center; margin: 25px 0;">
                <a href="${downloadURL}" style="background-color: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Visualizar Exame</a>
              </div>
              
              <p>Atenciosamente,</p>
              <p>Equipe MaisBrasil Telemedicina</p>
            </div>
          `,
        }

        // Enviar o email
        const info = await transporter.sendMail(mailOptions)
        console.log("[SERVER] Email enviado com sucesso:", info.messageId)
        emailEnviado = true

        // Atualizar o documento para indicar que o email foi enviado
        await updateDoc(doc(db, "exames", docRef.id), {
          email_enviado: true,
          email_enviado_em: serverTimestamp(),
        })
      } catch (emailError) {
        console.error("[SERVER] Erro ao enviar email:", emailError)
        // Não interrompemos o fluxo se o email falhar
      }

      return NextResponse.json({
        success: true,
        id: docRef.id,
        url: downloadURL,
        caminho_storage: caminhoArquivo,
        email_enviado: emailEnviado,
      })
    } catch (uploadError: any) {
      console.error("[SERVER] Erro específico durante o upload:", uploadError)
      throw new Error(`Erro durante o upload: ${uploadError.message}`)
    }
  } catch (error: any) {
    console.error("[SERVER] Erro ao fazer upload:", error)

    return NextResponse.json({ error: "Erro ao fazer upload do exame", details: error.message }, { status: 500 })
  }
}
