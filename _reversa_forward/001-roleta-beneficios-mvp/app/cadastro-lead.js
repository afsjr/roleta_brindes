// Módulo de Cadastro de Lead
const CadastroLead = (function () {
    let currentLead = null;

    // Máscara dinâmica de telefone brasileiro
    function mascaraTelefone(valor) {
        let v = valor.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 10) {
            return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (v.length > 5) {
            return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (v.length > 2) {
            return v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        } else if (v.length > 0) {
            return v.replace(/^(\d*)$/, '($1');
        }
        return v;
    }

    // Máscara de CPF
    function mascaraCPF(valor) {
        let v = valor.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (m, a, b, c, d) => {
            let res = a;
            if (b) res += '.' + b;
            if (c) res += '.' + c;
            if (d) res += '-' + d;
            return res;
        });
    }

    // Validador de CPF (algoritmo padrão de dígitos verificadores)
    function validarCPF(cpfLimpo) {
        const cpf = cpfLimpo.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false; // Bloqueia sequências como 111.111.111-11

        let soma = 0;
        let resto;
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;

        return true;
    }

    function initForm({ formElement, inputNome, inputTelefone, inputCPF, checkLGPD, btnSubmit, onLeadPronto }) {
        // Eventos de máscara
        inputTelefone.addEventListener('input', (e) => {
            e.target.value = mascaraTelefone(e.target.value);
            validarFormulario();
        });

        inputCPF.addEventListener('input', (e) => {
            e.target.value = mascaraCPF(e.target.value);
            validarFormulario();
        });

        inputNome.addEventListener('input', validarFormulario);
        checkLGPD.addEventListener('change', validarFormulario);

        function validarFormulario() {
            const nomeValido = inputNome.value.trim().length >= 3;
            const telLimpo = inputTelefone.value.replace(/\D/g, '');
            const telValido = telLimpo.length >= 10 && telLimpo.length <= 11;
            const lgpdValido = checkLGPD.checked;

            const cpfValor = inputCPF.value.trim();
            let cpfValido = true;
            if (cpfValor.length > 0) {
                cpfValido = validarCPF(cpfValor);
                if (!cpfValido) {
                    inputCPF.classList.add('input-warning');
                } else {
                    inputCPF.classList.remove('input-warning');
                }
            } else {
                inputCPF.classList.remove('input-warning');
            }

            // O botão só habilita com Nome, Telefone e LGPD válidos
            const formValido = nomeValido && telValido && lgpdValido;
            btnSubmit.disabled = !formValido;
            return formValido;
        }

        formElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validarFormulario()) return;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Gravando...';

            const operadorId = localStorage.getItem('roleta_operador_id') || 'OPERADOR-01';

            try {
                const leadData = {
                    nome: inputNome.value.trim(),
                    telefone: inputTelefone.value.trim(),
                    cpf: inputCPF.value.trim() ? inputCPF.value.trim() : null,
                    consentimento: checkLGPD.checked,
                    operador_id: operadorId,
                    timestamp_local: new Date().toISOString()
                };

                currentLead = await Storage.salvarLead(leadData);

                if (typeof onLeadPronto === 'function') {
                    onLeadPronto(currentLead);
                }
            } catch (err) {
                console.error("Erro ao salvar lead:", err);
                alert("Erro ao salvar dados localmente. Tente novamente.");
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Cadastrar e Girar';
            }
        });
    }

    function resetarForm(formElement, btnSubmit) {
        formElement.reset();
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Cadastrar e Girar';
        currentLead = null;
    }

    function getCurrentLead() {
        return currentLead;
    }

    return {
        mascaraTelefone,
        mascaraCPF,
        validarCPF,
        initForm,
        resetarForm,
        getCurrentLead
    };
})();
