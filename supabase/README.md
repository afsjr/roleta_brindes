# Configuração do Supabase

Este projeto usa o Supabase como banco central de leads e benefícios. O app continua funcionando offline e sincroniza quando há internet.

## 1. Criar o projeto

1. Acesse https://supabase.com e crie um projeto gratuito.
2. Aguarde a inicialização do banco.

## 2. Executar o schema

1. No painel do Supabase, abra **SQL Editor**.
2. Cole todo o conteúdo de `supabase/schema.sql`.
3. Clique em **Run**.

O script cria:

- `public.leads` — leads captados, com consentimento LGPD, operador, prêmio e status.
- `public.beneficios` — prêmios da roleta.
- Índices, RLS e a função `set_lead_prize`, usada para gravar o prêmio depois do giro sem liberar UPDATE amplo para o operador.
- Seis benefícios iniciais, somente se a tabela estiver vazia.

## 3. Criar o usuário administrador

1. Abra **Authentication > Users**.
2. Clique em **Add user**.
3. Informe o e-mail e a senha do administrador.
4. Marque a opção de confirmar o e-mail automaticamente, se disponível.
5. Guarde essas credenciais. Elas serão usadas no painel administrativo do app.
6. Em **Authentication > Providers > Email**, desative **Enable Signup** para impedir que estranhos criem contas autenticadas.

Não é necessário cadastro público. O app não permite criar usuários, e a policy de leitura de leads vale para qualquer usuário autenticado; por isso, mantenha o signup desabilitado.

## 4. Copiar as chaves para o app

1. Abra **Project Settings > API**.
2. Copie **Project URL** e **anon public key**.
3. Edite `js/config.js`:

```js
const CONFIG = {
    SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOi...",
    // ...
};
```

A chave `anon` é pública por design. A proteção real vem do RLS:

- Operador anônimo: pode inserir lead e ler apenas benefícios ativos.
- Administrador autenticado: pode ler todos os leads e gerenciar benefícios.
- Operador não consegue ler a tabela de leads nem alterar benefícios.

Nunca coloque a chave `service_role` no front-end.

## 5. Testar

1. Rode o app localmente (veja o README da raiz).
2. Cadastre um lead e gire a roleta.
3. Confira em **Table Editor > leads** que o registro chegou com `beneficio_sorteado`.
4. Entre no painel admin do app com o usuário criado no passo 3.
5. Altere um benefício e confirme que ele aparece na roleta.

## Solução de problemas

- **401/403 no painel**: usuário não existe, senha incorreta ou sessão expirada. Entre novamente.
- **Leads não chegam**: confira `SUPABASE_URL`, `SUPABASE_ANON_KEY`, conexão e o console do navegador.
- **Prêmio nulo no banco**: a função `set_lead_prize` não foi criada. Execute o `schema.sql` novamente.
- **Benefícios não atualizam**: confirme a policy `beneficios_select_anon` e se o benefício está ativo e sem `deletado_em`.
