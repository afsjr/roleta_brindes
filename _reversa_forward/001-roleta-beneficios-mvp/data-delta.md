# Data Delta: Roleta de Benefícios — MVP Completo

> Identificador: `001-roleta-beneficios-mvp`
> Data: `2026-11-03`
> Requirements: `_reversa_forward/001-roleta-beneficios-mvp/requirements.md`

## 1. Visão Geral

Este projeto greenfield introduz duas entidades principais:
1. `leads`: registros de captação realizados pelos operadores na rua.
2. `beneficios`: opções de prêmios/descontos configurados pelo administrador para sortear na roleta.

## 2. Esquema Relacional (Supabase / PostgreSQL)

### 2.1 Tabela `leads`
```sql
-- Habilita extensão para UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    cpf TEXT,
    consentimento BOOLEAN NOT NULL DEFAULT true,
    operador_id TEXT NOT NULL,
    beneficio_sorteado TEXT,
    timestamp_local TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_leads_operador ON public.leads(operador_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política de inserção pública (chave anon para operadoras na rua)
CREATE POLICY "Permitir insercao anonima de leads"
ON public.leads FOR INSERT
TO anon
WITH CHECK (true);

-- Política de leitura/gerenciamento (apenas admin autenticado via service_role ou auth)
CREATE POLICY "Permitir leitura apenas para admin"
ON public.leads FOR SELECT
TO authenticated, service_role
USING (true);
```

### 2.2 Tabela `beneficios`
```sql
CREATE TABLE IF NOT EXISTS public.beneficios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    peso INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    deletado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;

-- Leitura pública de benefícios ativos (para a roleta)
CREATE POLICY "Permitir leitura anonima de beneficios ativos"
ON public.beneficios FOR SELECT
TO anon
USING (ativo = true AND deletado_em IS NULL);

-- Gerenciamento total para admin (service_role)
CREATE POLICY "Permitir gerenciamento total de beneficios para admin"
ON public.beneficios FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);
```

## 3. Esquema de Armazenamento Local (IndexedDB)

### Store: `leads`
- Chave: `id` (UUID gerado localmente via `crypto.randomUUID()`)
- Estrutura:
  ```json
  {
    "id": "c1f7b0a8-...",
    "nome": "João da Silva",
    "telefone": "(11) 98765-4321",
    "cpf": "123.456.789-00",
    "consentimento": true,
    "operador_id": "OPERADOR-01",
    "beneficio_sorteado": "Bolsa 50%",
    "timestamp_local": "2026-11-03T10:00:00.000Z",
    "sincronizado": false
  }
  ```

### Store: `beneficios`
- Chave: `"ativos"`
- Estrutura: array de objetos de benefícios em cache para uso offline imediato.

---
Gerado por reversa-plan em 2026-11-03
