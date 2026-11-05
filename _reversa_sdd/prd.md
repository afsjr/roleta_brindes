# PRD: Roleta de Benefícios

> Selo 🟡 PLANEJADO. Documento gerado a partir de ideation + personas.

**Versão:** 1.0
**Data:** 2026-11-03T04:52:00-03:00
**Autor:** reversa-drafter
**Status:** rascunho

---

## 1. Problema

🟡 Equipes de captação presencial de faculdades e cursos técnicos dependem de panfletos e formulários físicos (prancheta + caneta) para coletar dados de potenciais alunos abordados na rua. Esse processo é passivo, pouco engajante, sujeito a erros de legibilidade e gera retrabalho de digitação. O resultado é uma taxa de conversão de abordagem baixa e leads chegando com atraso ao time comercial.

### Quem sente

🟡 — **Operador de campo:** coleta dados de forma lenta e sem engajamento, difícil atingir a meta diária.
🟡 — **Gestor da campanha:** não tem visibilidade em tempo real dos leads; dados chegam tarde e com qualidade inconsistente.
🟡 — **Participante (lead):** processo chato e burocrático reduz sua disposição de parar e fornecer dados.

---

## 2. Personas-alvo

🟡 Referência completa em [`personas.md`](./personas.md). Resumo:

- **Operador de Campo**: 🟡 Promotor que aborda jovens na rua; precisa de app rápido, offline, que torne a abordagem atraente.
- **Admin / Gestor**: 🟡 Coordenador que configura os benefícios e consulta leads; precisa de painel de controle e exportação.
- **Participante (Lead)**: 🟡 Jovem/adulto em período de ENEM; quer experiência rápida e gamificada sem pressão de matrícula.

---

## 3. Métricas de sucesso

| Métrica | Unidade | Alvo | Prazo |
|---|---|---|---|
| 🟡 Leads capturados por dia | leads/dia | 200 (4 operadores × 50) | A partir do 1º dia de uso |
| 🟡 Taxa de dados completos (nome + telefone) | % dos registros | ≥ 80% | Por ação |
| 🟡 Taxa de sincronização offline→online | % dos leads offline | 100% | Ao final de cada dia |
| 🟡 Tempo médio de cadastro por participante | segundos | ≤ 60s | Por ação |

---

## 4. Escopo (in)

🟡 — **Roleta visual animada** com benefícios cadastrados pelo admin (ex: "50% de desconto", "Bolsa de estudos", "Kit material escolar")
🟡 — **Tela de cadastro de participante** com nome (obrigatório), telefone (obrigatório) e CPF (opcional)
🟡 — **Tela de consentimento LGPD** simples com checkbox de aceite antes de girar
🟡 — **Armazenamento local offline** de leads via IndexedDB (localForage)
🟡 — **Sincronização automática** com Supabase quando conexão à internet for detectada
🟡 — **Painel admin** para cadastrar, editar e remover benefícios da roleta
🟡 — **Histórico de leads sincronizados** consultável no painel admin (ou diretamente no Supabase)
🟡 — **Indicador de status de sincronização** para o operador saber quantos leads estão pendentes de envio
🟡 — **PWA instalável** na tela inicial do celular/tablet (sem app na loja)
🟡 — **Identificação do operador** por código simples (sem login com senha por biometria)

---

## 5. Não-objetivos (out)

🟡 — Não envia WhatsApp, SMS ou e-mail automático para o lead após o cadastro
🟡 — Não requer publicação nas lojas App Store ou Google Play
🟡 — Não faz login individual por operador (apenas código de identificação simples)
🟡 — Não tem CRM integrado (leads são consultados via painel Supabase ou exportação)
🟡 — Não gera relatórios analíticos avançados (ranking de operadores, funil de conversão) — escopo futuro
🟡 — Não processa pagamentos nem validação de CPF em tempo real
🟡 — Não suporta múltiplas instituições/campanhas simultâneas na mesma instância

---

## 6. Restrições

| Tipo | Descrição |
|---|---|
| 🟡 Técnica | App web (PWA) rodando em qualquer browser moderno; sem framework pesado de build; funciona offline-first com IndexedDB |
| 🟡 Técnica | Backend: Supabase (PostgreSQL + REST API). Sem servidor próprio para gerenciar. |
| 🟡 Técnica | Deploy em hospedagem estática (GitHub Pages, Netlify ou similar) |
| 🟡 Prazo | 🟡 [INDEFINIDO, validar com usuário] |
| 🟡 Compliance | LGPD: coleta de nome, telefone e CPF exige consentimento explícito registrado. CPF deve ser campo opcional. Dados armazenados apenas no Supabase controlado pelo admin. |
| 🟡 Orçamento | 🟡 [INDEFINIDO, validar com usuário] — stack escolhida tem tier gratuito (Supabase free, GitHub Pages free) |

---

## 7. Dependências externas

🟡 — **Supabase** (https://supabase.com): banco de dados PostgreSQL gerenciado, autenticação e REST API
🟡 — **localForage** (biblioteca JS): abstração de IndexedDB para armazenamento offline
🟡 — **Hospedagem estática**: GitHub Pages, Netlify ou Vercel (gratuito)
🟡 — Nenhuma API de terceiros crítica além do Supabase

---

## 8. Riscos

| Risco | Impacto | Probabilidade | Mitigação proposta |
|---|---|---|---|
| 🟡 Participante recusa fornecer CPF | Médio | Alta | CPF é campo opcional; cadastro aceita só nome + telefone |
| 🟡 Operador sem internet durante toda a ação | Alto | Alta | Armazenamento offline obrigatório (IndexedDB); sync automático ao detectar conexão |
| 🟡 Bateria do celular acaba durante a ação | Alto | Média | PWA leve, orientação de carregar celular antes; tela simples sem animações pesadas desnecessárias |
| 🟡 Dados não sincronizados se app for fechado antes do sync | Alto | Média | Sync dispara automaticamente ao abrir app e ao detectar conexão; indicador visual de leads pendentes |
| 🟡 Admin edita benefícios enquanto operadores estão offline | Médio | Baixa | Benefícios são carregados localmente; sync de benefícios ocorre ao abrir app online |
| 🟡 Vazamento de dados (CPF/telefone) | Alto | Baixa | Supabase com RLS (Row Level Security); chave anon do Supabase só permite INSERT; leitura requer chave admin |

---

## 9. Critérios de aceite (alto nível)

🟡 **Dado** que o operador está sem internet e com participante à frente, **Quando** preenche o formulário e gira a roleta, **Então** o lead é salvo localmente e o resultado da roleta é exibido imediatamente, sem erro.

🟡 **Dado** que o celular volta a ter internet, **Quando** o app detecta conexão, **Então** todos os leads pendentes são enviados ao Supabase automaticamente, sem ação manual do operador.

🟡 **Dado** que o admin acessa o painel, **Quando** cria ou edita um benefício, **Então** a roleta atualizada fica disponível para os operadores na próxima vez que abrirem o app online.

🟡 **Dado** que o participante está na tela de cadastro, **Quando** tenta enviar sem nome ou sem telefone, **Então** o app bloqueia o envio e exibe mensagem de campo obrigatório.

🟡 **Dado** que o participante não quer fornecer CPF, **Quando** deixa o campo CPF em branco, **Então** o cadastro é aceito normalmente.

---

## Pendências de cobertura

🟡 — Prazo da primeira entrega (seção 6) — definir com adelino
🟡 — Orçamento disponível para Supabase pago se volume de leads ultrapassar tier gratuito (seção 6)

---

Gerado por reversa-drafter em 2026-11-03T04:52:00-03:00
Fontes: ideation.md, personas.md
