# Adendo v2 — Auth, RLS e sincronização do prêmio

> Data: `2026-11-05`
> Feature: `001-roleta-beneficios-mvp`
> Aplica-se a: `admin-beneficios`, `armazenamento-offline`, `roleta`, `pwa-shell`

Este adendo registra o que mudou na implementação em relação às specs originais de 2026-11-03. As specs originais permanecem como histórico; em caso de conflito, vale este adendo e o `README.md` da raiz.

## 1. Autenticação do administrador

- Substituído o campo `ADMIN_PASSWORD` do `config.js` por Supabase Auth (e-mail + senha).
- O painel usa `POST /auth/v1/token?grant_type=password` com a chave `anon`.
- A sessão fica em `sessionStorage` (`roleta_admin_session_v1`); ao fechar a aba, expira.
- Não existe senha em texto no frontend nem hash local.
- O usuário administrador é criado manualmente em **Authentication > Users** no Supabase.

## 2. Chaves e RLS

- O frontend usa somente `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
- A chave `service_role` nunca é usada no navegador.
- Políticas:
  - `anon`: INSERT em `leads` e SELECT de benefícios ativos.
  - `authenticated`: SELECT em todos os `leads` e CRUD em `beneficios`.
- O operador não consegue ler a tabela completa de leads nem alterar benefícios.

## 3. Prêmio e sincronização

- O lead é criado com `status = 'pendente_giro'`.
- Depois do giro, o prêmio é gravado localmente e enviado por:
  - `POST /rest/v1/rpc/set_lead_prize` com `{ p_id, p_beneficio }`.
- A função SQL `set_lead_prize` é `SECURITY DEFINER` e altera somente `beneficio_sorteado`, `girado_em` e `status`, apenas quando o prêmio ainda é nulo.
- Flags locais: `remoto_criado` e `premio_sincronizado`.
- `sincronizado` é derivado: `remoto_criado && (!beneficio_sorteado || premio_sincronizado)`.
- Uma atualização de prêmio durante um sync em andamento agenda um novo ciclo (`syncSolicitado`), evitando que o lead fique marcado como sincronizado sem o prêmio.

## 4. Benefícios

- Fonte de verdade: tabela `beneficios` no Supabase.
- Cache local versionado em `roleta_beneficios_cache_v2`, com migração do cache antigo `roleta_beneficios_cache`.
- A roleta lê o cache local; o app puxa os benefícios ativos ao abrir e ao reconectar.
- Exclusão é soft delete (`deletado_em`), preservando o histórico.

## 5. Painel de leads

- A tabela do admin combina leads remotos (Supabase) e locais (IndexedDB).
- Leads remotos são exibidos como sincronizados; os locais podem aparecer como pendentes.
- Exportação CSV protege contra injeção de fórmula e inclui CPF completo.

## 6. PWA

- Ícones PNG reais em `assets/icons/` (192, 512, apple-touch, favicon).
- Service Worker `roleta-v3-cache` inclui `utils.js`, `auth.js` e os ícones.
- Navegação offline usa fallback para `index.html`.
- Requisições não-GET não passam pelo cache.

## 7. Requisitos originais substituídos

- `admin-beneficios` RF-01: não usa mais `ADMIN_PASSWORD`; usa Supabase Auth.
- `admin-beneficios` B-02: não usa hash SHA-256 local; usa token do Supabase.
- `admin-beneficios` Dependências: não usa `SUPABASE_SERVICE_KEY`; usa `SUPABASE_ANON_KEY` + RLS.
- `armazenamento-offline` RF-05: além do POST do lead, envia o prêmio pela RPC.
- `roleta` RF-04: o giro é disparado automaticamente após o cadastro, não por um botão "Girar" separado.
