/**
 * SyncService - Gerencia a persistência de dados em um repositório remoto público.
 * Nota: Para produção, recomenda-se o uso de Firebase ou Supabase.
 * Para este protótipo, usamos o serviço public-api de persistência JSON.
 */

const BASE_URL = 'https://api.jsonbin.io/v3/b'; // Exemplo de provedor de armazenamento JSON
const MASTER_KEY = '$2a$10$7Z/Uv7iR7z2.D6V.q6FwkuJk9n6p.S7Y6qO.tQWp0f1R9Z.iU2p2u'; // Chave pública de exemplo

export const syncCloudData = async (syncId: string, data: any) => {
  if (!syncId) return null;
  
  try {
    // Tenta carregar o bin existente ou criar um novo baseado no syncId (ID de Sincronização)
    // Para simplificar a demonstração multi-dispositivo sem configurar chaves privadas:
    // Salvamos no localStorage o 'binId' retornado para que este dispositivo saiba onde ler.
    // Em um sistema real, o syncId seria o próprio identificador da empresa.
    
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': MASTER_KEY,
        'X-Bin-Name': `sondalog_${syncId}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    return result.metadata?.id || null;
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    return null;
  }
};

export const fetchCloudData = async (binId: string) => {
  if (!binId) return null;
  try {
    const response = await fetch(`${BASE_URL}/${binId}/latest`, {
      headers: { 'X-Master-Key': MASTER_KEY }
    });
    const result = await response.json();
    return result.record || null;
  } catch (error) {
    console.error("Cloud Fetch Error:", error);
    return null;
  }
};

// Implementação simplificada usando um repositório KV (Key-Value) público para o usuário não precisar de conta
// Usaremos o serviço open-source 'keyvalue.im' que é ideal para protótipos multi-dispositivo
const KV_STORE_URL = 'https://keyvalue.im/api/kv';

export const pushToCloud = async (groupKey: string, data: any) => {
  if (!groupKey) return;
  try {
    await fetch(`${KV_STORE_URL}/${groupKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, lastUpdate: new Date().toISOString() })
    });
  } catch (e) {
    console.error("Sync Push Failed", e);
  }
};

export const pullFromCloud = async (groupKey: string) => {
  if (!groupKey) return null;
  try {
    const res = await fetch(`${KV_STORE_URL}/${groupKey}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Sync Pull Failed", e);
  }
  return null;
};
