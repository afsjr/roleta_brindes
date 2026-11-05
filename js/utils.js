(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Utils = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    function somenteDigitos(valor) {
        return String(valor == null ? '' : valor).replace(/\D/g, '');
    }

    function normalizarTelefone(valor) {
        return somenteDigitos(valor).slice(0, 11);
    }

    function normalizarCPF(valor) {
        return somenteDigitos(valor).slice(0, 11);
    }

    function mascaraTelefone(valor) {
        let v = normalizarTelefone(valor);
        if (v.length > 10) {
            return v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        }
        if (v.length > 5) {
            return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        }
        if (v.length > 2) {
            return v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        }
        if (v.length > 0) {
            return v.replace(/^(\d*)$/, '($1');
        }
        return '';
    }

    function mascaraCPF(valor) {
        const v = normalizarCPF(valor);
        return v.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, function (m, a, b, c, d) {
            let res = a;
            if (b) res += '.' + b;
            if (c) res += '.' + c;
            if (d) res += '-' + d;
            return res;
        });
    }

    function validarCPF(valor) {
        const cpf = normalizarCPF(valor);
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        let resto;
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10), 10)) return false;

        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11), 10)) return false;

        return true;
    }

    function cpfMascarado(valor) {
        const cpf = normalizarCPF(valor);
        if (cpf.length !== 11) return cpf ? '***' : '-';
        return cpf.slice(0, 3) + '.***.***-' + cpf.slice(9);
    }

    function uuidV4() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            try {
                return crypto.randomUUID();
            } catch (e) {
                // segue para o fallback
            }
        }

        const bytes = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
            crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < 16; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }

        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        const hex = Array.from(bytes, function (b) {
            return b.toString(16).padStart(2, '0');
        }).join('');

        return hex.slice(0, 8) + '-' +
            hex.slice(8, 12) + '-' +
            hex.slice(12, 16) + '-' +
            hex.slice(16, 20) + '-' +
            hex.slice(20);
    }

    function sortearPonderado(beneficios, randomFn) {
        if (!Array.isArray(beneficios) || beneficios.length === 0) return null;
        const random = typeof randomFn === 'function' ? randomFn : Math.random;
        const pesos = beneficios.map(function (b) {
            const peso = Number(b && b.peso);
            return Number.isFinite(peso) && peso > 0 ? peso : 1;
        });
        const totalPeso = pesos.reduce(function (soma, peso) { return soma + peso; }, 0);

        let alvo = random() * totalPeso;
        for (let i = 0; i < beneficios.length; i++) {
            if (alvo < pesos[i]) {
                return { index: i, item: beneficios[i] };
            }
            alvo -= pesos[i];
        }

        const ultimo = beneficios.length - 1;
        return { index: ultimo, item: beneficios[ultimo] };
    }

    function escapeHtml(valor) {
        if (valor == null) return '';
        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function csvCell(valor) {
        let texto = valor == null ? '' : String(valor);
        if (/^[=+\-@\t\r]/.test(texto)) {
            texto = "'" + texto;
        }
        return '"' + texto.replace(/"/g, '""') + '"';
    }

    function formatarDataHora(valor) {
        if (!valor) return '';
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return String(valor);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function supabaseConfigurado(config) {
        if (!config) return false;
        const url = String(config.SUPABASE_URL || '').trim();
        const key = String(config.SUPABASE_ANON_KEY || '').trim();
        if (!/^https?:\/\//i.test(url)) return false;
        if (/SEU-PROJETO|xyzcompany|example\.supabase\.co/i.test(url)) return false;
        if (key.length < 20) return false;
        if (/dummy|SEU_/i.test(key)) return false;
        return true;
    }

    return {
        somenteDigitos: somenteDigitos,
        normalizarTelefone: normalizarTelefone,
        normalizarCPF: normalizarCPF,
        mascaraTelefone: mascaraTelefone,
        mascaraCPF: mascaraCPF,
        validarCPF: validarCPF,
        cpfMascarado: cpfMascarado,
        uuidV4: uuidV4,
        sortearPonderado: sortearPonderado,
        escapeHtml: escapeHtml,
        csvCell: csvCell,
        formatarDataHora: formatarDataHora,
        supabaseConfigurado: supabaseConfigurado
    };
});
