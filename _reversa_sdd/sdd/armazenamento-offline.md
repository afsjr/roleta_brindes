# Spec SDD: Armazenamento Offline e Sync (armazenamento-offline)

> Selo 🟡 PLANEJADO. Componente do projeto roleta_benefícios.

**Componente:** armazenamento-offline
**Versão:** 1.0
**Data:** 2026-11-03
**Autor:** reversa-spec-sdd
**Status:** rascunho
**Fonte:** prd.md, ideation.md

---

## 1. Problema

🟡 Operadores atuam sem internet. Leads devem ser salvos localmente e enviados ao Supabase automaticamente quando a conexão retornar, sem ação manual. Benefícios cadastrados pelo admin também devem estar disponíveis offline.

---

## 2. Objetivos

🟡 — Persistir leads localmente via IndexedDB (localForage)
🟡 — Detectar retorno de conectividade e sincronizar leads pendentes com Supabase automaticamente
🟡 — Cachear lista de benefícios ativos localmente para uso offline
🟡 — Expor API interna simples para os demais componentes (salvarLead, atualizarLead, listarPendentes, listarBeneficios)
🟡 — Garantir que nenhum lead seja perdido, mesmo se o app for fechado antes do sync

---

## 3. Non-goals

🟡 — Não faz sync em tempo real (push contínuo); apenas dispara ao detectar conexão
🟡 — Não resolve conflitos de dados (último a sincronizar vence; conflito é improvável pois cada operador tem UUID único por lead)
🟡 — Não criptografa dados locais (dados sensíveis ficam em IndexedDB sem criptografia na v1)
🟡 — Não sincroniza dados do admin para o Supabase (admin usa Supabase diretamente)

---

## 4. Requisitos funcionais

🟡 **RF-01** — O componente usa `localForage` (ou API nativa IndexedDB) para persistência. Duas stores: `leads` e `beneficios`.
🟡 **RF-02** — `salvarLead(lead)`: persiste o objeto lead na store `leads` com chave = `lead.id`. Retorna Promise resolvida após confirmação do IndexedDB.
🟡 **RF-03** — `atualizarLead(id, patch)`: atualiza campos do lead existente (ex: `{beneficio_sorteado: "50% desconto"}`). Retorna Promise.
🟡 **RF-04** — `listarPendentes()`: retorna array de leads com `sincronizado: false`, ordenados por `timestamp_local` ASC.
🟡 **RF-05** — `sincronizarPendentes()`: percorre `listarPendentes()` e faz POST para `{SUPABASE_URL}/rest/v1/leads` com header `apikey: {SUPABASE_ANON_KEY}`. Para cada lead enviado com sucesso (HTTP 201), atualiza `sincronizado: true` localmente. Falha individual não interrompe o loop.
🟡 **RF-06** — O listener de conectividade usa `window.addEventListener('online', ...)`. Quando o evento `online` dispara, chama `sincronizarPendentes()` automaticamente.
🟡 **RF-07** — Ao iniciar o app (DOMContentLoaded), se `navigator.onLine === true`, chama `sincronizarPendentes()` para enviar eventuais pendentes de sessões anteriores.
🟡 **RF-08** — `salvarBeneficios(lista)`: persiste a lista de benefícios na store `beneficios` com chave `"ativos"`. Chamado pelo componente `admin-beneficios` após cada atualização online.
🟡 **RF-09** — `listarBeneficios()`: retorna a lista de benefícios da store `beneficios`. Se vazia, retorna array vazio (componente `roleta` exibe mensagem de "sem benefícios").
🟡 **RF-10** — O componente expõe um observable/evento `sync-status` com campos `{pendentes: N, sincronizando: bool, ultimoSync: ISO8601|null}` para o componente `pwa-shell` exibir o indicador de status.

---

## 5. Comportamentos

🟡 **B-01** — O sync é serial (um lead por vez), não paralelo, para evitar rate limit do Supabase free tier (máx. 500 req/s; com 200 leads/dia o risco é baixo, mas serial é mais seguro).
🟡 **B-02** — Se `sincronizarPendentes()` falhar para um lead específico (ex: erro de rede durante o loop), aquele lead permanece `sincronizado: false` e será tentado novamente no próximo evento `online`.
🟡 **B-03** — O campo `sincronizado` nunca é removido do objeto local. Leads sincronizados ficam no IndexedDB como histórico local da sessão.
🟡 **B-04** — A chave de API Supabase (`SUPABASE_ANON_KEY` e `SUPABASE_URL`) é lida de um arquivo `config.js` carregado antes do app. Não é hardcoded no código principal.

---

## 6. Edge cases

🟡 **EC-01** — App fechado com 50 leads pendentes, reaberto com internet: ao iniciar, `RF-07` detecta `navigator.onLine === true` e sincroniza todos automaticamente antes do operador usar a tela principal.
🟡 **EC-02** — Sync em andamento e internet cai no meio: leads já enviados ficam `sincronizado: true`; os restantes ficam `sincronizado: false` e são tentados no próximo evento `online`.
🟡 **EC-03** — Supabase retorna erro 409 (conflito de UUID): o lead é marcado como `sincronizado: true` (já existe no servidor), erro ignorado silenciosamente com log no console.
🟡 **EC-04** — Supabase retorna erro 400 (dados inválidos): o lead fica `sincronizado: false` e uma entrada de erro é gravada em store `sync-errors` para diagnóstico do admin.
🟡 **EC-05** — IndexedDB cheio (storage quota exceeded): captura o erro, exibe alerta para o operador: "Armazenamento local cheio. Conecte à internet para sincronizar antes de continuar." Bloqueia novos cadastros até liberar espaço.
🟡 **EC-06** — Dois dispositivos sincronizando ao mesmo tempo: sem conflito, pois cada lead tem UUID único gerado localmente. Supabase pode receber os mesmos UUIDs em paralelo sem problema.

---

## 7. Critérios de aceite

🟡 **Dado** que o operador está offline e cadastra 10 leads, **Quando** o celular conecta à internet, **Então** os 10 leads são enviados ao Supabase em ≤ 30 segundos e marcados como `sincronizado: true` localmente, sem ação manual.

🟡 **Dado** que o app é fechado com 5 leads pendentes e reaberto com internet disponível, **Quando** o app inicializa, **Então** `sincronizarPendentes()` é chamado automaticamente e os 5 leads são sincronizados.

🟡 **Dado** que o Supabase retorna erro 500 para um lead, **Quando** o sync continua, **Então** os demais leads são processados normalmente; o lead com erro permanece pendente para nova tentativa.

---

## 8. Dependências

🟡 — `localForage` (v1.10+): biblioteca JS para IndexedDB abstrato
🟡 — Supabase REST API: endpoint `POST /rest/v1/leads`, autenticação via `apikey` header
🟡 — `config.js`: arquivo com `SUPABASE_URL` e `SUPABASE_ANON_KEY` (não versionado no repositório)

---

## 9. Schema do objeto Lead (Supabase)

🟡 Tabela `leads` no Supabase:

```sql
CREATE TABLE leads (
  id          UUID PRIMARY KEY,
  nome        TEXT NOT NULL,
  telefone    TEXT NOT NULL,
  cpf         TEXT,
  consentimento BOOLEAN NOT NULL DEFAULT true,
  operador_id TEXT NOT NULL,
  beneficio_sorteado TEXT,
  timestamp_local TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

🟡 RLS (Row Level Security): INSERT permitido com chave anon; SELECT/UPDATE/DELETE requer chave service_role (somente admin).

---

## 10. Open questions

🟡 ⚠️ ABERTO: Leads sincronizados devem ser removidos do IndexedDB após sync para economizar espaço, ou mantidos como histórico local? (premissa atual: mantidos)
🟡 ⚠️ ABERTO: Há necessidade de sync de benefícios do Supabase para o device (pull)? (premissa atual: benefícios são empurrados pelo admin via painel, não puxados automaticamente)

---

## Avaliação de qualidade (modo manual)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TOTAL: 90/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
  Completude:    95/100 (peso 30%)  — 10 RFs, schema SQL, API interna documentada
  Testabilidade: 90/100 (peso 25%)  — 3 critérios Dado/Quando/Então cobrindo fluxo offline→sync
  Clareza:       90/100 (peso 20%)  — API interna nomeada; comportamento serial explicado
  Escopo:        88/100 (peso 15%)  — Non-goals explícitos incluindo criptografia e conflitos
  Edge Cases:    85/100 (peso 10%)  — 6 edge cases incluindo quota exceeded e conflito UUID

Gaps:
  - Estratégia de retry com backoff não especificada (melhoria futura)
  - Criptografia de CPF em repouso marcada como non-goal mas pode ser risco LGPD
```

---
Gerado por reversa-spec-sdd em 2026-11-03T04:54:00-03:00
Fonte: prd.md
