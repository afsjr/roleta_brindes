# Regression Watch: Roleta de Benefícios — MVP Completo

> Identificador: `001-roleta-beneficios-mvp`
> Data: `2026-11-03`
> Feature greenfield: watch principal vazio até que uma extração `/reversa` confirme as regras como 🟢.

## 1. Watch Principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| - | - | - | - | - |

## 2. Observações (Requisitos Funcionais Implementados)

| ID | Componente / RF | Comportamento Implementado |
|----|-----------------|----------------------------|
| W001 | `cadastro-lead` (RF-01, RF-02, RF-03) | Formulário exige Nome e Telefone brasileiro válido; CPF opcional com validação local |
| W002 | `cadastro-lead` (RF-04, RF-05) | Checkbox de consentimento LGPD obrigatório para habilitar o botão |
| W003 | `armazenamento-offline` (RF-02, RF-06, RF-07) | Salvamento local em IndexedDB e sincronização automática serial com Supabase ao conectar |
| W004 | `roleta` (RF-01, RF-04, RF-05) | Roleta circular em Canvas com fatias proporcionais aos benefícios ativos e animação determinística |
| W005 | `admin-beneficios` (RF-01, RF-03, RF-10) | Painel protegido por senha para gestão de benefícios e exportação de leads em CSV |
| W006 | `pwa-shell` (RF-01, RF-02, RF-03) | Service Worker, manifesto PWA e onboarding do código de operador |

## 3. Histórico de re-extrações

Nenhuma re-extração registrada até o momento.

## 4. Arquivadas

Nenhum item arquivado.
