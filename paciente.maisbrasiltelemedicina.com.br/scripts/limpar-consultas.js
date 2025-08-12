// Script para limpar consultas do banco de dados
// Execute com: node scripts/limpar-consultas.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC-rbGbbckRLOavCjg9t-cQK8oUk-K9338",
  authDomain: "maisbrasiltelemedicina-69285.firebaseapp.com",
  projectId: "maisbrasiltelemedicina-69285",
  storageBucket: "maisbrasiltelemedicina-69285.firebasestorage.app",
  messagingSenderId: "425942173209",
  appId: "1:425942173209:web:14bcc35573513539698c88"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function limparColecao(nomeColecao) {
  try {
    console.log(`\nLimpando coleção: ${nomeColecao}`);
    const querySnapshot = await getDocs(collection(db, nomeColecao));
    
    let contador = 0;
    const deletePromises = [];
    
    querySnapshot.forEach((documento) => {
      deletePromises.push(deleteDoc(doc(db, nomeColecao, documento.id)));
      contador++;
    });
    
    await Promise.all(deletePromises);
    console.log(`✅ ${contador} documentos excluídos de ${nomeColecao}`);
    
  } catch (error) {
    console.error(`❌ Erro ao limpar ${nomeColecao}:`, error.message);
  }
}

async function executarLimpeza() {
  console.log('🧹 Iniciando limpeza do banco de dados...\n');
  
  try {
    // Lista de coleções para limpar
    const colecoes = [
      'solicitacoes_consulta',
      'consultas_imediatas',
      'consultas',
      'appointments',
      'videochamadas'
    ];
    
    for (const colecao of colecoes) {
      await limparColecao(colecao);
    }
    
    console.log('\n✨ Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
  
  process.exit(0);
}

// Executar o script
console.log('===============================================');
console.log('   SCRIPT DE LIMPEZA DE CONSULTAS');
console.log('===============================================');

// Se quiser autenticar primeiro (opcional)
// await signInWithEmailAndPassword(auth, 'seu-email@example.com', 'sua-senha');

executarLimpeza();