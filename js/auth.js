const Auth = (function () {
    'use strict';

    const SESSION_KEY = 'roleta_admin_session_v1';
    const MARGEM_EXPIRACAO_MS = 60000;

    function lerJson(resposta) {
        return resposta.text().then(function (texto) {
            if (!texto) return {};
            try {
                return JSON.parse(texto);
            } catch (e) {
                return { message: texto };
            }
        });
    }

    function lerSessao() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function gravarSessao(sessao) {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
        } catch (e) {
            // sessionStorage indisponível
        }
    }

    function limparSessao() {
        try {
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {
            // sessionStorage indisponível
        }
    }

    function configurado() {
        return Utils.supabaseConfigurado(typeof CONFIG !== 'undefined' ? CONFIG : null);
    }

    function sessionValida(sessao) {
        if (!sessao || !sessao.access_token) return false;
        if (!sessao.expires_at) return true;
        return Date.now() < (sessao.expires_at - MARGEM_EXPIRACAO_MS);
    }

    function isAuthenticated() {
        return sessionValida(lerSessao());
    }

    function getToken() {
        const sessao = lerSessao();
        return sessionValida(sessao) ? sessao.access_token : null;
    }

    function getAdminEmail() {
        const sessao = lerSessao();
        return sessao && sessao.user ? sessao.user.email : '';
    }

    function authHeaders() {
        const token = getToken();
        return {
            apikey: CONFIG.SUPABASE_ANON_KEY,
            Authorization: 'Bearer ' + (token || CONFIG.SUPABASE_ANON_KEY),
            'Content-Type': 'application/json'
        };
    }

    async function login(email, senha) {
        if (!configurado()) {
            throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js.');
        }
        if (!email || !senha) {
            throw new Error('Informe e-mail e senha.');
        }
        if (!navigator.onLine) {
            throw new Error('Conecte-se à internet para entrar no painel.');
        }

        let resposta;
        try {
            resposta = await fetch(CONFIG.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
                method: 'POST',
                headers: {
                    apikey: CONFIG.SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim(), password: senha })
            });
        } catch (e) {
            throw new Error('Não foi possível conectar ao Supabase. Verifique a internet e a URL configurada.');
        }

        const dados = await lerJson(resposta);
        if (!resposta.ok) {
            throw new Error(dados.error_description || dados.msg || dados.error || 'E-mail ou senha inválidos.');
        }
        if (!dados.access_token) {
            throw new Error('Resposta de autenticação inválida.');
        }

        const sessao = {
            access_token: dados.access_token,
            refresh_token: dados.refresh_token || null,
            expires_at: Date.now() + (Number(dados.expires_in) || 3600) * 1000,
            user: dados.user || null
        };
        gravarSessao(sessao);
        return sessao;
    }

    function logout() {
        limparSessao();
    }

    return {
        configurado: configurado,
        isAuthenticated: isAuthenticated,
        getToken: getToken,
        getAdminEmail: getAdminEmail,
        authHeaders: authHeaders,
        login: login,
        logout: logout
    };
})();
