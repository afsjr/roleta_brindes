# Ideation — Roleta de Benefícios

> Selo 🟡 PLANEJADO em todos os itens, sujeito a validação.

## Brief original

Aplicação web de roleta de benefícios para uso presencial na rua com operadores de campo. Antes de girar, o operador cadastra nome, telefone e CPF do participante. Os dados são enviados para um banco de dados e usados como leads para captação de alunos de faculdade ou curso técnico.

## Problema

🟡 Equipes de captação de leads presencial (faculdades e cursos técnicos) dependem de panfletos e pranchetas físicas — abordagem passiva, pouco engajante e sujeita a perda de dados. Jovens e adultos que estão no momento do ENEM (candidatos com alta intenção de matrícula) são abordados na rua, mas a taxa de engajamento e a qualidade dos dados coletados são baixas com o processo atual.

## Valor entregue

🟡 O operador consegue capturar leads de forma interativa e gamificada (participante gira a roleta e concorre a brindes/descontos), tornando a abordagem mais receptiva, com dados digitais já organizados para follow-up comercial.

## Alternativas existentes

🟡 — Panfletos: passivos, não coletam dados, alto descarte.
🟡 — Prancheta com formulário impresso: coleta dados mas gera retrabalho de digitação, sujeito a letra ilegível e perda de papel.
🟡 — Nenhuma das alternativas entrega engajamento ativo nem armazena leads digitalmente de forma imediata.

## Público-alvo (bruto)

🟡 Dois perfis principais:
- **Participante:** jovens e adultos em fase de ENEM (17–25 anos aprox.), abordados em pontos de grande fluxo próximos a locais de prova, escolas ou centros comerciais. Alta intenção de curso superior ou técnico.
- **Operador de campo:** promotor ou captador da instituição (4 pessoas simultâneas), sem necessidade de ser técnico, usa o app no celular/tablet próprio.
- **Admin:** gestor da campanha, acessa painel de leads para análise e follow-up.

## Métricas de sucesso

🟡 — 200 leads válidos capturados por dia (4 operadores × ≈ 50 leads/operador)
🟡 — Taxa de dados completos (nome + telefone): ≥ 80% dos registros
🟡 — Taxa de sincronização bem-sucedida: 100% dos leads offline sincronizados ao final do dia

## Premissas a validar

🟡 1. **Conectividade:** operadores atuam em locais sem internet estável — o app DEVE funcionar 100% offline e sincronizar quando a conexão retornar.
🟡 2. **CPF opcional:** parte dos participantes se recusará a fornecer o CPF. O sistema deve aceitar registro sem CPF (somente nome + telefone obrigatórios).
🟡 3. **Volume de bateria/dispositivo:** cada operador usa seu próprio celular/tablet com browser. A PWA deve ser leve e funcionar em dispositivos de entrada.

## Notas

🟡 — A roleta é o elemento de gamificação central: os benefícios são cadastrados pelo admin antes da ação, e o resultado do giro é exibido visualmente para o participante.
🟡 — Não há necessidade de app nas lojas (App Store / Play Store) — PWA instalável é suficiente.
🟡 — A instituição usa os leads para contato posterior (WhatsApp, ligação), não há envio automático pelo app.
🟡 — Compliance LGPD: tela de consentimento simples antes do cadastro de dados é premissa de segurança mínima.

---
Gerado por reversa-ideator em 2026-11-03T04:51:00-03:00
Fonte: newproject-brief.md
