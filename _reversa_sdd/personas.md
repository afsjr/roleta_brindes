# Personas e Jornadas — Roleta de Benefícios

> Selo 🟡 PLANEJADO em todos os itens.

## Persona 1: Operador de Campo

- **Perfil:** 🟡 Promotor/captador da instituição de ensino, trabalha na rua em ações presenciais de captação de leads.
- **Contexto:** 🟡 Está em ponto de grande fluxo (próximo a local de prova do ENEM, escola ou shopping), com o celular na mão, abordando transeuntes. Pode ou não ter conexão à internet.
- **Nível técnico:** 🟡 Iniciante, em uso de apps de formulário e sistemas web.
- **Dor principal:** 🟡 Processo de coleta de dados lento e chato (prancheta + caneta), participantes perdem interesse enquanto esperam. Dados físicos se perdem ou são ilegíveis.
- **Objetivo final:** 🟡 Atingir a meta de leads do dia (≈ 50) com o mínimo de fricção e sem depender de internet.

### Jornada principal
1. 🟡 Abrir o app no celular (PWA instalada na tela inicial)
2. 🟡 Abordar o participante e apresentar o sorteio de benefícios
3. 🟡 Cadastrar nome, telefone (e CPF se o participante aceitar)
4. 🟡 Exibir a tela de consentimento LGPD e registrar aceite
5. 🟡 Girar a roleta junto com o participante e exibir o prêmio sorteado
6. 🟡 Repetir o processo para o próximo participante
7. 🟡 Ao final do dia (ou quando houver wi-fi), sincronizar todos os leads coletados offline

---

## Persona 2: Administrador / Gestor da Campanha

- **Perfil:** 🟡 Coordenador de marketing ou captação da instituição de ensino, responsável por configurar as ações e analisar os resultados.
- **Contexto:** 🟡 Está no escritório ou em home-office, com computador, antes e depois das ações de campo. Acessa o sistema para preparar a roleta e consultar os leads captados.
- **Nível técnico:** 🟡 Intermediário, familiarizado com planilhas, e-mail e painéis web simples (ex.: Google Forms, Sheets).
- **Dor principal:** 🟡 Não tem visibilidade em tempo real dos leads captados; dados chegam com atraso via planilha manual ou foto de prancheta.
- **Objetivo final:** 🟡 Ter a lista de leads qualificados disponível rapidamente para o time comercial fazer follow-up no mesmo dia da ação.

### Jornada principal
1. 🟡 Acessar o painel admin antes da ação e cadastrar/editar os benefícios da roleta
2. 🟡 Verificar se os operadores estão com o app configurado (código de acesso distribuído)
3. 🟡 Acompanhar o total de leads sincronizados durante o dia (via painel Supabase ou tela de admin)
4. 🟡 Ao fim da ação, exportar ou consultar os leads para repassar ao comercial
5. 🟡 Filtrar leads por operador, data e completude de dados (com/sem CPF)

---

## Persona 3: Participante (Lead)

- **Perfil:** 🟡 Jovem ou adulto (17–30 anos) em processo de escolha de curso superior ou técnico, abordado na rua durante o período do ENEM.
- **Contexto:** 🟡 Está em deslocamento, tem pouco tempo, mas é receptivo a interações rápidas e gamificadas (sorteio, prêmio imediato).
- **Nível técnico:** 🟡 Iniciante a intermediário, usa smartphone diariamente mas não tem familiaridade com formulários formais.
- **Dor principal:** 🟡 Desconhece as opções de cursos disponíveis e tem receio de dar dados pessoais (especialmente CPF) para desconhecidos.
- **Objetivo final:** 🟡 Concorrer a um brinde/desconto de forma rápida e sem compromisso, sem sentir que está sendo "forçado" a se matricular.

### Jornada principal
1. 🟡 Ser abordado pelo operador e receber explicação rápida do sorteio
2. 🟡 Ver a tela da roleta com os benefícios disponíveis
3. 🟡 Decidir se aceita fornecer nome e telefone (CPF opcional)
4. 🟡 Ler e aceitar o termo de consentimento simples
5. 🟡 Girar a roleta e ver o resultado animado na tela
6. 🟡 Receber informação sobre o benefício ganho e como resgatar

---
Gerado por reversa-researcher em 2026-11-03T04:52:00-03:00
Fonte: ideation.md
