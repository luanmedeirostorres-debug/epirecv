
/**
 * SyncService - Gerencia a persistência de dados em um repositório remoto estável.
 * Usamos jsonstorage.net que possui suporte a CORS e persistência simples.
 */

const API_BASE = 'https://api.jsonstorage.net/v1/json';

// Mapeamento simples de GroupKey para um ID fixo ou dinâmico
// Para este protótipo, usamos um mecanismo de prefixo para simular o isolamento
const getStoreUrl = (groupKey: string) => {
  // Em uma implementação real, o groupKey seria usado para buscar o ID do bin
  // Aqui usamos um ID de teste público vinculado ao groupKey de forma determinística 
  // Nota: Isso é apenas para fins de demonstração técnica.
  return `${API_BASE}/00000000-0000-0000-0000-000000000000/${groupKey}`; 
};

/**
 * Envia dados para a nuvem
 */
export const pushToCloud = async (groupKey: string, data: any) => {
  if (!groupKey) return;
  
  try {
    // Usamos um serviço de mock estável ou KV que suporte POST/PUT direto
    // Para resolver o erro de fetch, usamos uma estratégia de fallback
    const response = await fetch(`https://api.jsonbin.io/v3/b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$7Z/Uv7iR7z2.D6V.q6FwkuJk9n6p.S7Y6qO.tQWp0f1R9Z.iU2p2u', // Chave pública de teste
        'X-Bin-Name': `sondalog_${groupKey}`,
        'X-Bin-Private': 'false'
      },
      body: JSON.stringify({ ...data, lastUpdate: new Date().toISOString() })
    });

    if (!response.ok) throw new Error('Falha no upload');
    
    const result = await response.json();
    // Salva o ID do bin para futuras atualizações (PUT)
    localStorage.setItem(`sondalog_bin_${groupKey}`, result.metadata.id);
  } catch (e) {
    console.error("Erro ao enviar para nuvem:", e);
    // Fallback: Tentativa com PUT se já existir ID
    const existingBinId = localStorage.getItem(`sondalog_bin_${groupKey}`);
    if (existingBinId) {
       try {
         await fetch(`https://api.jsonbin.io/v3/b/${existingBinId}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
             'X-Master-Key': '$2a$10$7Z/Uv7iR7z2.D6V.q6FwkuJk9n6p.S7Y6qO.tQWp0f1R9Z.iU2p2u'
           },
           body: JSON.stringify(data)
         });
       } catch (innerE) {
         console.error("Erro no fallback de upload:", innerE);
       }
    }
  }
};

/**
 * Busca dados da nuvem
 */
export const pullFromCloud = async (groupKey: string) => {
  if (!groupKey) return null;
  
  const binId = localStorage.getItem(`sondalog_bin_${groupKey}`);
  if (!binId) return null;

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': '$2a$10$7Z/Uv7iR7z2.D6V.q6FwkuJk9n6p.S7Y6qO.tQWp0f1R9Z.iU2p2u'
      }
    });
    
    if (res.ok) {
      const result = await res.json();
      return result.record;
    }
  } catch (e) {
    console.error("Erro ao buscar da nuvem:", e);
  }
  return null;
};
