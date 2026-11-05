# Spec SDD: Cadastro de Lead (cadastro-lead)

> Selo 🟡 PLANEJADO. Componente do projeto roleta_benefícios.

**Componente:** cadastro-lead
**Versão:** 1.0
**Data:** 2026-11-03
**Autor:** reversa-spec-sdd
**Status:** rascunho
**Fonte:** prd.md, personas.md

---

## 1. Problema

🟡 Antes de girar a roleta, o operador precisa registrar os dados do participante (nome, telefone, CPF opcional) e garantir o consentimento LGPD. O formulário deve ser rápido (≤ 60s por cadastro), funcionar offline e bloquear envios incompletos.

---

## 2. Objetivos

🟡 — Coletar nome completo, telefone e CPF (opcional) do participante
🟡 — Exibir e registrar aceite do termo de consentimento LGPD antes do giro
🟡 — Validar campos obrigatórios antes de habilitar a roleta
🟡 — Salvar o lead localmente (via componente `armazenamento-offline`) imediatamente após submissão
🟡 — Emitir evento "lead-submetido" para o componente `roleta` habilitar o botão Girar

---

## 3. Non-goals

🟡 — Não valida CPF contra base da Receita Federal (só validação de formato local)
🟡 — Não envia e-mail ou WhatsApp de confirmação para o participante
🟡 — Não autentica o operador (identificação por código simples, fora deste componente)
🟡 — Não exibe histórico de leads já cadastrados nesta sessão

---

## 4. Requisitos funcionais

🟡 **RF-01** — O formulário contém os campos: Nome completo (texto, obrigatório), Telefone (texto com máscara, obrigatório), CPF (texto com máscara, opcional).
🟡 **RF-02** — O campo Telefone aceita apenas formato brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX. Máscara aplicada dinamicamente enquanto o usuário digita.
🟡 **RF-03** — O campo CPF, quando preenchido, valida formato (XXX.XXX.XXX-XX) e dígitos verificadores localmente. Se inválido, exibe erro inline sem bloquear o envio se o campo estiver vazio.
🟡 **RF-04** — Abaixo dos campos, há checkbox: "Concordo que meus dados serão usados para contato comercial por [nome da instituição]." O checkbox é obrigatório para habilitar o botão "Cadastrar e Girar".
🟡 **RF-05** — O botão "Cadastrar e Girar" fica desabilitado até que: Nome preenchido AND Telefone válido AND checkbox de consentimento marcado.
🟡 **RF-06** — Ao submeter, o sistema salva o lead no armazenamento local com os campos: `id` (UUID v4), `nome`, `telefone`, `cpf` (null se vazio), `consentimento` (true), `operador_id`, `timestamp_local`, `sincronizado` (false), `beneficio_sorteado` (null, preenchido após o giro).
🟡 **RF-07** — Após salvar, o formulário emite evento `lead-submetido` com o `id` do lead, e a tela avança para a roleta (o botão Girar fica ativo).
🟡 **RF-08** — O campo `operador_id` é preenchido automaticamente a partir do código de operador salvo no `localStorage` (configurado uma vez pelo operador ao instalar o app).

---

## 5. Comportamentos

🟡 **B-01** — O formulário é exibido como primeira etapa na tela da roleta, sobrepondo a roleta (que fica ao fundo desfocada) ou em tela dedicada antes da roleta.
🟡 **B-02** — Ao pressionar "Cadastrar e Girar", o app exibe feedback visual instantâneo (spinner ou botão desabilitado) enquanto salva no IndexedDB.
🟡 **B-03** — O salvamento no IndexedDB é síncrono do ponto de vista do usuário (< 100ms). Só após confirmação do save local é que o evento `lead-submetido` é emitido.
🟡 **B-04** — O nome do campo CPF inclui "(opcional)" no label. Placeholder: "000.000.000-00".
🟡 **B-05** — O teclado numérico é aberto automaticamente ao focar em Telefone ou CPF (atributo `inputmode="numeric"`).

---

## 6. Edge cases

🟡 **EC-01** — Usuário tenta enviar sem preencher Nome: botão permanece desabilitado; ao tentar clicar (toque no mobile), exibe mensagem inline "Nome é obrigatório".
🟡 **EC-02** — Telefone com formato inválido (ex: menos de 10 dígitos): erro inline "Telefone inválido" ao perder o foco (onblur). Botão permanece desabilitado.
🟡 **EC-03** — CPF preenchido com formato inválido: erro inline "CPF inválido" ao perder o foco. O erro NÃO bloqueia o envio — o campo permanece mas com aviso visual (amarelo, não vermelho), dado que CPF é opcional.
🟡 **EC-04** — IndexedDB indisponível (browser sem suporte ou modo privado sem storage): exibe alerta "Armazenamento local não disponível. O app não pode funcionar sem armazenamento." e bloqueia o formulário.
🟡 **EC-05** — Nome com apenas espaços: trim antes da validação; campo considerado vazio, botão desabilitado.
🟡 **EC-06** — Participante menor de idade: não há validação de idade (fora do escopo v1; premissa: operador valida presencialmente).

---

## 7. Critérios de aceite

🟡 **Dado** que o operador preencheu Nome e Telefone válidos e marcou o checkbox, **Quando** pressiona "Cadastrar e Girar", **Então** o lead é salvo localmente em < 200ms, o botão Girar da roleta fica ativo e o formulário é removido/ocultado.

🟡 **Dado** que o CPF foi deixado em branco, **Quando** o operador submete o formulário, **Então** o lead é salvo com `cpf: null` sem nenhum erro.

🟡 **Dado** que o Nome está vazio, **Quando** o operador tenta pressionar "Cadastrar e Girar", **Então** o botão permanece desabilitado e nenhuma ação é executada.

🟡 **Dado** que a roleta exibiu o resultado e o operador clicou "Nova participação", **Quando** o formulário reaparecer, **Então** todos os campos estarão limpos e o checkbox desmarcado.

---

## 8. Dependências

🟡 — Componente `armazenamento-offline`: método `salvarLead(lead)` que persiste no IndexedDB
🟡 — Componente `roleta`: escuta evento `lead-submetido` para habilitar o botão Girar
🟡 — `crypto.randomUUID()` (nativo nos browsers modernos) para geração de UUID v4

---

## 9. Open questions

🟡 ⚠️ ABERTO: O nome da instituição no texto do consentimento LGPD é configurável pelo admin ou fixo no código? (premissa atual: configurável via variável de ambiente/config)
🟡 ⚠️ ABERTO: O campo `beneficio_sorteado` é preenchido neste componente após o giro, ou o componente `roleta` atualiza o lead diretamente? (premissa atual: `roleta` chama `armazenamento-offline.atualizarLead(id, {beneficio_sorteado})`)

---

## Avaliação de qualidade (modo manual)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TOTAL: 88/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
  Completude:    92/100 (peso 30%)  — 9/9 seções, 8 RFs cobrindo todos os campos e fluxos
  Testabilidade: 90/100 (peso 25%)  — 4 critérios Dado/Quando/Então; RFs verificáveis
  Clareza:       88/100 (peso 20%)  — Schema do lead definido explicitamente; máscara descrita
  Escopo:        85/100 (peso 15%)  — Non-goals claros; CPF opcional bem delimitado
  Edge Cases:    80/100 (peso 10%)  — 6 edge cases incluindo IndexedDB indisponível

Gaps:
  - Configuração do nome da instituição no consentimento (open question)
  - Comportamento ao perder dados entre sessões não coberto
```

---
Gerado por reversa-spec-sdd em 2026-11-03T04:54:00-03:00
Fonte: prd.md
