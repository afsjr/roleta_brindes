# Roleta de Benefícios — PWA Offline-First (MVP histórico)

> **Atenção:** esta pasta é a cópia congelada do MVP de 2026-11-03. A versão atual, com Supabase Auth, RLS e sincronização do prêmio, está na raiz do projeto. Consulte o `README.md` da raiz e `supabase/README.md`. As instruções abaixo, incluindo `ADMIN_PASSWORD`, não valem para a versão atual.

Aplicação Web Progressiva (PWA) para ações presenciais de captação de leads com sorteio gamificado de benefícios.

## Características
- **100% Offline-First:** Funciona sem internet na rua via IndexedDB e Service Worker.
- **Sincronização Automática:** Ao detectar sinal de internet, envia os cadastros acumulados em segundo plano para o Supabase.
- **Captação Conforme LGPD:** Coleta de Nome, Telefone com máscara brasileira, CPF (opcional) e checkbox de consentimento.
- **Painel Administrativo Embutido:** Acesso protegido por senha para cadastrar/pausar benefícios e exportar os leads captados em formato CSV.

## Como Executar Localmente
Você pode rodar com qualquer servidor estático local:

```bash
# Opção 1: Usando Python 3
python3 -m http.server 8000 --directory _reversa_forward/001-roleta-beneficios-mvp/app

# Opção 2: Usando npx serve
npx serve _reversa_forward/001-roleta-beneficios-mvp/app
```

Depois, acesse no navegador ou celular: `http://localhost:8000`.

## Configuração do Supabase
Edite o arquivo `config.js` com os dados do seu projeto Supabase:
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: Chave pública `anon` para envio de leads em campo.
- `ADMIN_PASSWORD`: Senha de acesso ao painel de administração da roleta.
