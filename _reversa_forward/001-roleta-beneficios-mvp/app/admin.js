// Módulo do Painel Administrativo
const Admin = (function () {
    let isAuthenticated = false;

    function checarAutenticacao() {
        return sessionStorage.getItem('admin_auth') === 'true';
    }

    function autenticar(senha) {
        const senhaCorreta = (typeof CONFIG !== 'undefined' && CONFIG.ADMIN_PASSWORD) ? CONFIG.ADMIN_PASSWORD : 'admin';
        if (senha === senhaCorreta) {
            sessionStorage.setItem('admin_auth', 'true');
            isAuthenticated = true;
            return true;
        }
        return false;
    }

    function logout() {
        sessionStorage.removeItem('admin_auth');
        isAuthenticated = false;
    }

    async function listarBeneficiosAdmin() {
        return Storage.listarBeneficios();
    }

    async function adicionarBeneficio(nome, peso = 1) {
        const beneficios = await Storage.listarBeneficios();
        const novo = {
            id: 'b_' + Date.now(),
            nome: nome.trim(),
            peso: parseInt(peso, 10) || 1,
            ativo: true
        };
        beneficios.push(novo);
        await Storage.salvarBeneficios(beneficios);
        return novo;
    }

    async function removerBeneficio(id) {
        let beneficios = await Storage.listarBeneficios();
        beneficios = beneficios.filter(b => b.id !== id);
        await Storage.salvarBeneficios(beneficios);
        return beneficios;
    }

    async function toggleStatusBeneficio(id) {
        const beneficios = await Storage.listarBeneficios();
        const b = beneficios.find(item => item.id === id);
        if (b) {
            b.ativo = !b.ativo;
            await Storage.salvarBeneficios(beneficios);
        }
        return beneficios;
    }

    async function exportarCSV() {
        const leads = await Storage.listarLeads();
        if (leads.length === 0) {
            alert("Nenhum lead cadastrado para exportar.");
            return;
        }

        const cabecalho = ["ID", "Nome", "Telefone", "CPF", "Consentimento", "Operador", "Beneficio Sorteado", "Data Local", "Sincronizado"];
        const linhas = leads.map(l => [
            `"${l.id || ''}"`,
            `"${(l.nome || '').replace(/"/g, '""')}"`,
            `"${l.telefone || ''}"`,
            `"${l.cpf || ''}"`,
            `"${l.consentimento ? 'SIM' : 'NÃO'}"`,
            `"${l.operador_id || ''}"`,
            `"${(l.beneficio_sorteado || '').replace(/"/g, '""')}"`,
            `"${l.timestamp_local || ''}"`,
            `"${l.sincronizado ? 'SIM' : 'NÃO'}"`
        ]);

        const conteudoCSV = "\uFEFF" + [cabecalho.join(";"), ...linhas.map(row => row.join(";"))].join("\r\n");
        const blob = new Blob([conteudoCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const dataStr = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `leads_roleta_${dataStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    return {
        checarAutenticacao,
        autenticar,
        logout,
        listarBeneficiosAdmin,
        adicionarBeneficio,
        removerBeneficio,
        toggleStatusBeneficio,
        exportarCSV
    };
})();
