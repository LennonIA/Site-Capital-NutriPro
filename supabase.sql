-- Capital Nutri — tabela de leads do site.
-- Como usar: Supabase > SQL Editor > New query > cole este arquivo inteiro > Run.

create table if not exists public.leads (
  id             text primary key,               -- protocolo CN-AAAAMMDD-XXXXXX
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz,
  status         text not null default 'novo'
                 check (status in ('novo','em contato','proposta enviada','ganho','perdido','sem perfil')),
  empresa        text not null,
  segmento       text not null,
  cidade         text not null,
  uf             char(2) not null,
  unidades       text,
  colaboradores  text,
  necessidades   text[] not null default '{}',
  momento        text not null,
  urgencia       text check (urgencia in ('alta','media','baixa')),
  desafio        text,
  nome           text not null,
  whatsapp       text not null,
  email          text not null,
  periodo        text,
  origem         text,
  contexto       jsonb not null default '{}'::jsonb,  -- serviço de interesse, resumo do diagnóstico e da simulação
  consentimento  boolean not null,
  notas          text not null default '',
  ip_hash        text                                 -- hash do IP (não o IP) para limitar envios repetidos
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);
create index if not exists leads_ip_recente_idx on public.leads (ip_hash, criado_em);

-- Segurança: RLS ativado e NENHUMA política pública.
-- Só o servidor (Vercel), com a chave service_role, consegue ler ou gravar.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
