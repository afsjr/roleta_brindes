# Requirements: Roleta de Benefícios — MVP Completo

> Identificador: `001-roleta-beneficios-mvp`
> Data: `2026-11-03`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

🟡 Implementar a PWA completa de Roleta de Benefícios offline-first: operadores de campo cadastram leads (nome, telefone, CPF opcional) na rua, giram a roleta animada e os dados são sincronizados automaticamente com o Supabase ao retornar a internet. O admin gerencia os benefícios e consulta os leads capturados via painel protegido por senha. A solução substitui o processo atual de prancheta + formulário físico, com meta de 200 leads/dia capturados por 4 operadores.

---

## 2. Contexto a partir das specs

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/roleta.md#Requisitos funcionais` | Roleta circular CSS/Canvas com benefícios como fatias; giro determinístico local; resultado exibido em modal | 🟡 |
| `_reversa_sdd/sdd/cadastro-lead.md#Requisitos funcionais` | Formulário com nome (obrigatório), telefone (obrigatório, máscara), CPF (opcional, validação local), checkbox LGPD | 🟡 |
| `_reversa_sdd/sdd/armazenamento-offline.md#Requisitos funcionais` | IndexedDB via localForage; sync automático no evento `online`; stores `leads` e `beneficios` | 🟡 |
| `_reversa_sdd/sdd/admin-beneficios.md#Requisitos funcionais` | CRUD de benefícios; tabela de leads com filtros; exportação CSV; autenticação por senha simples | 🟡 |
| `_reversa_sdd/sdd/pwa-shell.md#Requisitos funcionais` | Service Worker cache-first; manifest.json; onboarding de código de operador; badge de pendentes | 🟡 |
| `_reversa_sdd/prd.md#6. Restrições` | Stack: HTML + Vanilla JS + CSS; Supabase; deploy estático | 🟡 |

---

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Operador de Campo | Cadastrar 50 leads/dia sem internet | Abre PWA offline, cadastra participante, gira roleta, repete |
| Admin / Gestor | Configurar roleta e consultar leads | Acessa `/admin`, edita benefícios, exporta CSV ao fim do dia |
| Participante (Lead) | Concorrer ao brinde rapidamente | É abordado, fornece dados, gira a roleta, vê o resultado |

---

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Nome e telefone são campos obrigatórios para cadastro do lead. CPF é opcional. 🟡
   - Tipo: nova
2. **RN-02:** O consentimento LGPD (checkbox) é obrigatório para habilitar o giro da roleta. 🟡
   - Tipo: nova
3. **RN-03:** O resultado do sorteio é calculado localmente (Math.random ponderado por peso) antes da animação iniciar. Nenhum round-trip de rede ocorre no momento do giro. 🟡
   - Tipo: nova
4. **RN-04:** Leads são salvos localmente (IndexedDB) imediatamente após o formulário ser submetido. A sincronização com Supabase é assíncrona e automática ao detectar conexão. 🟡
   - Tipo: nova
5. **RN-05:** Apenas o admin (senha configurada em `config.js`) pode cadastrar, editar ou desativar benefícios. Operadores não têm acesso ao painel. 🟡
   - Tipo: nova
6. **RN-06:** Benefícios inativos ou deletados não aparecem na roleta dos operadores. 🟡
   - Tipo: nova

---

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | PWA instalável com Service Worker e manifest.json | Must | Prompt de instalação aparece no Chrome mobile; app abre offline após instalação | 🟡 |
| RF-02 | Onboarding de código do operador no primeiro acesso | Must | Campo de código exibido antes da roleta; salvo em localStorage; não reapresenta | 🟡 |
| RF-03 | Formulário de cadastro de lead (nome, telefone, CPF opcional, checkbox LGPD) | Must | Botão ativo só com nome + telefone válido + checkbox marcado | 🟡 |
| RF-04 | Validação de formato de telefone (máscara BR) e CPF (dígitos verificadores) | Must | Telefone inválido bloqueia envio; CPF inválido exibe aviso mas não bloqueia | 🟡 |
| RF-05 | Salvar lead no IndexedDB imediatamente após submissão | Must | Lead aparece em `listarPendentes()` antes de qualquer requisição de rede | 🟡 |
| RF-06 | Roleta animada com fatias por benefício e botão Girar | Must | Roleta exibe todos benefícios ativos; animação de 3-5s; resultado em modal | 🟡 |
| RF-07 | Sorteio determinístico local (ponderado por peso) | Must | Resultado calculado antes da animação; funciona sem internet | 🟡 |
| RF-08 | Botão "Nova participação" reseta formulário e roleta | Must | Campos limpos; checkbox desmarcado; roleta volta ao estado inicial | 🟡 |
| RF-09 | Sync automático de leads ao detectar conexão (`window.online`) | Must | Leads pendentes enviados ao Supabase; `sincronizado: true` atualizado localmente | 🟡 |
| RF-10 | Sync no startup quando `navigator.onLine === true` | Must | Leads de sessões anteriores sincronizados ao abrir o app com internet | 🟡 |
| RF-11 | Header com indicador online/offline e badge de leads pendentes | Should | Badge atualizado em tempo real; vermelho quando offline; zero após sync | 🟡 |
| RF-12 | Autenticação do admin por senha em `/admin` | Must | Senha incorreta exibe erro; sessão expira ao fechar aba | 🟡 |
| RF-13 | CRUD de benefícios no painel admin | Must | Admin cria, edita, desativa e exclui benefícios; changes persistidas no Supabase | 🟡 |
| RF-14 | Tabela de leads com filtros (data, operador, CPF) | Should | Filtros funcionam; paginação de 50 por página | 🟡 |
| RF-15 | Exportação CSV de leads | Should | CSV com todos os campos (CPF completo) disponível para download | 🟡 |
| RF-16 | Rota `/admin` separada na mesma PWA | Must | Acesso via URL; não acessível por operadores sem senha | 🟡 |

---

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Cadastro salvo em IndexedDB em < 200ms | Spec armazenamento-offline#B-03 | 🟡 |
| Desempenho | App carrega do cache em < 2s em 4G ou WiFi | PWA cache-first; assets leves | 🟡 |
| Offline | 100% das funcionalidades de campo disponíveis sem internet | Spec pwa-shell + armazenamento-offline | 🟡 |
| Segurança | RLS no Supabase: INSERT com anon key; SELECT com service_role | Spec armazenamento-offline#Schema | 🟡 |
| Segurança | Chave Supabase em `config.js`, não exposta no código principal | Spec armazenamento-offline#B-04 | 🟡 |
| Compatibilidade | Funciona em Chrome e Safari mobile (iOS 14+, Android 8+) | Público-alvo usa celulares de entrada | 🟡 |
| Tamanho | Bundle JS + CSS total < 500KB (sem localForage) | PWA leve para celulares de entrada | 🟡 |

---

## 7. Critérios de Aceitação

```gherkin
Cenário: Cadastro offline e giro da roleta
  Dado que o operador está sem internet e o app está aberto
  Quando preenche nome "Maria Silva", telefone "(11) 99999-0001", marca o checkbox e clica "Cadastrar e Girar"
  Então o lead é salvo localmente, o botão Girar fica ativo, a animação inicia e o resultado é exibido em modal

Cenário: Sincronização automática ao reconectar
  Dado que existem 30 leads com sincronizado: false no IndexedDB
  Quando o celular se conecta à internet
  Então os 30 leads são enviados ao Supabase em até 60 segundos e marcados como sincronizado: true

Cenário: CPF não fornecido
  Dado que o participante não quer fornecer CPF
  Quando o operador deixa o campo CPF vazio e clica "Cadastrar e Girar"
  Então o lead é salvo com cpf: null sem nenhum erro ou aviso

Cenário: Operador abre app offline após sessão anterior com leads pendentes
  Dado que o app foi fechado com 10 leads pendentes
  Quando o operador abre o app com internet disponível
  Então os 10 leads são sincronizados automaticamente antes do primeiro giro

Cenário: Admin cria benefício
  Dado que o admin está autenticado no painel
  Quando cadastra "Bolsa de 50%" e clica Salvar
  Então o benefício aparece na tabela e na roleta dos operadores na próxima abertura online

Cenário: Telefone inválido
  Dado que o operador digitou "123" no campo telefone
  Quando tenta clicar "Cadastrar e Girar"
  Então o botão permanece desabilitado e o erro "Telefone inválido" é exibido inline
```

---

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-10 (core: PWA, formulário, roleta, sync) | Must | Funcionalidade mínima para uso em campo |
| RF-11 (badge de pendentes) | Should | Melhora UX do operador mas não bloqueia uso |
| RF-12 a RF-13 (admin + CRUD benefícios) | Must | Sem admin não há benefícios na roleta |
| RF-14 (filtros de leads) | Should | Útil mas exportação CSV já supre necessidade imediata |
| RF-15 (exportação CSV) | Should | Importante para CRM mas pode ser via Supabase dashboard |
| RF-16 (rota /admin) | Must | Separação mínima de acesso operador/admin |
| RNF Segurança (RLS Supabase) | Must | Dados sensíveis (CPF); obrigatório desde v1 |

---

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

---

## 10. Lacunas

> Nenhuma dúvida bloqueante identificada. Premissas adotadas conforme `_reversa_sdd/newproject-brief.md`.

---

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-11-03 | Criação inicial via /reversa-requirements (modo expresso) | reversa-new |
