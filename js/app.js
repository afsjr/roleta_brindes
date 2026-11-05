document.addEventListener('DOMContentLoaded', async () => {
    if (typeof CONFIG !== 'undefined' && CONFIG.INSTITUICAO_NOME) {
        const titleEl = document.getElementById('instNameHeader');
        if (titleEl) titleEl.textContent = CONFIG.INSTITUICAO_NOME;
        const consentEl = document.getElementById('consentInstitution');
        if (consentEl) consentEl.textContent = CONFIG.INSTITUICAO_NOME;
    }

    if (typeof CONFIG !== 'undefined' && CONFIG.POLITICA_PRIVACIDADE_URL) {
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) {
            privacyLink.href = CONFIG.POLITICA_PRIVACIDADE_URL;
            privacyLink.classList.remove('hidden');
            privacyLink.addEventListener('click', (event) => event.stopPropagation());
        }
    }

    const toastContainer = document.getElementById('toastContainer');

    function showToast(mensagem, tipo = 'info') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + tipo;
        toast.textContent = mensagem;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 250);
        }, 5000);
    }

    window.addEventListener('sync-error', (event) => {
        const erro = event.detail && event.detail.erro ? event.detail.erro : 'Falha na sincronização.';
        showToast(erro, 'error');
    });

    window.addEventListener('admin-session-expired', () => {
        const loginBox = document.getElementById('adminLoginBox');
        const panelBox = document.getElementById('adminPanelBox');
        if (loginBox) loginBox.classList.remove('hidden');
        if (panelBox) panelBox.classList.add('hidden');
    });

    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
        } catch (e) {
            console.warn('Service Worker não registrado:', e);
        }
    }

    let deferredInstallPrompt = null;
    const pwaBanner = document.getElementById('pwaInstallBanner');
    const btnInstallPWA = document.getElementById('btnInstallPWA');

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        if (pwaBanner) pwaBanner.classList.remove('hidden');
    });

    if (btnInstallPWA) {
        btnInstallPWA.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            const escolha = await deferredInstallPrompt.userChoice;
            if (escolha.outcome === 'accepted') {
                if (pwaBanner) pwaBanner.classList.add('hidden');
            }
            deferredInstallPrompt = null;
        });
    }

    const onboardingModal = document.getElementById('onboardingModal');
    const onboardingForm = document.getElementById('onboardingForm');
    const inputOperadorId = document.getElementById('inputOperadorId');
    let operadorId = localStorage.getItem('roleta_operador_id');

    if (!operadorId && onboardingModal) {
        onboardingModal.classList.add('active');
        if (onboardingForm) {
            onboardingForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const codigo = inputOperadorId.value.trim().toUpperCase();
                if (codigo) {
                    localStorage.setItem('roleta_operador_id', codigo);
                    operadorId = codigo;
                    onboardingModal.classList.remove('active');
                    atualizarEstatisticasOperador().catch((err) => console.warn('Falha ao atualizar estatísticas:', err));
                }
            });
        }
    }

    const wheelCanvas = document.getElementById('wheelCanvas');
    const wheelNeedle = document.getElementById('wheelNeedle');
    const confettiCanvas = document.getElementById('confettiCanvas');

    if (wheelCanvas) Roleta.init(wheelCanvas, wheelNeedle);
    if (confettiCanvas) Confetti.init(confettiCanvas);

    Storage.emitSyncStatus();
    Storage.inicializarBeneficios()
        .then(() => Roleta.carregarBeneficios())
        .catch((err) => console.warn('Falha ao inicializar benefícios:', err));

    if (navigator.onLine) {
        Storage.sincronizarPendentes();
    }

    const connBadge = document.getElementById('connBadge');
    const pendingBadge = document.getElementById('pendingBadge');

    const operatorLeadsCount = document.getElementById('operatorLeadsCount');
    const operatorLeadsGoal = document.getElementById('operatorLeadsGoal');
    const operatorProgress = document.getElementById('operatorProgress');
    const operatorProgressBar = document.getElementById('operatorProgressBar');
    const btnMeusLeads = document.getElementById('btnMeusLeads');
    const meusLeadsModal = document.getElementById('meusLeadsModal');
    const btnCloseMeusLeads = document.getElementById('btnCloseMeusLeads');
    const meusLeadsOperador = document.getElementById('meusLeadsOperador');
    const meusLeadsHoje = document.getElementById('meusLeadsHoje');
    const meusLeadsMeta = document.getElementById('meusLeadsMeta');
    const meusLeadsTotal = document.getElementById('meusLeadsTotal');
    const meusLeadsTableBody = document.getElementById('meusLeadsTableBody');

    function operadorAtual() {
        return String(operadorId || localStorage.getItem('roleta_operador_id') || 'OPERADOR-01').trim().toUpperCase();
    }

    function metaDiaria() {
        const meta = Number(typeof CONFIG !== 'undefined' ? CONFIG.META_LEADS_DIA : 0);
        return Number.isFinite(meta) && meta > 0 ? Math.round(meta) : 50;
    }

    function ehDoDiaAtual(valor) {
        if (!valor) return false;
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return false;
        const hoje = new Date();
        return data.getFullYear() === hoje.getFullYear() &&
            data.getMonth() === hoje.getMonth() &&
            data.getDate() === hoje.getDate();
    }

    function mascararTelefone(valor) {
        const digitos = String(valor || '').replace(/\D/g, '');
        if (!digitos) return '—';
        if (digitos.length <= 4) return '••••';
        return '(' + digitos.slice(0, 2) + ') ' +
            '•'.repeat(Math.max(0, digitos.length - 6)) + '-' + digitos.slice(-4);
    }

    async function carregarMeusLeads() {
        const operador = operadorAtual();
        const todos = await Storage.listarLeads();
        const meus = todos
            .filter((lead) => String(lead.operador_id || 'OPERADOR-01').trim().toUpperCase() === operador)
            .sort((a, b) => new Date(b.timestamp_local || b.created_at || 0).getTime() -
                new Date(a.timestamp_local || a.created_at || 0).getTime());
        const hoje = meus.filter((lead) => ehDoDiaAtual(lead.timestamp_local || lead.created_at));
        return { operador, meus, hoje };
    }

    async function atualizarEstatisticasOperador() {
        const { operador, meus, hoje } = await carregarMeusLeads();
        const meta = metaDiaria();

        if (operatorLeadsCount) operatorLeadsCount.textContent = String(hoje.length);
        if (operatorLeadsGoal) operatorLeadsGoal.textContent = '/ ' + meta;
        if (operatorProgressBar) {
            const percentual = Math.min(100, (hoje.length / meta) * 100);
            operatorProgressBar.style.width = percentual + '%';
        }
        if (operatorProgress) {
            operatorProgress.setAttribute('aria-valuemax', String(meta));
            operatorProgress.setAttribute('aria-valuenow', String(hoje.length));
        }

        return { operador, meus, hoje, meta };
    }

    async function renderizarMeusLeads() {
        const { operador, meus, hoje, meta } = await atualizarEstatisticasOperador();
        if (meusLeadsOperador) meusLeadsOperador.textContent = operador;
        if (meusLeadsHoje) meusLeadsHoje.textContent = String(hoje.length);
        if (meusLeadsMeta) meusLeadsMeta.textContent = String(meta);
        if (meusLeadsTotal) meusLeadsTotal.textContent = String(meus.length);
        if (!meusLeadsTableBody) return;

        if (meus.length === 0) {
            meusLeadsTableBody.innerHTML = '<tr><td colspan="4">Nenhum lead cadastrado neste aparelho.</td></tr>';
            return;
        }

        meusLeadsTableBody.innerHTML = '';
        meus.slice(0, 100).forEach((lead) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${Utils.escapeHtml(lead.nome)}</strong></td>
                <td>${Utils.escapeHtml(mascararTelefone(lead.telefone))}</td>
                <td>${Utils.escapeHtml(lead.beneficio_sorteado || 'Aguardando giro')}</td>
                <td>${Utils.escapeHtml(Utils.formatarDataHora(lead.timestamp_local || lead.created_at))}</td>
            `;
            meusLeadsTableBody.appendChild(tr);
        });

        if (meus.length > 100) {
            const aviso = document.createElement('tr');
            aviso.innerHTML = '<td colspan="4" style="text-align:center; color:var(--text-muted);">Exibindo os 100 mais recentes de ' + meus.length + ' cadastros.</td>';
            meusLeadsTableBody.appendChild(aviso);
        }
    }

    if (btnMeusLeads && meusLeadsModal) {
        btnMeusLeads.addEventListener('click', async () => {
            meusLeadsModal.classList.add('active');
            try {
                await renderizarMeusLeads();
            } catch (err) {
                console.warn('Falha ao carregar meus leads:', err);
                if (meusLeadsTableBody) {
                    meusLeadsTableBody.innerHTML = '<tr><td colspan="4">Não foi possível carregar os cadastros locais.</td></tr>';
                }
            }
        });
    }

    if (btnCloseMeusLeads && meusLeadsModal) {
        btnCloseMeusLeads.addEventListener('click', () => meusLeadsModal.classList.remove('active'));
    }

    atualizarEstatisticasOperador().catch((err) => console.warn('Falha ao carregar meus leads:', err));

    window.addEventListener('sync-status', (event) => {
        const detalhe = event.detail || {};

        if (connBadge) {
            if (!detalhe.configurado) {
                connBadge.className = 'badge badge-offline';
                connBadge.textContent = detalhe.online ? '● Online (local)' : '● Offline (local)';
                connBadge.title = 'Supabase não configurado. Os leads ficam apenas neste aparelho.';
            } else if (detalhe.online) {
                connBadge.className = 'badge badge-online';
                connBadge.textContent = detalhe.sincronizando ? 'Sincronizando...' : '● Online';
                connBadge.title = detalhe.ultimoSync ? 'Último sync: ' + Utils.formatarDataHora(detalhe.ultimoSync) : 'Conectado';
            } else {
                connBadge.className = 'badge badge-offline';
                connBadge.textContent = '● Modo Offline';
                connBadge.title = 'Os leads serão enviados quando a internet voltar.';
            }
        }

        if (pendingBadge) {
            if (detalhe.pendentes > 0) {
                pendingBadge.classList.remove('hidden');
                pendingBadge.textContent = detalhe.pendentes + ' pendente(s)';
            } else {
                pendingBadge.classList.add('hidden');
            }
        }
    });

    if (pendingBadge) {
        pendingBadge.addEventListener('click', () => {
            if (!Storage.configurado()) {
                showToast('Configure o Supabase em js/config.js para sincronizar.', 'info');
                return;
            }
            if (navigator.onLine) {
                Storage.sincronizarPendentes();
            } else {
                showToast('Você está offline. Conecte-se para sincronizar os cadastros pendentes.', 'info');
            }
        });
    }

    const leadForm = document.getElementById('leadForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const prizeModal = document.getElementById('prizeModal');
    const prizeWonTitle = document.getElementById('prizeWonTitle');
    const btnNewSpin = document.getElementById('btnNewSpin');

    const cadastro = CadastroLead.init({
        formElement: leadForm,
        inputNome: document.getElementById('inputNome'),
        inputTelefone: document.getElementById('inputTelefone'),
        inputCPF: document.getElementById('inputCPF'),
        checkLGPD: document.getElementById('checkLGPD'),
        btnSubmit: btnSubmit,
        dupWarning: document.getElementById('dupWarning'),
        dupWarningText: document.getElementById('dupWarningText'),
        btnPermitirDuplicado: document.getElementById('btnPermitirDuplicado'),
        onLeadCriado: async (lead) => {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Girando a roleta... 🎰';
            atualizarEstatisticasOperador().catch((err) => console.warn('Falha ao atualizar estatísticas:', err));
            if (wheelCanvas) wheelCanvas.scrollIntoView({ behavior: 'smooth', block: 'center' });

            try {
                const duracao = (typeof CONFIG !== 'undefined' && CONFIG.SPIN_DURATION_MS) ? CONFIG.SPIN_DURATION_MS : 4200;
                const premio = await Roleta.girar(duracao);

                await Storage.atualizarLead(lead.id, {
                    beneficio_sorteado: premio.nome,
                    girado_em: new Date().toISOString(),
                    status: 'completo'
                });

                if (prizeWonTitle) prizeWonTitle.textContent = premio.nome;
                if (prizeModal) prizeModal.classList.add('active');
                Confetti.trigger(3200);
                showToast('Prêmio registrado: ' + premio.nome, 'success');
            } catch (err) {
                console.error('Falha no giro:', err);
                showToast('Não foi possível sortear. Verifique se há benefícios ativos.', 'error');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Cadastrar e Girar 🎯';
            }
        }
    });

    if (btnNewSpin) {
        btnNewSpin.addEventListener('click', () => {
            if (prizeModal) prizeModal.classList.remove('active');
            cadastro.resetar();
            Roleta.resetar();
            const formCard = document.getElementById('formCard');
            if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    const adminModal = document.getElementById('adminModal');
    const btnOpenAdmin = document.getElementById('btnOpenAdmin');
    const btnCloseAdmin = document.getElementById('btnCloseAdmin');
    const adminLoginBox = document.getElementById('adminLoginBox');
    const adminPanelBox = document.getElementById('adminPanelBox');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminEmailInput = document.getElementById('adminEmailInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminUserEmail = document.getElementById('adminUserEmail');
    const adminConfigWarning = document.getElementById('adminConfigWarning');
    const tabBeneficios = document.getElementById('tabBeneficios');
    const tabLeads = document.getElementById('tabLeads');
    const viewBeneficios = document.getElementById('viewBeneficios');
    const viewLeads = document.getElementById('viewLeads');
    let ultimosLeadsAdmin = [];

    function atualizarAvisoAdmin() {
        if (!adminConfigWarning) return;
        if (Storage.configurado()) {
            adminConfigWarning.classList.add('hidden');
        } else {
            adminConfigWarning.classList.remove('hidden');
        }
    }

    if (btnOpenAdmin) {
        btnOpenAdmin.addEventListener('click', () => {
            adminModal.classList.add('active');
            atualizarAvisoAdmin();
            if (Admin.estaAutenticado()) {
                mostrarPainelAdmin();
            } else {
                adminLoginBox.classList.remove('hidden');
                adminPanelBox.classList.add('hidden');
            }
        });
    }

    if (btnCloseAdmin) {
        btnCloseAdmin.addEventListener('click', () => adminModal.classList.remove('active'));
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await Admin.autenticar(adminEmailInput.value, adminPasswordInput.value);
                adminPasswordInput.value = '';
                await mostrarPainelAdmin();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    document.getElementById('btnAdminLogout')?.addEventListener('click', () => {
        Admin.logout();
        adminLoginBox.classList.remove('hidden');
        adminPanelBox.classList.add('hidden');
        ultimosLeadsAdmin = [];
    });

    async function mostrarPainelAdmin() {
        adminLoginBox.classList.add('hidden');
        adminPanelBox.classList.remove('hidden');
        if (adminUserEmail) adminUserEmail.textContent = Admin.getAdminEmail() || 'Administrador';
        await carregarTabelaBeneficios();
    }

    if (tabBeneficios) {
        tabBeneficios.addEventListener('click', () => {
            tabBeneficios.classList.add('active');
            tabLeads.classList.remove('active');
            viewBeneficios.classList.remove('hidden');
            viewLeads.classList.add('hidden');
        });
    }

    if (tabLeads) {
        tabLeads.addEventListener('click', async () => {
            tabLeads.classList.add('active');
            tabBeneficios.classList.remove('active');
            viewLeads.classList.remove('hidden');
            viewBeneficios.classList.add('hidden');
            await carregarTabelaLeads();
        });
    }

    async function sincronizarBeneficiosLocais() {
        try {
            await Storage.pullBeneficios();
        } catch (err) {
            console.warn('Falha ao atualizar a roleta local:', err);
        }
    }

    async function carregarTabelaBeneficios() {
        const tbody = document.getElementById('benefitsTableBody');
        if (!tbody) return;

        if (!Storage.configurado()) {
            tbody.innerHTML = '<tr><td colspan="4">Supabase não configurado. Preencha js/config.js.</td></tr>';
            return;
        }

        tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        try {
            const lista = await Admin.listarBeneficiosRemotos();
            tbody.innerHTML = '';

            if (!lista || lista.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">Nenhum benefício cadastrado. Adicione o primeiro acima.</td></tr>';
                return;
            }

            lista.forEach((b) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${Utils.escapeHtml(b.nome)}</strong></td>
                    <td>${b.peso || 1}</td>
                    <td><span style="color: ${b.ativo ? 'var(--success)' : 'var(--danger)'}; font-weight:600;">${b.ativo ? 'Ativo' : 'Pausado'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline btn-edit" data-id="${Utils.escapeHtml(b.id)}">Editar</button>
                        <button class="btn btn-sm btn-outline btn-toggle" data-id="${Utils.escapeHtml(b.id)}">${b.ativo ? 'Pausar' : 'Ativar'}</button>
                        <button class="btn btn-sm btn-outline btn-delete" data-id="${Utils.escapeHtml(b.id)}" style="color:var(--danger); border-color:var(--danger-border); margin-left:4px;">Excluir</button>
                    </td>
                `;

                tr.querySelector('.btn-edit').addEventListener('click', async () => {
                    const novoNome = prompt('Nome do prêmio:', b.nome);
                    if (novoNome === null) return;
                    const novoPeso = prompt('Peso do prêmio (1 a 100):', b.peso || 1);
                    if (novoPeso === null) return;

                    try {
                        await Admin.editarBeneficio(b.id, novoNome, novoPeso);
                        await sincronizarBeneficiosLocais();
                        await carregarTabelaBeneficios();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });

                tr.querySelector('.btn-toggle').addEventListener('click', async () => {
                    try {
                        await Admin.toggleBeneficio(b.id, !b.ativo);
                        await sincronizarBeneficiosLocais();
                        await carregarTabelaBeneficios();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });

                tr.querySelector('.btn-delete').addEventListener('click', async () => {
                    if (!confirm('Remover o prêmio "' + b.nome + '"?')) return;
                    try {
                        await Admin.excluirBeneficio(b.id);
                        await sincronizarBeneficiosLocais();
                        await carregarTabelaBeneficios();
                    } catch (err) {
                        showToast(err.message, 'error');
                    }
                });

                tbody.appendChild(tr);
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="4">' + Utils.escapeHtml(err.message) + '</td></tr>';
            showToast(err.message, 'error');
        }
    }

    document.getElementById('addBenefitForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeInput = document.getElementById('newBenefitName');
        const pesoInput = document.getElementById('newBenefitWeight');

        try {
            await Admin.adicionarBeneficio(nomeInput.value, pesoInput.value);
            nomeInput.value = '';
            pesoInput.value = '1';
            await sincronizarBeneficiosLocais();
            await carregarTabelaBeneficios();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    async function carregarTabelaLeads() {
        const tbody = document.getElementById('leadsTableBody');
        const counterEl = document.getElementById('totalLeadsCount');
        const statusEl = document.getElementById('adminLeadsStatus');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

        let remotas = [];
        let erro = null;

        if (Storage.configurado()) {
            try {
                remotas = await Admin.listarLeadsRemotos();
            } catch (err) {
                erro = err.message;
            }
        } else {
            erro = 'Supabase não configurado. Exibindo apenas os leads deste aparelho.';
        }

        const locais = await Storage.listarLeads();
        const mapa = new Map();

        remotas.forEach((lead) => {
            if (!lead || !lead.id) return;
            mapa.set(lead.id, Object.assign({}, lead, { sincronizado: true }));
        });

        locais.forEach((lead) => {
            if (!lead || !lead.id) return;
            mapa.set(lead.id, Object.assign({}, mapa.get(lead.id) || {}, lead));
        });

        const leads = Array.from(mapa.values()).sort((a, b) => {
            const dataA = new Date(a.timestamp_local || a.created_at || 0).getTime();
            const dataB = new Date(b.timestamp_local || b.created_at || 0).getTime();
            return dataB - dataA;
        });

        ultimosLeadsAdmin = leads;

        if (counterEl) counterEl.textContent = leads.length + ' lead(s) captados';
        if (statusEl) {
            statusEl.textContent = erro || 'Dados remotos e pendentes locais combinados.';
            statusEl.classList.toggle('hidden', !erro);
        }

        tbody.innerHTML = '';

        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhum lead captado.</td></tr>';
            return;
        }

        leads.slice(0, 200).forEach((l) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${Utils.escapeHtml(l.nome)}</strong></td>
                <td>${Utils.escapeHtml(l.telefone)}</td>
                <td>${Utils.escapeHtml(l.cpf || '-')}</td>
                <td>${Utils.escapeHtml(l.operador_id || '-')}</td>
                <td>${Utils.escapeHtml(l.beneficio_sorteado || 'Pendente')}</td>
                <td>${Utils.escapeHtml(Utils.formatarDataHora(l.timestamp_local || l.created_at))}</td>
                <td><span class="badge ${l.sincronizado ? 'badge-online' : 'badge-pending'}">${l.sincronizado ? 'Sincronizado' : 'Pendente'}</span></td>
            `;
            tbody.appendChild(tr);
        });

        if (leads.length > 200) {
            const aviso = document.createElement('tr');
            aviso.innerHTML = '<td colspan="7" style="text-align:center; color:var(--text-muted);">Exibindo os 200 mais recentes. O CSV inclui todos os carregados.</td>';
            tbody.appendChild(aviso);
        }
    }

    document.getElementById('btnRefreshLeads')?.addEventListener('click', () => {
        carregarTabelaLeads();
    });

    document.getElementById('btnExportCSV')?.addEventListener('click', () => {
        Admin.exportarLeadsCSV(ultimosLeadsAdmin);
    });
});
