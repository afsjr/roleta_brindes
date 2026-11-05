# Spec SDD: Painel Admin de Benefícios (admin-beneficios)

> Selo 🟡 PLANEJADO. Componente do projeto roleta_benefícios.

**Componente:** admin-beneficios
**Versão:** 1.0
**Data:** 2026-11-03
**Autor:** reversa-spec-sdd
**Status:** rascunho
**Fonte:** prd.md, personas.md

---

## 1. Problema

🟡 O gestor da campanha precisa cadastrar e gerenciar os benefícios que aparecem na roleta antes de cada ação de campo. Esse painel é acessado do escritório, com internet, e as mudanças precisam refletir nos dispositivos dos operadores na próxima vez que ficarem online.

---

## 2. Objetivos

🟡 — Permitir ao admin cadastrar, editar, desativar e excluir benefícios da roleta
🟡 — Persistir benefícios no Supabase (fonte de verdade) e no cache local do dispositivo admin
🟡 — Exibir lista de leads capturados com filtros básicos (por data, operador, completude)
🟡 — Proteger o painel com senha simples (sem sistema de auth completo na v1)

---

## 3. Non-goals

🟡 — Não é um CRM completo (sem pipeline de vendas, follow-up, etc.)
🟡 — Não tem controle de acesso multi-nível (apenas 1 senha de admin na v1)
🟡 — Não envia relatórios por e-mail automaticamente
🟡 — Não faz análise estatística avançada (gráficos, funis) — apenas listagem tabular
🟡 — Não distribui o app para os operadores (isso é feito manualmente via link)

---

## 4. Requisitos funcionais

🟡 **RF-01** — O painel admin é acessível via rota `/admin` da PWA. Exige senha configurada em `config.js` (campo `ADMIN_PASSWORD`). Autenticação por `sessionStorage`; ao fechar a aba, sessão expira.
🟡 **RF-02** — Tela de benefícios exibe tabela com colunas: Nome, Peso (padrão 1), Status (Ativo/Inativo), Ações (Editar, Desativar/Ativar, Excluir).
🟡 **RF-03** — Formulário de cadastro de benefício: campos Nome (texto, obrigatório, max 40 chars) e Peso (número inteiro 1–10, padrão 1, opcional). Botão "Salvar" faz POST no Supabase e atualiza o cache local.
🟡 **RF-04** — Edição inline ou modal: ao clicar "Editar", o admin altera Nome e Peso. Salvar faz PATCH no Supabase.
🟡 **RF-05** — Desativar/Ativar: altera o campo `ativo` do benefício no Supabase. Benefícios inativos não aparecem na roleta dos operadores.
🟡 **RF-06** — Excluir: exibe confirmação "Tem certeza? Esta ação não pode ser desfeita." Soft-delete: campo `deletado_em` preenchido, registro não é removido do banco.
🟡 **RF-07** — Após qualquer alteração de benefícios, o componente chama `armazenamento-offline.salvarBeneficios(lista_atualizada)` para atualizar o cache local do dispositivo admin.
🟡 **RF-08** — Tela de leads exibe tabela com colunas: Data/Hora, Nome, Telefone, CPF (mascarado: XXX.XXX.XXX-**), Operador, Benefício Sorteado, Sincronizado. Paginação de 50 por página.
🟡 **RF-09** — Filtros da tabela de leads: por data (de/até), por operador_id (texto livre), por "com CPF" / "sem CPF".
🟡 **RF-10** — Botão "Exportar CSV" na tela de leads: gera CSV com todos os campos (CPF completo, não mascarado) e dispara download no browser.

---

## 5. Comportamentos

🟡 **B-01** — O painel requer internet para funcionar (operações de leitura e escrita no Supabase). Se offline, exibe banner "Sem conexão — o painel requer internet."
🟡 **B-02** — A senha do admin em `config.js` é comparada com hash SHA-256 armazenado em `sessionStorage`. Senha é texto simples no `config.js` (risco aceitável na v1 por ser local).
🟡 **B-03** — A tabela de leads é carregada via GET no Supabase com paginação usando `range` header (offset/limit). Não carrega todos os leads de uma vez.
🟡 **B-04** — O CPF é mascarado na tabela mas exportado completo no CSV. O botão de exportar requer confirmação: "O CSV incluirá dados completos. Confirmar download?"

---

## 6. Edge cases

🟡 **EC-01** — Admin tenta cadastrar benefício com nome duplicado: Supabase aceita (sem constraint de nome único); admin é responsável por evitar duplicatas. Melhoria futura: validação no frontend.
🟡 **EC-02** — Admin exclui todos os benefícios: operadores verão "Nenhum benefício cadastrado" na roleta até que novos sejam adicionados e sincronizados.
🟡 **EC-03** — Admin altera benefícios enquanto operadores estão offline: operadores usam o cache anterior até o próximo sync; sem notificação em tempo real.
🟡 **EC-04** — Exportação com muitos leads (ex: 10.000): geração de CSV pode ser lenta. Exibir indicador de carregamento; operação pode demorar até 10 segundos no tier gratuito do Supabase.
🟡 **EC-05** — Senha digitada errada: exibe "Senha incorreta" sem bloquear tentativas (sem rate limit na v1).

---

## 7. Critérios de aceite

🟡 **Dado** que o admin está autenticado, **Quando** cadastra um novo benefício "Kit Escolar" com Peso 2 e clica Salvar, **Então** o benefício aparece na tabela com status Ativo, é salvo no Supabase e no cache local do dispositivo admin.

🟡 **Dado** que o admin desativa o benefício "Kit Escolar", **Quando** um operador abre o app online, **Então** a roleta não exibe mais "Kit Escolar" nas fatias.

🟡 **Dado** que existem 150 leads no Supabase, **Quando** o admin acessa a tela de leads e clica "Exportar CSV", **Então** o browser faz download de um arquivo `.csv` com 150 linhas e todos os campos, incluindo CPF completo.

---

## 8. Dependências

🟡 — Supabase REST API: tabelas `beneficios` e `leads` (GET, POST, PATCH)
🟡 — `armazenamento-offline.salvarBeneficios()`: para atualizar cache local após mudanças
🟡 — `config.js`: `ADMIN_PASSWORD`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (chave com permissão de leitura de leads)

---

## 9. Schema Supabase — tabela beneficios

🟡
```sql
CREATE TABLE beneficios (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       TEXT NOT NULL,
  peso       INTEGER NOT NULL DEFAULT 1,
  ativo      BOOLEAN NOT NULL DEFAULT true,
  deletado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

🟡 RLS: INSERT/UPDATE permitido com `service_role`; SELECT de ativos permitido com `anon` (para operadores offline lerem via sync).

---

## 10. Open questions

🟡 ⚠️ ABERTO: O admin precisa ver quais operadores estão ativos no campo hoje? (premissa atual: não, fora do escopo v1)
🟡 ⚠️ ABERTO: O painel admin deve ser uma rota da mesma PWA ou uma aplicação separada? (premissa atual: rota `/admin` da mesma PWA)

---

## Avaliação de qualidade (modo manual)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TOTAL: 86/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
  Completude:    90/100 (peso 30%)  — 10 RFs, schema SQL, exportação CSV cobertos
  Testabilidade: 88/100 (peso 25%)  — 3 critérios Dado/Quando/Então; RFs verificáveis
  Clareza:       85/100 (peso 20%)  — Autenticação simplificada bem documentada
  Escopo:        85/100 (peso 15%)  — Non-goals claros; CRM explicitamente fora
  Edge Cases:    80/100 (peso 10%)  — 5 edge cases; exportação lenta coberta

Gaps:
  - Rate limit da senha admin (sem bloqueio por tentativas) — risco de segurança aceitável na v1
  - Pull de benefícios do Supabase para dispositivos de campo não especificado
```

---
Gerado por reversa-spec-sdd em 2026-11-03T04:54:00-03:00
Fonte: prd.md
