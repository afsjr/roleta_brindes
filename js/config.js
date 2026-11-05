const CONFIG = {
    SUPABASE_URL: "https://khnwwyoghxhfacatmccv.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtobnd3eW9naHhoZmFjYXRtY2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4NzQ1MDAsImV4cCI6MjEwOTQ1MDUwMH0.qw1DBVCs8Sd1MCHqktXJtM0UGuAmj0kOvFF9WPM3PTg",

    INSTITUICAO_NOME: "Faculdade & Curso Técnico",
    POLITICA_PRIVACIDADE_URL: "",
    CONSENTIMENTO_VERSAO: "v1",

    BENEFICIOS_DEFAULT: [
        { id: "b1", nome: "Bolsa de 50%", peso: 1, ativo: true },
        { id: "b2", nome: "Isenção de Matrícula", peso: 2, ativo: true },
        { id: "b3", nome: "Kit Estudante", peso: 3, ativo: true },
        { id: "b4", nome: "Desconto de 30%", peso: 2, ativo: true },
        { id: "b5", nome: "Curso Grátis de Redação", peso: 2, ativo: true },
        { id: "b6", nome: "Mentoria de Carreira", peso: 1, ativo: true }
    ],

    SPIN_DURATION_MS: 4200,
    META_LEADS_DIA: 50
};

if (typeof Object.freeze === 'function') {
    Object.freeze(CONFIG);
}
