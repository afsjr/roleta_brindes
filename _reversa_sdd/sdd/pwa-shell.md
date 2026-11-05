# Spec SDD: PWA Shell (pwa-shell)

> Selo 🟡 PLANEJADO. Componente do projeto roleta_benefícios.

**Componente:** pwa-shell
**Versão:** 1.0
**Data:** 2026-11-03
**Autor:** reversa-spec-sdd
**Status:** rascunho
**Fonte:** prd.md, personas.md

---

## 1. Problema

🟡 O app precisa ser instalável na tela inicial do celular do operador (sem app store), funcionar offline desde o primeiro acesso após instalação, e indicar visivelmente o status de conectividade e sincronização pendente. O operador deve identificar seu código antes de usar.

---

## 2. Objetivos

🟡 — Configurar o Service Worker para cache offline dos assets estáticos (HTML, CSS, JS, localForage)
🟡 — Gerar o `manifest.json` para instalação como PWA na tela inicial
🟡 — Exibir indicador de status: online/offline e quantidade de leads pendentes de sync
🟡 — Coletar e salvar o código do operador no primeiro acesso
🟡 — Roteamento simples: `/` (roleta + cadastro) e `/admin` (painel admin)

---

## 3. Non-goals

🟡 — Não usa framework de SPA (React, Vue, etc.); roteamento é simples via `history.pushState` ou hash
🟡 — Não tem service worker com push notifications
🟡 — Não tem tela de splash animada
🟡 — Não tem suporte a múltiplos idiomas (pt-BR apenas)

---

## 4. Requisitos funcionais

🟡 **RF-01** — `manifest.json` com: `name: "Roleta de Benefícios"`, `short_name: "Roleta"`, `start_url: "/"`, `display: "standalone"`, `background_color: "#ffffff"`, `theme_color: "#FF6B35"`, `icons` em 192px e 512px.
🟡 **RF-02** — Service Worker (Cache First para assets estáticos, Network First para requisições Supabase). Estratégia: ao instalar, faz cache de `/`, `index.html`, `app.js`, `style.css`, `localforage.min.js`, ícones.
🟡 **RF-03** — Na primeira abertura (sem `operador_id` no `localStorage`), exibe tela de onboarding: campo "Seu código de operador" (texto, obrigatório, máx. 20 chars). Botão "Começar". Salva em `localStorage.operador_id`. Nunca reapresenta após o primeiro acesso.
🟡 **RF-04** — Header fixo exibe: nome do app à esquerda, ícone de status de conectividade (verde = online, vermelho = offline) e badge com contagem de leads pendentes de sync (0 quando sincronizado) à direita.
🟡 **RF-05** — Ao clicar no badge de pendentes, exibe modal informativo: "X leads aguardando sincronização. Conecte à internet para enviar." Sem ação manual de sync (é automático).
🟡 **RF-06** — Rota `/admin`: carrega o componente `admin-beneficios`. Rota `/` (ou qualquer outra): carrega a roleta + cadastro-lead.
🟡 **RF-07** — O app exibe banner "Modo offline — dados serão sincronizados quando houver internet" quando `navigator.onLine === false`. Banner desaparece ao reconectar.

---

## 5. Comportamentos

🟡 **B-01** — O Service Worker usa Cache API com versão (`CACHE_NAME = 'roleta-v1'`). Ao atualizar o app (nova versão do JS/CSS), incrementar a versão força novo cache.
🟡 **B-02** — O badge de leads pendentes é atualizado em tempo real via evento `sync-status` emitido pelo componente `armazenamento-offline`.
🟡 **B-03** — A tela de onboarding (código do operador) é exibida antes de qualquer outra tela. Até ser preenchida, a roleta não é acessível.
🟡 **B-04** — O app não usa `alert()` ou `confirm()` nativos do browser (experience ruim no mobile). Todos os diálogos são modais customizados em HTML/CSS.

---

## 6. Edge cases

🟡 **EC-01** — Browser não suporta Service Worker (browser antigo): app ainda funciona mas sem cache offline. Exibe aviso: "Seu navegador não suporta modo offline. Use Chrome, Firefox ou Safari atualizado."
🟡 **EC-02** — Operador desinstala e reinstala o PWA: `localStorage` é limpo, tela de onboarding reaparece. Leads no IndexedDB são perdidos (comportamento esperado ao desinstalar).
🟡 **EC-03** — Operador acessa `/admin` sem estar autenticado: redirecionado para tela de login do painel admin (componente `admin-beneficios` gerencia auth).
🟡 **EC-04** — App abre com Service Worker em cache stale (versão antiga): ao detectar atualização disponível, exibe banner "Nova versão disponível. [Atualizar agora]". Clique recarrega o app com o novo SW.
🟡 **EC-05** — Código de operador com caracteres especiais: campo aceita apenas alfanumérico + hífen (validação simples no frontend). Placeholder: "ex: OPERADOR-01".

---

## 7. Critérios de aceite

🟡 **Dado** que o operador acessa o app pela primeira vez, **Quando** a tela carrega, **Então** a tela de onboarding com campo de código de operador é exibida antes de qualquer outra tela.

🟡 **Dado** que o app está instalado e o celular perde internet, **Quando** o operador abre o app offline, **Então** o app carrega normalmente (assets em cache), exibe banner "Modo offline" e o formulário de cadastro funciona normalmente.

🟡 **Dado** que há 12 leads pendentes de sync, **Quando** o operador olha para o header, **Então** o badge exibe "12" em vermelho ao lado do ícone de conectividade.

---

## 8. Dependências

🟡 — Service Worker API (nativa no browser)
🟡 — Web App Manifest (nativo)
🟡 — `armazenamento-offline`: evento `sync-status` para atualizar badge
🟡 — `localStorage`: armazenamento do `operador_id`

---

## 9. Open questions

🟡 ⚠️ ABERTO: O ícone/logo da instituição deve ser configurável, ou é genérico na v1? (premissa atual: ícone genérico "R" laranja na v1)
🟡 ⚠️ ABERTO: O operador pode alterar seu código após o primeiro acesso? (premissa atual: não, precisa desinstalar e reinstalar o PWA)

---

## Avaliação de qualidade (modo manual)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TOTAL: 85/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
  Completude:    88/100 (peso 30%)  — 7 RFs cobrindo SW, manifest, onboarding, status, roteamento
  Testabilidade: 85/100 (peso 25%)  — 3 critérios Dado/Quando/Então; SW testável com DevTools
  Clareza:       85/100 (peso 20%)  — Cache strategy documentada; versioning explicado
  Escopo:        88/100 (peso 15%)  — Non-goals claros: sem framework, sem push notification
  Edge Cases:    80/100 (peso 10%)  — 5 edge cases incluindo SW stale e reinstalação

Gaps:
  - Estratégia de atualização do cache de benefícios nos operadores não especificada
  - Ícone configurável deixado como open question
```

---
Gerado por reversa-spec-sdd em 2026-11-03T04:54:00-03:00
Fonte: prd.md
