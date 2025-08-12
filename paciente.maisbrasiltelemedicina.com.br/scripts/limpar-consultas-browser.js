// SCRIPT PARA EXECUTAR NO CONSOLE DO NAVEGADOR
// Cole este código no console do navegador enquanto estiver na aplicação

async function limparConsultas() {
  const { getFirestore, collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
  const db = getFirestore();
  
  async function limparColecao(nomeColecao) {
    try {
      console.log(`Limpando ${nomeColecao}...`);
      const querySnapshot = await getDocs(collection(db, nomeColecao));
      
      let contador = 0;
      for (const documento of querySnapshot.docs) {
        await deleteDoc(doc(db, nomeColecao, documento.id));
        console.log(`  Excluído: ${documento.id}`);
        contador++;
      }
      
      console.log(`✅ ${contador} documentos excluídos de ${nomeColecao}\n`);
      return contador;
      
    } catch (error) {
      console.error(`❌ Erro ao limpar ${nomeColecao}:`, error.message);
      return 0;
    }
  }
  
  console.log('🧹 INICIANDO LIMPEZA DO BANCO DE DADOS\n');
  
  let totalExcluido = 0;
  
  // Limpar cada coleção
  totalExcluido += await limparColecao('solicitacoes_consulta');
  totalExcluido += await limparColecao('consultas_imediatas');
  totalExcluido += await limparColecao('consultas');
  totalExcluido += await limparColecao('appointments');
  totalExcluido += await limparColecao('videochamadas');
  
  console.log(`\n✨ LIMPEZA CONCLUÍDA!`);
  console.log(`📊 Total de documentos excluídos: ${totalExcluido}`);
}

// Executar a função
limparConsultas();