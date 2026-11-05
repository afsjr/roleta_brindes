-- Roleta de Benefícios — schema Supabase
-- Execute este arquivo no SQL Editor do projeto Supabase.
-- Idempotente: pode ser executado mais de uma vez.

create extension if not exists pgcrypto;

grant usage on schema public to anon;
grant usage on schema public to authenticated;

-- =========================================================
-- Leads
-- =========================================================
create table if not exists public.leads (
    id uuid primary key,
    nome text not null,
    telefone text not null,
    cpf text,
    consentimento boolean not null default true,
    consentimento_em timestamptz not null default now(),
    consentimento_versao text not null default 'v1',
    operador_id text not null,
    beneficio_sorteado text,
    girado_em timestamptz,
    status text not null default 'pendente_giro' check (status in ('pendente_giro', 'completo')),
    timestamp_local timestamptz not null,
    created_at timestamptz not null default now()
);

alter table public.leads add column if not exists consentimento_em timestamptz not null default now();
alter table public.leads add column if not exists consentimento_versao text not null default 'v1';
alter table public.leads add column if not exists girado_em timestamptz;
alter table public.leads add column if not exists status text not null default 'pendente_giro';
alter table public.leads add column if not exists created_at timestamptz not null default now();

create index if not exists idx_leads_operador on public.leads (operador_id);
create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_leads_timestamp_local on public.leads (timestamp_local desc);

alter table public.leads enable row level security;

drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
on public.leads for insert
to anon
with check (true);

drop policy if exists "leads_select_admin" on public.leads;
create policy "leads_select_admin"
on public.leads for select
to authenticated
using (true);

revoke update, delete on public.leads from anon;
revoke select on public.leads from anon;
grant insert on public.leads to anon;
grant select on public.leads to authenticated;

-- Grava somente o prêmio, sem expor UPDATE amplo para o operador.
create or replace function public.set_lead_prize(p_id uuid, p_beneficio text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_beneficio is null or length(trim(p_beneficio)) = 0 then
        return;
    end if;

    update public.leads
       set beneficio_sorteado = trim(p_beneficio),
           girado_em = now(),
           status = 'completo'
     where id = p_id
       and beneficio_sorteado is null;
end;
$$;

revoke all on function public.set_lead_prize(uuid, text) from public;
grant execute on function public.set_lead_prize(uuid, text) to anon;
grant execute on function public.set_lead_prize(uuid, text) to authenticated;

-- =========================================================
-- Benefícios
-- =========================================================
create table if not exists public.beneficios (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    peso integer not null default 1 check (peso between 1 and 100),
    ativo boolean not null default true,
    deletado_em timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.beneficios add column if not exists deletado_em timestamptz;
alter table public.beneficios add column if not exists updated_at timestamptz not null default now();
alter table public.beneficios alter column id set default gen_random_uuid();

create index if not exists idx_beneficios_ativos
    on public.beneficios (ativo)
    where deletado_em is null;

alter table public.beneficios enable row level security;

drop policy if exists "beneficios_select_anon" on public.beneficios;
create policy "beneficios_select_anon"
on public.beneficios for select
to anon
using (ativo = true and deletado_em is null);

drop policy if exists "beneficios_admin_all" on public.beneficios;
create policy "beneficios_admin_all"
on public.beneficios for all
to authenticated
using (true)
with check (true);

grant select on public.beneficios to anon;
grant select, insert, update, delete on public.beneficios to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_beneficios_updated_at on public.beneficios;
create trigger trg_beneficios_updated_at
before update on public.beneficios
for each row
execute function public.set_updated_at();

-- =========================================================
-- Benefícios iniciais (somente se a tabela estiver vazia)
-- =========================================================
insert into public.beneficios (nome, peso, ativo)
select v.nome, v.peso, true
from (
    values
        ('Bolsa de 50%', 1),
        ('Isenção de Matrícula', 2),
        ('Kit Estudante', 3),
        ('Desconto de 30%', 2),
        ('Curso Grátis de Redação', 2),
        ('Mentoria de Carreira', 1)
) as v(nome, peso)
where not exists (select 1 from public.beneficios);
