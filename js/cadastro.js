const CadastroLead = (function () {
    'use strict';

    let currentLead = null;
    let duplicado = null;
    let permitirDuplicado = false;
    let timerDuplicidade = null;

    function init(options) {
        const formElement = options.formElement;
        const inputNome = options.inputNome;
        const inputTelefone = options.inputTelefone;
        const inputCPF = options.inputCPF;
        const checkLGPD = options.checkLGPD;
        const btnSubmit = options.btnSubmit;
        const onLeadCriado = options.onLeadCriado;
        const dupWarning = options.dupWarning;
        const dupWarningText = options.dupWarningText;
        const btnPermitirDuplicado = options.btnPermitirDuplicado;

        if (!formElement) return;

        function textoBotaoPadrao() {
            return 'Cadastrar e Girar 🎯';
        }

        function validar() {
            const nomeValido = inputNome.value.trim().length >= 3;
            const telefoneLimpo = Utils.normalizarTelefone(inputTelefone.value);
            const telefoneValido = telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
            const lgpdValido = checkLGPD.checked;
            const semDuplicidade = !duplicado || permitirDuplicado;

            const cpfValor = inputCPF.value.trim();
            if (cpfValor.length > 0) {
                inputCPF.classList.toggle('input-warning', !Utils.validarCPF(cpfValor));
            } else {
                inputCPF.classList.remove('input-warning');
            }

            const ok = nomeValido && telefoneValido && lgpdValido && semDuplicidade;
            btnSubmit.disabled = !ok;
            return ok;
        }

        function definirDuplicado(lead) {
            duplicado = lead || null;
            permitirDuplicado = false;

            if (!dupWarning) {
                validar();
                return;
            }

            if (duplicado) {
                dupWarning.classList.remove('hidden');
                if (dupWarningText) {
                    dupWarningText.innerHTML = 'Já existe um cadastro neste aparelho para <strong>' +
                        Utils.escapeHtml(duplicado.nome) + '</strong> em ' +
                        Utils.escapeHtml(Utils.formatarDataHora(duplicado.timestamp_local)) + '.';
                }
                if (btnPermitirDuplicado) btnPermitirDuplicado.classList.remove('hidden');
            } else {
                dupWarning.classList.add('hidden');
                if (btnPermitirDuplicado) btnPermitirDuplicado.classList.add('hidden');
            }

            validar();
        }

        async function verificarDuplicidade() {
            const telefone = Utils.normalizarTelefone(inputTelefone.value);
            const cpf = Utils.normalizarCPF(inputCPF.value);

            if (telefone.length < 10 && cpf.length !== 11) {
                definirDuplicado(null);
                return;
            }

            try {
                const encontrado = await Storage.buscarLeadDuplicado(inputTelefone.value, inputCPF.value);
                definirDuplicado(encontrado);
            } catch (e) {
                definirDuplicado(null);
            }
        }

        function agendarVerificacao() {
            clearTimeout(timerDuplicidade);
            timerDuplicidade = setTimeout(verificarDuplicidade, 350);
        }

        inputTelefone.addEventListener('input', function (event) {
            event.target.value = Utils.mascaraTelefone(event.target.value);
            validar();
            agendarVerificacao();
        });

        inputTelefone.addEventListener('blur', verificarDuplicidade);

        inputCPF.addEventListener('input', function (event) {
            event.target.value = Utils.mascaraCPF(event.target.value);
            validar();
            agendarVerificacao();
        });

        inputCPF.addEventListener('blur', verificarDuplicidade);

        inputNome.addEventListener('input', validar);
        checkLGPD.addEventListener('change', validar);

        if (btnPermitirDuplicado) {
            btnPermitirDuplicado.addEventListener('click', function () {
                permitirDuplicado = true;
                btnPermitirDuplicado.classList.add('hidden');
                if (dupWarningText) {
                    dupWarningText.textContent = 'Duplicidade liberada para este cadastro.';
                }
                validar();
            });
        }

        formElement.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (!validar()) return;

            if (!permitirDuplicado) {
                const encontrado = await Storage.buscarLeadDuplicado(inputTelefone.value, inputCPF.value);
                if (encontrado) {
                    definirDuplicado(encontrado);
                    return;
                }
            }

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Gravando cadastro...';

            const operadorId = localStorage.getItem('roleta_operador_id') || 'OPERADOR-01';

            try {
                const leadData = {
                    nome: inputNome.value.trim(),
                    telefone: inputTelefone.value.trim(),
                    cpf: inputCPF.value.trim() ? inputCPF.value.trim() : null,
                    consentimento: checkLGPD.checked,
                    consentimento_em: new Date().toISOString(),
                    consentimento_versao: typeof CONFIG !== 'undefined' ? CONFIG.CONSENTIMENTO_VERSAO : 'v1',
                    operador_id: operadorId,
                    timestamp_local: new Date().toISOString()
                };

                currentLead = await Storage.salvarLead(leadData);

                if (typeof onLeadCriado === 'function') {
                    await onLeadCriado(currentLead);
                }
            } catch (err) {
                console.error('Erro ao registrar lead:', err);
                alert('Falha ao salvar localmente. Tente novamente.');
                btnSubmit.disabled = false;
                btnSubmit.textContent = textoBotaoPadrao();
            }
        });

        function resetar() {
            formElement.reset();
            currentLead = null;
            duplicado = null;
            permitirDuplicado = false;
            clearTimeout(timerDuplicidade);
            if (dupWarning) dupWarning.classList.add('hidden');
            if (btnPermitirDuplicado) btnPermitirDuplicado.classList.add('hidden');
            inputCPF.classList.remove('input-warning');
            btnSubmit.disabled = true;
            btnSubmit.textContent = textoBotaoPadrao();
        }

        return {
            resetar: resetar
        };
    }

    function resetar(formElement, btnSubmit) {
        if (!formElement) return;
        formElement.reset();
        currentLead = null;
        duplicado = null;
        permitirDuplicado = false;
        clearTimeout(timerDuplicidade);
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Cadastrar e Girar 🎯';
    }

    return {
        mascaraTelefone: Utils.mascaraTelefone,
        mascaraCPF: Utils.mascaraCPF,
        validarCPF: Utils.validarCPF,
        init: init,
        resetar: resetar,
        getCurrentLead: function () { return currentLead; }
    };
})();
