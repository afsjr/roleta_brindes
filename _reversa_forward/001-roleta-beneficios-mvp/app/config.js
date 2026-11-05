// Configurações do App Roleta de Benefícios
const CONFIG = {
    // Endpoints do Supabase (substitua com os dados do seu projeto Supabase)
    SUPABASE_URL: "https://xyzcompany.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key",
    SUPABASE_SERVICE_KEY: "", // Opcional: usado apenas no painel admin para leitura irrestrita

    // Segurança do Painel Admin
    ADMIN_PASSWORD: "admin", // Altere para a senha desejada de acesso ao /admin

    // Nome da instituição para exibição no cabeçalho e termo LGPD
    INSTITUICAO_NOME: "Faculdade & Cursos Técnicos",

    // Benefícios padrão para carga inicial (offline imediato)
    BENEFICIOS_DEFAULT: [
        { id: "b1", nome: "Bolsa de 50%", peso: 1, ativo: true },
        { id: "b2", nome: "Isenção de Matrícula", peso: 2, ativo: true },
        { id: "b3", nome: "Kit Estudante", peso: 3, ativo: true },
        { id: "b4", nome: "Desconto de 30%", peso: 2, ativo: true },
        { id: "b5", nome: "Curso Básico Grátis", peso: 2, ativo: true },
        { id: "b6", nome: "Mentoria de Carreira", peso: 1, ativo: true }
    ]
};

// Congelar objeto para evitar modificações acidentais em tempo de execução
if (typeof Object.freeze === 'function') {
    Object.freeze(CONFIG);
}
