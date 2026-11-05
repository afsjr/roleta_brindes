# Roadmap: Roleta de Benefícios — MVP Completo

> Identificador: `001-roleta-beneficios-mvp`
> Data: `2026-11-03`
> Requirements: `_reversa_forward/001-roleta-beneficios-mvp/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

🟡 Construir uma PWA greenfield (HTML + Vanilla JS + CSS) em estrutura de arquivos plana, sem bundler. Cinco módulos JS: `pwa-shell.js`, `cadastro-lead.js`, `roleta.js`, `armazenamento-offline.js` e `admin.js`. O `index.html` carrega os módulos e o Service Worker. O banco Supabase é configurado via `config.js` (não versionado). A comunicação entre módulos usa eventos CustomEvent do DOM (barramento leve sem biblioteca). O deploy é feito copiando os arquivos para qualquer hospedagem estática. A sequência de implementação respeita as dependências: primeiro a camada de armazenamento (sem UI), depois o formulário, depois a roleta, depois o painel admin, por último o Service Worker e o manifest.

## 2. Princípios aplicados

> Nenhum arquivo `principles.md` encontrado — projeto novo, sem princípios legado.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Offline-first | Todo fluxo de campo funciona sem internet; rede é progressiva | respeita |
| Dados sensíveis mínimos | CPF é opcional; coleta apenas o necessário para follow-up | respeita |
| Zero dependência de build | Vanilla JS, sem Webpack/Vite/Rollup | respeita |
| Simples de deployar | Arquivos estáticos; funciona em qualquer hosting | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Vanilla JS sem framework | Sem build necessário; operador acessa por URL; manutenção simples | React, Vue (requerem Node.js build) | 🟡 |
| D-02 | localForage para IndexedDB | API simples e battle-tested; abstrai diferenças entre browsers | IndexedDB puro (verboso), localStorage (sem suporte a objetos) | 🟡 |
| D-03 | CustomEvent como barramento entre módulos | Desacopla módulos sem biblioteca de estado | Redux-like, pub/sub library | 🟡 |
| D-04 | Supabase como backend | PostgreSQL gerenciado; REST API sem servidor; painel admin gratuito; RLS nativo | Firebase (mais caro), backend próprio (exige servidor) | 🟡 |
| D-05 | Cache First para assets, Network First para Supabase | Assets raramente mudam; dados Supabase devem ser frescos quando online | Stale While Revalidate (mais complexo de implementar) | 🟡 |
| D-06 | Roleta em Canvas 2D | Controle fino da animação; sem dependência SVG pesado; funciona offline | CSS transform (limitado para N fatias), biblioteca de gráficos | 🟡 |
| D-07 | Senha admin em config.js | Simples para v1; sem necessidade de autenticação Supabase completa | Supabase Auth (overkill para 1 admin) | 🟡 |
| D-08 | Sync serial (um lead por vez) | Evita sobrecarga no Supabase free tier; simplifica tratamento de erro | Sync em paralelo (risco de throttle) | 🟡 |

## 4. Premissas

> Sem `[DÚVIDA]` no requirements.md. Premissas derivadas das open questions das specs:

| Premissa | Origem | Risco se errada |
|----------|--------|-----------------|
| 🟡 Peso dos benefícios igual para todos (padrão 1) na v1 | `sdd/roleta.md#Open questions` | Resultado do sorteio não reflete intenção do admin |
| 🟡 Resultado do giro não é salvo junto com o lead na v1 | `sdd/roleta.md#Open questions` | Sem rastreabilidade de qual benefício foi sorteado |
| 🟡 Nome da instituição no texto LGPD configurável via `config.js` | `sdd/cadastro-lead.md#Open questions` | Texto de consentimento incorreto |
| 🟡 Leads sincronizados mantidos no IndexedDB (não removidos) | `sdd/armazenamento-offline.md#Open questions` | IndexedDB cresce indefinidamente em campo longo |
| 🟡 Painel admin na rota `/admin` da mesma PWA | `sdd/admin-beneficios.md#Open questions` | Operador poderia acessar URL do admin acidentalmente |

## 5. Delta arquitetural

> Projeto greenfield — todos os componentes são novos.

| Componente | Arquivo de origem | Tipo de mudança | Resumo |
|------------|-------------------|-----------------|--------|
| `pwa-shell.js` | novo | componente-novo | Service Worker, manifest, onboarding, roteamento, status bar |
| `cadastro-lead.js` | novo | componente-novo | Formulário de cadastro com validação e consentimento LGPD |
| `roleta.js` | novo | componente-novo | Canvas 2D com animação de spin e resultado em modal |
| `armazenamento-offline.js` | novo | componente-novo | IndexedDB via localForage; sync automático com Supabase |
| `admin.js` | novo | componente-novo | CRUD benefícios, tabela de leads, exportação CSV |
| `sw.js` | novo | componente-novo | Service Worker com estratégias Cache First / Network First |
| `config.js` | novo | componente-novo | Variáveis de ambiente: Supabase URL/keys, senha admin, nome instituição |
| `supabase:leads` | novo | contrato-novo | Tabela PostgreSQL + RLS; acesso via REST API |
| `supabase:beneficios` | novo | contrato-novo | Tabela PostgreSQL + RLS; CRUD pelo admin |

## 6. Delta no modelo de dados

- Resumo das mudanças: criação de 2 tabelas novas no Supabase (`leads` e `beneficios`) com RLS configurado desde o início.
- Detalhe completo em: `_reversa_forward/001-roleta-beneficios-mvp/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Supabase REST API — leads | HTTP POST / GET | `_reversa_forward/001-roleta-beneficios-mvp/interfaces/supabase-leads.md` |
| Supabase REST API — beneficios | HTTP GET / POST / PATCH | `_reversa_forward/001-roleta-beneficios-mvp/interfaces/supabase-beneficios.md` |

## 8. Plano de migração

> Projeto greenfield — não há migração de sistema legado.

1. Criar projeto no Supabase (free tier)
2. Executar DDL das tabelas `leads` e `beneficios` + RLS (fornecido em `data-delta.md`)
3. Copiar chaves Supabase para `config.js` (não versionar no git)
4. Deploy dos arquivos estáticos (GitHub Pages ou similar)
5. Operadores acessam a URL e instalam o PWA na tela inicial

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| 🟡 Browser do operador não suporta Service Worker | Alto | Baixa | Aviso ao usuário; app funciona online sem SW |
| 🟡 IndexedDB quota exceeded em ação longa | Alto | Baixa | Alert bloqueante; orientar sync antes de continuar |
| 🟡 config.js exposta publicamente com service_role key | Alto | Média | Usar apenas anon key no app; service_role key apenas no painel admin (protegido por senha) |
| 🟡 Supabase free tier rate limit (500 req/s) | Médio | Baixa | Sync serial; 200 leads/dia está muito abaixo do limite |
| 🟡 Operador fecha o browser antes de sincronizar | Médio | Média | Sync no startup ao reabrir + badge de pendentes visível |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] PWA instalável no Chrome mobile e Safari iOS
- [ ] Fluxo completo offline → sync testado manualmente (desligar WiFi, cadastrar leads, religar, verificar no Supabase)
- [ ] Admin consegue cadastrar benefício e vê na roleta do operador
- [ ] Exportação CSV funcional
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-03 | Versão inicial gerada por `/reversa-plan` (modo expresso) | reversa-new |
