# Spec SDD: Roleta (roleta)

> Selo 🟡 PLANEJADO. Componente do projeto roleta_benefícios.

**Componente:** roleta
**Versão:** 1.0
**Data:** 2026-11-03
**Autor:** reversa-spec-sdd
**Status:** rascunho
**Fonte:** prd.md, ideation.md, personas.md

---

## 1. Problema

🟡 O operador de campo precisa de uma tela visualmente atraente que exiba os benefícios disponíveis e anime o giro de sorteio na frente do participante, tornando a abordagem engajante. O resultado sorteado deve ser exibido de forma clara e imediata, sem depender de internet.

---

## 2. Objetivos

🟡 — Exibir a roleta com todos os benefícios ativos cadastrados pelo admin
🟡 — Executar animação de giro (spin) determinística: resultado calculado localmente antes do giro, animação apenas cosmética
🟡 — Exibir o prêmio sorteado com destaque visual após o giro
🟡 — Funcionar 100% offline (benefícios carregados do armazenamento local)

---

## 3. Non-goals

🟡 — Não sorteia resultado em tempo real no servidor (offline-first, sem round-trip)
🟡 — Não salva o resultado do giro como dado do lead (apenas coleta nome/telefone/CPF)
🟡 — Não tem animação 3D ou som — animação simples em CSS/Canvas
🟡 — Não exibe histórico de resultados anteriores nesta tela

---

## 4. Requisitos funcionais

🟡 **RF-01** — A tela exibe uma roleta circular dividida em fatias proporcionais, uma por benefício ativo. Cada fatia tem cor distinta e label com o nome do benefício.
🟡 **RF-02** — Antes de girar, o sistema deve verificar se há pelo menos 1 benefício ativo cadastrado. Se não houver, exibe mensagem: "Nenhum benefício cadastrado. Acesse o painel admin."
🟡 **RF-03** — O botão "Girar" só fica ativo após o formulário de cadastro do lead ser submetido com sucesso (integração com componente `cadastro-lead`).
🟡 **RF-04** — Ao pressionar "Girar", a roleta anima por 3 a 5 segundos (com desaceleração gradual) e para na fatia do prêmio sorteado. O sorteio é feito com `Math.random()` ponderado pelo peso de cada benefício.
🟡 **RF-05** — Após o giro, o prêmio sorteado é exibido em sobreposição (modal ou banner) com o nome do benefício e instrução de resgate.
🟡 **RF-06** — O modal de resultado tem botão "Nova participação" que reinicia o formulário de cadastro e reseta a roleta, sem recarregar a página.
🟡 **RF-07** — Os benefícios são lidos do armazenamento local (componente `armazenamento-offline`). A roleta não faz requisição de rede no momento do giro.

---

## 5. Comportamentos

🟡 **B-01** — A animação da roleta usa `requestAnimationFrame` ou CSS transition. A roleta deve rodar no mínimo 3 voltas completas antes de desacelerar.
🟡 **B-02** — O peso de cada benefício no sorteio é configurável pelo admin (padrão: peso igual para todos). Se não configurado, todos têm a mesma probabilidade.
🟡 **B-03** — A roleta renderiza corretamente de 2 a 12 benefícios. Acima de 12, os labels são truncados com reticências.
🟡 **B-04** — A tela da roleta é a tela principal do app (home). O operador vê a roleta ao abrir o app.

---

## 6. Edge cases

🟡 **EC-01** — 1 único benefício cadastrado: a roleta exibe 1 fatia ocupando 360°; o "giro" ocorre normalmente e sempre retorna aquele benefício.
🟡 **EC-02** — Benefício com nome muito longo (> 20 chars): label truncado com reticências; tooltip ou modal de resultado exibe o nome completo.
🟡 **EC-03** — Tela pequena (celular 360px): roleta reduz o diâmetro proporcionalmente, mantendo botão "Girar" visível sem scroll.
🟡 **EC-04** — Usuário pressiona "Girar" durante a animação: o botão fica desabilitado enquanto a animação está em curso.
🟡 **EC-05** — Benefícios atualizados pelo admin enquanto o operador estava offline: a roleta usa a versão local até o próximo sync; ao sincronizar, relê os benefícios atualizados e atualiza o estado local.

---

## 7. Critérios de aceite

🟡 **Dado** que o admin cadastrou 4 benefícios e o operador abriu o app offline, **Quando** o operador abre a tela da roleta, **Então** a roleta exibe 4 fatias coloridas com os nomes dos benefícios, sem erro.

🟡 **Dado** que o cadastro do lead foi submetido com sucesso, **Quando** o operador pressiona "Girar", **Então** a animação inicia, dura entre 3 e 5 segundos, e para em um benefício. O modal de resultado exibe o nome do prêmio.

🟡 **Dado** que o modal de resultado está aberto, **Quando** o operador pressiona "Nova participação", **Então** o formulário de cadastro é resetado e a roleta volta ao estado inicial, pronta para o próximo participante.

---

## 8. Dependências

🟡 — Componente `cadastro-lead`: fornece evento de "lead submetido" que habilita o botão Girar
🟡 — Componente `armazenamento-offline`: fornece lista de benefícios ativos do cache local
🟡 — Nenhuma dependência de rede no fluxo de giro

---

## 9. Open questions

🟡 ⚠️ ABERTO: O peso de cada benefício é configurável pelo admin na v1, ou todos têm peso igual? (premissa atual: peso igual)
🟡 ⚠️ ABERTO: O resultado do giro deve ser salvo junto com o lead para análise futura? (premissa atual: não salva)

---

## Avaliação de qualidade (modo manual)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORE TOTAL: 84/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakdown:
  Completude:    90/100 (peso 30%)  — 9/9 seções preenchidas, 7 RFs cobrem escopo
  Testabilidade: 85/100 (peso 25%)  — 3 critérios Dado/Quando/Então; RFs verificáveis
  Clareza:       80/100 (peso 20%)  — 2 open questions marcadas; sem frases vagas
  Escopo:        85/100 (peso 15%)  — Non-goals explícitos e claros
  Edge Cases:    75/100 (peso 10%)  — 5 edge cases cobertos

Gaps:
  - Peso dos benefícios não definido (open question)
  - Comportamento de acessibilidade (alto contraste, tamanho de fonte) ausente
```

---
Gerado por reversa-spec-sdd em 2026-11-03T04:54:00-03:00
Fonte: prd.md
