const Admin = (function () {
    'use strict';

    function configurado() {
        return Utils.supabaseConfigurado(typeof CONFIG !== 'undefined' ? CONFIG : null);
    }

    function exigirConfigurado() {
        if (!configurado()) {
            throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js.');
        }
    }

    function exigirOnline() {
        if (!navigator.onLine) {
            throw new Error('Conecte-se à internet para gerenciar benefícios.');
        }
    }

    async function request(path, options) {
        exigirConfigurado();
        exigirOnline();

        const opts = options || {};
        const headers = Object.assign({}, Auth.authHeaders(), opts.headers || {});
        let resposta;
        try {
            resposta = await fetch(CONFIG.SUPABASE_URL + path, Object.assign({}, opts, { headers: headers }));
        } catch (e) {
            throw new Error('Sem conexão com o Supabase. Verifique a internet e tente novamente.');
        }
        const texto = await resposta.text();
        let corpo = null;

        if (texto) {
            try {
                corpo = JSON.parse(texto);
            } catch (e) {
                corpo = texto;
            }
        }

        if (!resposta.ok) {
            if (resposta.status === 401 || resposta.status === 403) {
                Auth.logout();
                window.dispatchEvent(new CustomEvent('admin-session-expired'));
                throw new Error('Sessão expirada. Entre novamente.');
            }
            const mensagem = corpo && typeof corpo === 'object'
                ? (corpo.message || corpo.error_description || corpo.error || JSON.stringify(corpo))
                : (corpo || 'HTTP ' + resposta.status);
            throw new Error(mensagem);
        }

        return corpo;
    }

    async function autenticar(email, senha) {
        return Auth.login(email, senha);
    }

    function estaAutenticado() {
        return Auth.isAuthenticated();
    }

    function logout() {
        Auth.logout();
    }

    function getAdminEmail() {
        return Auth.getAdminEmail();
    }

    async function listarBeneficiosRemotos() {
        return request('/rest/v1/beneficios?select=id,nome,peso,ativo,deletado_em,created_at&deletado_em=is.null&order=created_at.asc');
    }

    async function listarLeadsRemotos() {
        return request('/rest/v1/leads?select=*&order=created_at.desc&limit=1000');
    }

    async function adicionarBeneficio(nome, peso) {
        const nomeLimpo = String(nome || '').trim();
        if (!nomeLimpo) throw new Error('Informe o nome do prêmio.');
        const pesoNumero = Math.max(1, Math.min(100, parseInt(peso, 10) || 1));

        return request('/rest/v1/beneficios', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ nome: nomeLimpo, peso: pesoNumero, ativo: true })
        });
    }

    async function editarBeneficio(id, nome, peso) {
        const nomeLimpo = String(nome || '').trim();
        if (!nomeLimpo) throw new Error('Informe o nome do prêmio.');
        const pesoNumero = Math.max(1, Math.min(100, parseInt(peso, 10) || 1));

        return request('/rest/v1/beneficios?id=eq.' + encodeURIComponent(id), {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ nome: nomeLimpo, peso: pesoNumero })
        });
    }

    async function toggleBeneficio(id, ativo) {
        return request('/rest/v1/beneficios?id=eq.' + encodeURIComponent(id), {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ ativo: Boolean(ativo) })
        });
    }

    async function excluirBeneficio(id) {
        return request('/rest/v1/beneficios?id=eq.' + encodeURIComponent(id), {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ ativo: false, deletado_em: new Date().toISOString() })
        });
    }

    function exportarLeadsCSV(leads) {
        const lista = Array.isArray(leads) ? leads : [];
        if (lista.length === 0) {
            alert('Nenhum lead captado até o momento.');
            return;
        }

        const headers = [
            'ID',
            'Nome Completo',
            'Telefone',
            'CPF',
            'Consentimento LGPD',
            'Consentimento em',
            'Operador',
            'Premio Sorteado',
            'Girado em',
            'Data Hora',
            'Sincronizado'
        ];

        const linhas = lista.map(function (l) {
            return [
                l.id,
                l.nome,
                l.telefone,
                l.cpf,
                l.consentimento ? 'SIM' : 'NAO',
                l.consentimento_em,
                l.operador_id,
                l.beneficio_sorteado,
                l.girado_em,
                l.timestamp_local || l.created_at,
                l.sincronizado ? 'SIM' : 'NAO'
            ].map(Utils.csvCell).join(';');
        });

        const csv = '\uFEFF' + [headers.map(Utils.csvCell).join(';')].concat(linhas).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dataAtual = new Date().toISOString().slice(0, 10);

        link.href = url;
        link.download = 'leads_roleta_' + dataAtual + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return {
        configurado: configurado,
        autenticar: autenticar,
        estaAutenticado: estaAutenticado,
        logout: logout,
        getAdminEmail: getAdminEmail,
        listarBeneficiosRemotos: listarBeneficiosRemotos,
        listarLeadsRemotos: listarLeadsRemotos,
        adicionarBeneficio: adicionarBeneficio,
        editarBeneficio: editarBeneficio,
        toggleBeneficio: toggleBeneficio,
        excluirBeneficio: excluirBeneficio,
        exportarLeadsCSV: exportarLeadsCSV
    };
})();
