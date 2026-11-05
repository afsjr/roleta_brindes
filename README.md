# Roleta de Benefícios

PWA offline-first para captação de leads em ações de rua, com sorteio de benefícios, registro do prêmio e sincronização com Supabase.

## O que o app faz

- Operador abre a roleta no celular, sem login.
- Antes do giro, informa nome, telefone/WhatsApp, CPF opcional e aceite LGPD.
- O lead é salvo no aparelho e enviado ao Supabase quando há internet.
- A roleta sorteia um prêmio localmente e o prêmio é gravado no lead.
- Cada aparelho guarda os leads locais para o operador saber se já cadastrou aquela pessoa.
- O operador vê o resumo **Seus cadastros hoje: N / 50** e o link **Ver meus leads**, que lista somente os cadastros feitos naquele aparelho com o código do operador atual e telefone mascarado.
- A meta diária é configurável em `META_LEADS_DIA` no `js/config.js` (padrão: 50).
- Apenas o administrador autenticado consulta a tabela completa de leads e altera benefícios.
- O app continua funcionando offline; os pendentes sobem ao reconectar.

## Estrutura

```
.
├── index.html
├── manifest.json
├── sw.js
├── vercel.json
├── package.json
├── assets/icons/
├── css/
│   ├── global.css
│   ├── components.css
│   └── roleta.css
├── js/
│   ├── utils.js       # UUID, CPF, máscaras, sorteio, CSV
│   ├── config.js      # URL e anon key do Supabase
│   ├── auth.js        # login do administrador via Supabase Auth
│   ├── storage.js     # IndexedDB, cache de benefícios e sync
│   ├── roleta.js      # Canvas 2D e sorteio ponderado
│   ├── cadastro.js    # validações, LGPD e deduplicação local
│   ├── admin.js       # CRUD remoto e exportação CSV
│   ├── audio.js
│   ├── confetti.js
│   └── app.js         # orquestração da interface
├── supabase/
│   ├── schema.sql
│   └── README.md
├── tests/
│   └── utils.test.js
└── roleta.html        # legado preservado
```

## Rodar localmente

Requisito: Python 3 ou qualquer servidor estático.

```bash
npm run dev
```

Abra http://localhost:8000. Em produção é obrigatório HTTPS para o Service Worker e a instalação do PWA funcionarem. Em `localhost` o navegador libera por exceção.

## Configurar o Supabase

Siga `supabase/README.md`. Resumo:

1. Crie o projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Crie o usuário administrador em Authentication > Users.
4. Preencha `js/config.js` com Project URL e anon public key.

Sem essa configuração o app funciona localmente para cadastro e giro, mas não envia leads e o painel administrativo fica indisponível.

## Administração

- Toque no ícone de engrenagem.
- Entre com o e-mail e a senha do usuário criado no Supabase.
- Em **Prêmios da Roleta**, adicione, edite, pause ou exclua benefícios. As alterações vão para o Supabase e são puxadas pelos aparelhos dos operadores.
- Em **Leads Captados**, veja os leads remotos e os pendentes locais, atualize e baixe o CSV.
- O operador não tem acesso à tabela completa nem consegue alterar benefícios: o RLS bloqueia no servidor.

## Segurança e LGPD

- A chave `anon` é pública; a proteção é feita por RLS.
- Operador anônimo: INSERT em `leads` e SELECT apenas de benefícios ativos.
- Administrador autenticado: SELECT em todos os leads e CRUD de benefícios.
- O prêmio é gravado pela função `set_lead_prize`, que só altera `beneficio_sorteado`, `girado_em` e `status`.
- Nunca coloque a chave `service_role` no front-end.
- O app registra consentimento, data/hora e versão do termo.
- Para publicar, configure também `POLITICA_PRIVACIDADE_URL` em `js/config.js`; o link aparece no texto de consentimento.
- O INSERT anônimo em `leads` é necessário para o fluxo offline. Em eventos abertos ao público, considere rate limit, CAPTCHA ou uma Edge Function para conter spam.

## Sync e offline

- Lead novo: salvo no IndexedDB e enviado ao Supabase.
- Prêmio: gravado localmente após o giro e enviado via RPC.
- Se o envio falhar, o lead fica pendente e é tentado novamente ao abrir o app, ao reconectar ou ao tocar no badge de pendências.
- Benefícios são cacheados no aparelho e atualizados ao abrir o app e ao reconectar.
- O admin precisa de internet para alterar benefícios.

## Deploy

### Vercel (recomendado)

1. Suba o repositório no GitHub.
2. Na Vercel, escolha **Add New Project** e importe o repositório.
3. Framework Preset: **Other**.
4. Root Directory: `.`.
5. Build Command: vazio.
6. Output Directory: `.`.
7. Deploy.

O `vercel.json` já define cache curto para `sw.js`, `manifest.json` e `index.html`.

### GitHub Pages

1. Suba o repositório no GitHub.
2. Em **Settings > Pages**, selecione **Deploy from a branch**.
3. Branch `main`, pasta `/ (root)`.
4. Acesse a URL publicada.

Os caminhos são relativos, então o app funciona em subpasta. Para instalar o PWA e usar o Service Worker, a página precisa estar em HTTPS.

## Testes

```bash
npm test
```

Os testes cobrem CPF, máscaras, UUID, sorteio ponderado, escape HTML, CSV e detecção de configuração do Supabase.

## Checklist de campo

- [ ] Supabase configurado e schema executado.
- [ ] Usuário admin criado e login testado.
- [ ] Benefícios conferidos no painel.
- [ ] Deploy em HTTPS.
- [ ] PWA instalado nos 4 celulares.
- [ ] Teste offline: cadastrar 2 leads, recarregar offline, reconectar e conferir no Supabase.
- [ ] Teste de prêmio: conferir `beneficio_sorteado` no banco.
- [ ] Teste de permissão: operador não consegue abrir dados de leads nem alterar benefícios.
- [ ] Teste do contador **Meus leads**: conferir N/50 e o filtro pelo código do operador.
- [ ] Exportação CSV conferida no Excel.

## Observações

- A visão **Meus leads** é local ao aparelho. Para consolidar leads de um operador entre vários aparelhos, use o painel administrativo.
- `roleta.html` é o arquivo legado e permanece intacto.
- `_reversa_forward/001-roleta-beneficios-mvp/app/` é uma cópia histórica da primeira versão. A fonte atual é a raiz do projeto.
- As especificações do Reversa estão em `_reversa_sdd/` e `_reversa_forward/`.
