// Módulo de Armazenamento Offline e Sincronização
const Storage = (function () {
    const DB_NAME = 'roleta_db';
    const DB_VERSION = 1;
    const STORE_LEADS = 'leads';
    const STORE_BENEFICIOS = 'beneficios';

    let dbInstance = null;
    let isSyncing = false;

    // Inicialização do IndexedDB
    function getDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_LEADS)) {
                    const leadsStore = db.createObjectStore(STORE_LEADS, { keyPath: 'id' });
                    leadsStore.createIndex('sincronizado', 'sincronizado', { unique: false });
                    leadsStore.createIndex('timestamp_local', 'timestamp_local', { unique: false });
                }
                if (!db.objectStoreNames.contains(STORE_BENEFICIOS)) {
                    db.createObjectStore(STORE_BENEFICIOS, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.error("Erro ao abrir IndexedDB:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Salvar Lead localmente
    async function salvarLead(leadData) {
        const db = await getDB();
        const lead = {
            id: leadData.id || (crypto.randomUUID ? crypto.randomUUID() : 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
            nome: leadData.nome.trim(),
            telefone: leadData.telefone.trim(),
            cpf: leadData.cpf ? leadData.cpf.trim() : null,
            consentimento: Boolean(leadData.consentimento),
            operador_id: leadData.operador_id || 'DEFAULT',
            beneficio_sorteado: leadData.beneficio_sorteado || null,
            timestamp_local: leadData.timestamp_local || new Date().toISOString(),
            sincronizado: false
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_LEADS], 'readwrite');
            const store = tx.objectStore(STORE_LEADS);
            const req = store.put(lead);

            req.onsuccess = () => {
                emitSyncStatus();
                // Tenta sincronizar imediatamente se estiver online
                if (navigator.onLine) {
                    sincronizarPendentes();
                }
                resolve(lead);
            };

            req.onerror = (e) => reject(e.target.error);
        });
    }

    // Atualizar Lead (ex: após giro com o benefício sorteado)
    async function atualizarLead(id, patch) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_LEADS], 'readwrite');
            const store = tx.objectStore(STORE_LEADS);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const lead = getReq.result;
                if (!lead) return reject(new Error("Lead não encontrado"));
                Object.assign(lead, patch);
                const putReq = store.put(lead);
                putReq.onsuccess = () => {
                    emitSyncStatus();
                    if (navigator.onLine) {
                        sincronizarPendentes();
                    }
                    resolve(lead);
                };
                putReq.onerror = (e) => reject(e.target.error);
            };
            getReq.onerror = (e) => reject(e.target.error);
        });
    }

    // Listar todos os leads
    async function listarLeads() {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_LEADS], 'readonly');
            const store = tx.objectStore(STORE_LEADS);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    // Listar leads pendentes de sincronização
    async function listarPendentes() {
        const leads = await listarLeads();
        return leads.filter(l => !l.sincronizado);
    }

    // Marcar lead como sincronizado
    async function marcarSincronizado(id) {
        return atualizarLead(id, { sincronizado: true });
    }

    // Gerenciamento de Benefícios
    async function salvarBeneficios(lista) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_BENEFICIOS], 'readwrite');
            const store = tx.objectStore(STORE_BENEFICIOS);
            store.clear();
            lista.forEach(b => store.put(b));
            tx.oncomplete = () => {
                window.dispatchEvent(new CustomEvent('beneficios-atualizados', { detail: lista }));
                resolve(lista);
            };
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function listarBeneficios() {
        try {
            const db = await getDB();
            const beneficios = await new Promise((resolve, reject) => {
                const tx = db.transaction([STORE_BENEFICIOS], 'readonly');
                const store = tx.objectStore(STORE_BENEFICIOS);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = (e) => reject(e.target.error);
            });

            if (beneficios && beneficios.length > 0) {
                return beneficios.filter(b => b.ativo !== false);
            }
        } catch (e) {
            console.warn("Falha ao ler benefícios locais, usando fallback padrão:", e);
        }

        // Se vazio, salva os benefícios padrão do CONFIG
        if (typeof CONFIG !== 'undefined' && CONFIG.BENEFICIOS_DEFAULT) {
            await salvarBeneficios(CONFIG.BENEFICIOS_DEFAULT);
            return CONFIG.BENEFICIOS_DEFAULT;
        }
        return [];
    }

    // Emissão de evento de status de sincronização
    async function emitSyncStatus() {
        try {
            const pendentes = await listarPendentes();
            const event = new CustomEvent('sync-status', {
                detail: {
                    pendentes: pendentes.length,
                    sincronizando: isSyncing,
                    online: navigator.onLine,
                    ultimoSync: localStorage.getItem('ultimo_sync_ts') || null
                }
            });
            window.dispatchEvent(event);
        } catch (e) {
            console.error("Erro ao emitir status de sync:", e);
        }
    }

    // Sincronização Serial com Supabase
    async function sincronizarPendentes() {
        if (isSyncing || !navigator.onLine) return;
        if (typeof CONFIG === 'undefined' || !CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('xyzcompany')) {
            console.info("Supabase não configurado ou configurado com URL dummy. Sync em modo simulação local.");
            emitSyncStatus();
            return;
        }

        isSyncing = true;
        emitSyncStatus();

        try {
            const pendentes = await listarPendentes();
            for (const lead of pendentes) {
                try {
                    const payload = {
                        id: lead.id,
                        nome: lead.nome,
                        telefone: lead.telefone,
                        cpf: lead.cpf,
                        consentimento: lead.consentimento,
                        operador_id: lead.operador_id,
                        beneficio_sorteado: lead.beneficio_sorteado,
                        timestamp_local: lead.timestamp_local
                    };

                    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/leads`, {
                        method: 'POST',
                        headers: {
                            'apikey': CONFIG.SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify(payload)
                    });

                    // 201 Created ou 409 Conflict (já cadastrado)
                    if (response.ok || response.status === 409) {
                        await marcarSincronizado(lead.id);
                    } else {
                        console.warn(`Erro ao sincronizar lead ${lead.id}: HTTP ${response.status}`);
                    }
                } catch (netErr) {
                    console.warn(`Erro de rede ao sincronizar lead ${lead.id}:`, netErr);
                    break; // Interrompe para retentar quando conexão estabilizar
                }
            }

            localStorage.setItem('ultimo_sync_ts', new Date().toISOString());
        } catch (err) {
            console.error("Falha geral no processo de sync:", err);
        } finally {
            isSyncing = false;
            emitSyncStatus();
        }
    }

    // Listeners de conectividade
    window.addEventListener('online', () => {
        emitSyncStatus();
        sincronizarPendentes();
    });

    window.addEventListener('offline', () => {
        emitSyncStatus();
    });

    document.addEventListener('DOMContentLoaded', () => {
        emitSyncStatus();
        if (navigator.onLine) {
            sincronizarPendentes();
        }
    });

    return {
        getDB,
        salvarLead,
        atualizarLead,
        listarLeads,
        listarPendentes,
        salvarBeneficios,
        listarBeneficios,
        sincronizarPendentes,
        emitSyncStatus
    };
})();
