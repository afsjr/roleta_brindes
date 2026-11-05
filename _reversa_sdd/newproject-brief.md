# Brief inicial — /reversa-new

> Selo 🟡 PLANEJADO. Documento de entrada do time Code New Project Agents.

**Data:** 2026-11-03T04:44:00-03:00
**Usuário:** adelino

## Ideia original

Aplicação web de roleta de benefícios para uso presencial na rua com operadores de campo. Antes de girar, o operador cadastra nome, telefone e CPF do participante. Os dados são enviados para um banco de dados e usados como leads para captação de alunos de faculdade ou curso técnico.

## Respostas da entrevista única

| # | Pergunta | Resposta |
|---|---|---|
| 1 | Problema raiz | Captação interativa de leads — panfletos e prancheta são passivos e pouco engajantes |
| 2 | Valor entregue | Brindes e descontos para o participante |
| 3 | Alternativas existentes | Panfletos e prancheta (formulário físico) |
| 4 | Público-alvo | Jovens e adultos fazendo ENEM, abordados na rua |
| 5 | Métrica de sucesso | 200 leads/dia gerados por 4 operadores (≈ 50 por operador) |
| 6 | Premissas perigosas | Sem internet na rua; participante pode recusar dar CPF |
| 7 | Personas | 4 operadores de campo + 1 admin (gestor dos leads) |
| 8 | Stack | Aplicação web, o mais simples possível para rodar |
| 9 | Banco de dados | Nenhum ainda — sugerido pelo Reversa |
| 10 | Offline | Sim — funciona offline e sincroniza quando há internet |
| 11 | Admin de benefícios | Somente o administrador cadastra e edita benefícios |
| 12 | LGPD (inferido) | Tela de consentimento simples antes de girar: "Seus dados serão usados para fins de contato comercial" |
| 13 | Não-objetivos (inferido) | Não envia WhatsApp automático; não requer app na loja; não faz login por biometria |
| 14 | Lacunas | Não parar — registrar 🟡 e seguir com premissa segura |

## Stack sugerida pelo Reversa

- **Frontend:** HTML + Vanilla JS + CSS (PWA) — zero dependência de build, roda em qualquer celular/tablet com browser
- **Offline:** IndexedDB via `localForage` — armazena leads localmente quando sem internet
- **Sync:** Sincronização automática quando online (background sync ou listener de conectividade)
- **Backend/DB:** Supabase (PostgreSQL gerenciado, REST API, painel de admin gratuito) — fácil de consultar leads depois
- **Deploy:** GitHub Pages ou qualquer hospedagem estática (inclusive localhost no celular do operador)

---
Gerado por /reversa-new em 2026-11-03T04:44:00-03:00
