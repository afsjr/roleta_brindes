# Onboarding: Como Testar a Roleta de Benefícios

> Identificador: `001-roleta-beneficios-mvp`
> Data original: `2026-11-03`
> Atualizado em: `2026-11-05` (v2 — Supabase Auth, RLS e prêmio sincronizado)

Este guia orienta o teste da versão atual, que fica na raiz do projeto. A pasta `app/` deste diretório é a cópia histórica do MVP e não deve ser usada como fonte.

## 1. Pré-requisitos
- Um navegador moderno (Google Chrome, Edge, Safari ou Firefox).
- Um servidor local estático simples na raiz do projeto: `npm run dev` ou `python3 -m http.server 8000`.
- Um projeto Supabase com `supabase/schema.sql` executado e um usuário admin criado em **Authentication > Users** (veja `supabase/README.md`).

## 2. Passo a Passo de Teste Local

### Teste 1: Primeiro Acesso e Onboarding do Operador
1. Abra o app no navegador (`http://localhost:8000`).
2. O app exibirá o modal de Onboarding solicitando o identificador do operador.
3. Digite um código (ex.: `OP-JOAO`) e clique em **Começar**.
4. Verifique que o código foi salvo e a tela principal da Roleta é exibida.

### Teste 2: Cadastro de Lead e Giro da Roleta
1. Preencha o Nome Completo (ex.: `Carlos Santos`).
2. Preencha o Telefone com DDD (ex.: `11988887777` — a máscara deve formatar como `(11) 98888-7777`).
3. Deixe o CPF em branco para testar a opcionalidade.
4. Marque a caixa de aceite dos termos LGPD.
5. Observe que o botão **Cadastrar e Girar** se torna ativo.
6. Clique no botão. O lead é salvo localmente e a roleta gira automaticamente por cerca de 4 segundos.
7. O modal exibe o prêmio sorteado. O prêmio é gravado no lead local e enviado ao Supabase quando há internet.
8. Clique em **Nova Participação**. O formulário reaparece pronto para o próximo participante.

### Teste 3: Funcionamento Offline
1. Abra o DevTools (F12) -> aba **Network** (Rede) -> selecione o modo **Offline**.
2. Realize 2 novos cadastros com giros de roleta.
3. Observe que o indicador no topo do app passa para **Offline** e o contador de leads pendentes mostra **2**.
4. Recarregue a página (F5) ainda em modo Offline. O app continua carregando e mantém os 2 leads pendentes.
5. Confirme que a roleta continua sorteando com o cache local de benefícios.

### Teste 4: Sincronização Automática
1. No DevTools -> Network, mude de **Offline** para **Online** (ou religue o Wi-Fi).
2. Na primeira carga, o app puxa os benefícios ativos do Supabase.
3. O evento de reconexão dispara a sincronização dos leads pendentes.
4. Observe o contador de pendentes zerando.
5. No Supabase, em **Table Editor > leads**, confira que o lead tem `beneficio_sorteado`, `girado_em` e `status = 'completo'`.

### Teste 5: Painel Administrativo
1. Toque no ícone de engrenagem no topo.
2. Entre com o e-mail e a senha do usuário criado em **Authentication > Users** no Supabase.
3. Em **Prêmios da Roleta**, adicione um novo prêmio (ex.: `Bolsa 100%`) e clique em **+ Adicionar**.
4. Edite, pause ou exclua um prêmio e confirme que a alteração vai para o Supabase.
5. Em **Leads Captados**, clique em **Atualizar** e confira os leads remotos e locais.
6. Clique em **Baixar CSV** e confira o arquivo no Excel.

### Teste 6: Permissões
1. Saia do painel.
2. Confirme que o operador não vê a tabela de leads nem consegue alterar prêmios.
3. No Supabase, confirme que o RLS bloqueia SELECT de `leads` com a chave `anon` e permite somente INSERT.

---

Atualizado por reversa-forward em 2026-11-05.
