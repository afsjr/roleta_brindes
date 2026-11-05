const Storage = (function () {
    'use strict';

    const DB_NAME = 'roleta_beneficios_db';
    const DB_VERSION = 1;
    const STORE_LEADS = 'leads';
    const STORE_BENEFICIOS = 'beneficios';
    const FALLBACK_LEADS_KEY = 'roleta_fallback_leads';
    const CACHE_BENEFICIOS_KEY = 'roleta_beneficios_cache_v2';
    const SEED_KEY = 'roleta_beneficios_seeded_v1';
    const ULTIMO_SYNC_KEY = 'ultimo_sync_ts';

    let dbInstance = null;
    let isSyncing = false;
    let syncSolicitado = false;
    let ultimoErroSync = null;

    function configurado() {
        return Utils.supabaseConfigurado(typeof CONFIG !== 'undefined' ? CONFIG : null);
    }

    function baseHeaders() {
        return {
            apikey: CONFIG.SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + CONFIG.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        };
    }

    function getDB() {
        if (dbInstance) return Promise.resolve(dbInstance);

        return new Promise(function (resolve) {
            if (!('indexedDB' in window)) {
                console.warn('IndexedDB indisponível. Usando localStorage como fallback.');
                resolve(null);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
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

            request.onsuccess = function (event) {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = function (event) {
                console.error('Erro ao inicializar IndexedDB:', event.target.error);
                resolve(null);
            };
        });
    }

    function lerFallbackLeads() {
        try {
            const dados = JSON.parse(localStorage.getItem(FALLBACK_LEADS_KEY) || '[]');
            return Array.isArray(dados) ? dados : [];
        } catch (e) {
            return [];
        }
    }

    function normalizarLead(lead) {
        const sincronizadoAntigo = Boolean(lead.sincronizado);
        const remotoCriado = lead.remoto_criado !== undefined
            ? Boolean(lead.remoto_criado)
            : sincronizadoAntigo;
        const premioSincronizado = lead.premio_sincronizado !== undefined
            ? Boolean(lead.premio_sincronizado)
            : (sincronizadoAntigo && Boolean(lead.beneficio_sorteado));
        const sincronizado = remotoCriado && (!lead.beneficio_sorteado || premioSincronizado);

        return Object.assign({}, lead, {
            remoto_criado: remotoCriado,
            premio_sincronizado: premioSincronizado,
            sincronizado: sincronizado,
            status: lead.status || (lead.beneficio_sorteado ? 'completo' : 'pendente_giro')
        });
    }

    async function putLead(lead) {
        const db = await getDB();
        if (db) {
            await new Promise(function (resolve, reject) {
                const tx = db.transaction([STORE_LEADS], 'readwrite');
                const store = tx.objectStore(STORE_LEADS);
                const req = store.put(lead);
                req.onsuccess = function () { resolve(); };
                req.onerror = function (event) { reject(event.target.error); };
            });
            return lead;
        }

        const leads = lerFallbackLeads();
        const idx = leads.findIndex(function (item) { return item.id === lead.id; });
        if (idx >= 0) leads[idx] = lead;
        else leads.push(lead);
        localStorage.setItem(FALLBACK_LEADS_KEY, JSON.stringify(leads));
        return lead;
    }

    async function getLead(id) {
        const db = await getDB();
        if (db) {
            return new Promise(function (resolve) {
                const tx = db.transaction([STORE_LEADS], 'readonly');
                const store = tx.objectStore(STORE_LEADS);
                const req = store.get(id);
                req.onsuccess = function () { resolve(req.result ? normalizarLead(req.result) : null); };
                req.onerror = function () { resolve(null); };
            });
        }
        const encontrado = lerFallbackLeads().find(function (item) { return item.id === id; });
        return encontrado ? normalizarLead(encontrado) : null;
    }

    async function mesclarLead(id, transformacao) {
        const db = await getDB();
        if (db) {
            return new Promise(function (resolve, reject) {
                const tx = db.transaction([STORE_LEADS], 'readwrite');
                const store = tx.objectStore(STORE_LEADS);
                const req = store.get(id);

                req.onsuccess = function () {
                    if (!req.result) {
                        resolve(null);
                        return;
                    }

                    let atualizado;
                    try {
                        atualizado = normalizarLead(transformacao(normalizarLead(req.result)));
                    } catch (err) {
                        reject(err);
                        return;
                    }

                    const reqPut = store.put(atualizado);
                    reqPut.onsuccess = function () { resolve(atualizado); };
                    reqPut.onerror = function (event) { reject(event.target.error); };
                };
                req.onerror = function (event) { reject(event.target.error); };
            });
        }

        const leads = lerFallbackLeads();
        const idx = leads.findIndex(function (item) { return item.id === id; });
        if (idx < 0) return null;

        const atualizado = normalizarLead(transformacao(normalizarLead(leads[idx])));
        leads[idx] = atualizado;
        localStorage.setItem(FALLBACK_LEADS_KEY, JSON.stringify(leads));
        return atualizado;
    }

    async function listarLeads() {
        const db = await getDB();
        if (db) {
            return new Promise(function (resolve) {
                const tx = db.transaction([STORE_LEADS], 'readonly');
                const store = tx.objectStore(STORE_LEADS);
                const req = store.getAll();
                req.onsuccess = function () {
                    resolve((req.result || []).map(normalizarLead));
                };
                req.onerror = function () { resolve([]); };
            });
        }
        return lerFallbackLeads().map(normalizarLead);
    }

    async function listarPendentes() {
        const todos = await listarLeads();
        return todos
            .filter(function (lead) { return !lead.sincronizado; })
            .sort(function (a, b) {
                return new Date(a.timestamp_local || 0).getTime() - new Date(b.timestamp_local || 0).getTime();
            });
    }

    async function buscarLeadDuplicado(telefone, cpf) {
        const leads = await listarLeads();
        const telefoneNormalizado = Utils.normalizarTelefone(telefone);
        const cpfNormalizado = Utils.normalizarCPF(cpf);

        return leads.find(function (lead) {
            const mesmoTelefone = telefoneNormalizado.length >= 10 &&
                Utils.normalizarTelefone(lead.telefone) === telefoneNormalizado;
            const mesmoCpf = cpfNormalizado.length === 11 &&
                Utils.normalizarCPF(lead.cpf) === cpfNormalizado;
            return mesmoTelefone || mesmoCpf;
        }) || null;
    }

    async function salvarLead(leadData) {
        const agora = new Date().toISOString();
        const lead = normalizarLead({
            id: leadData.id || Utils.uuidV4(),
            nome: String(leadData.nome || '').trim(),
            telefone: String(leadData.telefone || '').trim(),
            cpf: leadData.cpf ? String(leadData.cpf).trim() : null,
            consentimento: Boolean(leadData.consentimento),
            consentimento_em: leadData.consentimento_em || agora,
            consentimento_versao: leadData.consentimento_versao || (typeof CONFIG !== 'undefined' ? CONFIG.CONSENTIMENTO_VERSAO : 'v1'),
            operador_id: leadData.operador_id || 'OPERADOR-01',
            beneficio_sorteado: leadData.beneficio_sorteado || null,
            girado_em: leadData.girado_em || null,
            status: leadData.beneficio_sorteado ? 'completo' : 'pendente_giro',
            timestamp_local: leadData.timestamp_local || agora,
            sincronizado: false,
            remoto_criado: false,
            premio_sincronizado: false
        });

        await putLead(lead);
        emitSyncStatus();
        if (configurado() && navigator.onLine) {
            sincronizarPendentes();
        }
        return lead;
    }

    async function atualizarLead(id, patch, options) {
        const opts = options || {};
        const atualizado = await mesclarLead(id, function (atual) {
            const novo = Object.assign({}, atual, patch);

            if (Object.prototype.hasOwnProperty.call(patch, 'beneficio_sorteado') && patch.beneficio_sorteado) {
                novo.premio_sincronizado = false;
                novo.status = 'completo';
                if (!patch.girado_em) novo.girado_em = new Date().toISOString();
                if (!Object.prototype.hasOwnProperty.call(patch, 'sincronizado')) {
                    novo.sincronizado = false;
                }
            }

            return novo;
        });

        if (!atualizado) return null;

        emitSyncStatus();
        if (opts.sync !== false && configurado() && navigator.onLine) {
            sincronizarPendentes();
        }
        return atualizado;
    }

    function lerCacheBeneficios() {
        const bruto = localStorage.getItem(CACHE_BENEFICIOS_KEY);
        if (!bruto) return null;
        try {
            const dados = JSON.parse(bruto);
            return Array.isArray(dados) ? dados : null;
        } catch (e) {
            return null;
        }
    }

    function normalizarBeneficios(lista) {
        return (Array.isArray(lista) ? lista : []).map(function (b, index) {
            const peso = Number(b && b.peso);
            return {
                id: b && b.id ? String(b.id) : 'b_' + Date.now() + '_' + index,
                nome: String(b && b.nome ? b.nome : '').trim(),
                peso: Number.isFinite(peso) && peso > 0 ? Math.round(peso) : 1,
                ativo: b ? b.ativo !== false : true
            };
        }).filter(function (b) { return b.nome.length > 0; });
    }

    async function gravarStoreBeneficios(lista) {
        const db = await getDB();
        if (!db) return;
        await new Promise(function (resolve, reject) {
            const tx = db.transaction([STORE_BENEFICIOS], 'readwrite');
            const store = tx.objectStore(STORE_BENEFICIOS);
            store.clear();
            lista.forEach(function (b) { store.put(b); });
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function (event) { reject(event.target.error); };
        });
    }

    async function salvarBeneficiosCache(lista) {
        const normalizados = normalizarBeneficios(lista);
        localStorage.setItem(CACHE_BENEFICIOS_KEY, JSON.stringify(normalizados));
        await gravarStoreBeneficios(normalizados);
        window.dispatchEvent(new CustomEvent('beneficios-atualizados', {
            detail: normalizados.filter(function (b) { return b.ativo !== false; })
        }));
        return normalizados;
    }

    async function listarTodosBeneficios() {
        const cache = lerCacheBeneficios();
        return cache === null ? [] : normalizarBeneficios(cache);
    }

    async function listarBeneficios() {
        const cache = lerCacheBeneficios();
        if (cache !== null) {
            return normalizarBeneficios(cache).filter(function (b) { return b.ativo !== false; });
        }

        const legado = localStorage.getItem('roleta_beneficios_cache');
        if (legado) {
            try {
                const lista = JSON.parse(legado);
                if (Array.isArray(lista) && lista.length > 0) {
                    await salvarBeneficiosCache(lista);
                    return normalizarBeneficios(lista).filter(function (b) { return b.ativo !== false; });
                }
            } catch (e) {
                // cache legado inválido; segue para os padrões
            }
        }

        if (!localStorage.getItem(SEED_KEY)) {
            localStorage.setItem(SEED_KEY, '1');
            const defaults = normalizarBeneficios(typeof CONFIG !== 'undefined' ? CONFIG.BENEFICIOS_DEFAULT : []);
            await salvarBeneficiosCache(defaults);
            return defaults.filter(function (b) { return b.ativo !== false; });
        }

        return [];
    }

    async function inicializarBeneficios() {
        if (configurado() && navigator.onLine) {
            try {
                await pullBeneficios();
                return;
            } catch (err) {
                ultimoErroSync = err.message;
                console.warn('Não foi possível carregar benefícios do Supabase:', err);
            }
        }

        if (lerCacheBeneficios() === null) {
            const legado = localStorage.getItem('roleta_beneficios_cache');
            if (legado) {
                try {
                    const lista = JSON.parse(legado);
                    if (Array.isArray(lista) && lista.length > 0) {
                        await salvarBeneficiosCache(lista);
                        return;
                    }
                } catch (e) {
                    // cache legado inválido; segue para os padrões
                }
            }

            localStorage.setItem(SEED_KEY, '1');
            await salvarBeneficiosCache(typeof CONFIG !== 'undefined' ? CONFIG.BENEFICIOS_DEFAULT : []);
        }
    }

    async function pullBeneficios() {
        if (!configurado()) {
            throw new Error('Supabase não configurado.');
        }

        const resposta = await fetch(
            CONFIG.SUPABASE_URL + '/rest/v1/beneficios?select=id,nome,peso,ativo&deletado_em=is.null&ativo=eq.true&order=created_at.asc',
            { headers: baseHeaders() }
        );

        if (!resposta.ok) {
            const texto = await resposta.text();
            throw new Error('Falha ao carregar benefícios (' + resposta.status + '): ' + texto);
        }

        const dados = await resposta.json();
        await salvarBeneficiosCache(dados);
        return dados;
    }

    async function emitSyncStatus() {
        try {
            const pendentes = await listarPendentes();
            window.dispatchEvent(new CustomEvent('sync-status', {
                detail: {
                    pendentes: pendentes.length,
                    sincronizando: isSyncing,
                    online: navigator.onLine,
                    configurado: configurado(),
                    erro: ultimoErroSync,
                    ultimoSync: localStorage.getItem(ULTIMO_SYNC_KEY) || null
                }
            }));
        } catch (e) {
            // status é apenas informativo
        }
    }

    async function sincronizarPendentes() {
        if (isSyncing) {
            syncSolicitado = true;
            return;
        }
        if (!configurado()) {
            emitSyncStatus();
            return;
        }
        if (!navigator.onLine) {
            emitSyncStatus();
            return;
        }

        isSyncing = true;
        ultimoErroSync = null;
        emitSyncStatus();

        try {
            const pendentes = await listarPendentes();

            for (const lead of pendentes) {
                try {
                    if (!lead.remoto_criado) {
                        const payload = {
                            id: lead.id,
                            nome: lead.nome,
                            telefone: lead.telefone,
                            cpf: lead.cpf,
                            consentimento: lead.consentimento,
                            consentimento_em: lead.consentimento_em,
                            consentimento_versao: lead.consentimento_versao,
                            operador_id: lead.operador_id,
                            beneficio_sorteado: lead.beneficio_sorteado,
                            girado_em: lead.girado_em,
                            status: lead.beneficio_sorteado ? 'completo' : 'pendente_giro',
                            timestamp_local: lead.timestamp_local
                        };

                        const resposta = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/leads', {
                            method: 'POST',
                            headers: Object.assign({}, baseHeaders(), { Prefer: 'return=minimal' }),
                            body: JSON.stringify(payload)
                        });

                        if (!(resposta.ok || resposta.status === 409)) {
                            const texto = await resposta.text();
                            throw new Error('Lead ' + lead.id + ': HTTP ' + resposta.status + ' ' + texto);
                        }

                        lead.remoto_criado = true;
                        await atualizarLead(lead.id, { remoto_criado: true }, { sync: false });
                    }

                    if (lead.remoto_criado && lead.beneficio_sorteado && !lead.premio_sincronizado) {
                        const resposta = await fetch(CONFIG.SUPABASE_URL + '/rest/v1/rpc/set_lead_prize', {
                            method: 'POST',
                            headers: baseHeaders(),
                            body: JSON.stringify({
                                p_id: lead.id,
                                p_beneficio: lead.beneficio_sorteado
                            })
                        });

                        if (!resposta.ok) {
                            const texto = await resposta.text();
                            throw new Error('Prêmio ' + lead.id + ': HTTP ' + resposta.status + ' ' + texto);
                        }

                        lead.premio_sincronizado = true;
                    }

                    const atual = await getLead(lead.id) || lead;
                    const premioSincronizado = Boolean(lead.premio_sincronizado || atual.premio_sincronizado);
                    const premioPendente = Boolean(atual.beneficio_sorteado && !premioSincronizado);
                    const sincronizado = Boolean(lead.remoto_criado || atual.remoto_criado) && !premioPendente;

                    await atualizarLead(lead.id, {
                        remoto_criado: Boolean(lead.remoto_criado || atual.remoto_criado),
                        premio_sincronizado: premioSincronizado,
                        sincronizado: sincronizado
                    }, { sync: false });
                } catch (err) {
                    ultimoErroSync = err instanceof TypeError
                        ? 'Sem conexão com o servidor. Os leads continuam salvos neste aparelho.'
                        : err.message;
                    console.warn('Falha ao sincronizar lead:', err);
                    if (err instanceof TypeError) break;
                }
            }

            localStorage.setItem(ULTIMO_SYNC_KEY, new Date().toISOString());
        } catch (err) {
            ultimoErroSync = err instanceof TypeError
                ? 'Sem conexão com o servidor. Os leads continuam salvos neste aparelho.'
                : err.message;
            console.error('Erro durante a sincronização:', err);
        } finally {
            isSyncing = false;
            emitSyncStatus();
            if (ultimoErroSync) {
                window.dispatchEvent(new CustomEvent('sync-error', { detail: { erro: ultimoErroSync } }));
            }
            if (syncSolicitado) {
                syncSolicitado = false;
                sincronizarPendentes();
            }
        }
    }

    window.addEventListener('online', function () {
        emitSyncStatus();
        if (configurado()) {
            pullBeneficios().catch(function (err) {
                console.warn('Falha ao atualizar benefícios:', err);
            });
            sincronizarPendentes();
        }
    });

    window.addEventListener('offline', function () {
        emitSyncStatus();
    });

    return {
        configurado: configurado,
        salvarLead: salvarLead,
        atualizarLead: atualizarLead,
        listarLeads: listarLeads,
        listarPendentes: listarPendentes,
        buscarLeadDuplicado: buscarLeadDuplicado,
        listarBeneficios: listarBeneficios,
        listarTodosBeneficios: listarTodosBeneficios,
        salvarBeneficiosCache: salvarBeneficiosCache,
        inicializarBeneficios: inicializarBeneficios,
        pullBeneficios: pullBeneficios,
        emitSyncStatus: emitSyncStatus,
        sincronizarPendentes: sincronizarPendentes
    };
})();
