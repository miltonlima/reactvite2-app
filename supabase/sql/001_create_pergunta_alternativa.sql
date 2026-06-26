-- Tabelas iniciais para o Banco de Questoes.
-- Execute este arquivo no SQL Editor do Supabase.

create table if not exists public.pergunta (
  id bigint generated always as identity primary key,
  enunciado text not null,
  dificuldade text not null default 'Facil',
  status text not null default 'Ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pergunta_dificuldade_check
    check (dificuldade in ('Facil', 'Media', 'Dificil')),

  constraint pergunta_status_check
    check (status in ('Ativa', 'Rascunho', 'Inativa'))
);

create table if not exists public.alternativa (
  id bigint generated always as identity primary key,
  pergunta_id bigint not null references public.pergunta(id) on delete cascade,
  texto text not null,
  correta boolean not null default false,
  ordem integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint alternativa_ordem_check
    check (ordem > 0)
);

create index if not exists pergunta_status_idx
  on public.pergunta (status);

create index if not exists pergunta_dificuldade_idx
  on public.pergunta (dificuldade);

create index if not exists alternativa_pergunta_id_idx
  on public.alternativa (pergunta_id);

create unique index if not exists alternativa_pergunta_ordem_idx
  on public.alternativa (pergunta_id, ordem);

-- Garante no maximo uma alternativa correta por pergunta.
create unique index if not exists alternativa_pergunta_correta_unica_idx
  on public.alternativa (pergunta_id)
  where correta is true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pergunta_updated_at on public.pergunta;
create trigger set_pergunta_updated_at
before update on public.pergunta
for each row
execute function public.set_updated_at();

drop trigger if exists set_alternativa_updated_at on public.alternativa;
create trigger set_alternativa_updated_at
before update on public.alternativa
for each row
execute function public.set_updated_at();

alter table public.pergunta enable row level security;
alter table public.alternativa enable row level security;

-- Politicas iniciais liberadas para usuario autenticado.
-- Ajuste depois conforme os perfis do sistema.
drop policy if exists "pergunta_select_authenticated" on public.pergunta;
create policy "pergunta_select_authenticated"
on public.pergunta
for select
to authenticated
using (true);

drop policy if exists "pergunta_insert_authenticated" on public.pergunta;
create policy "pergunta_insert_authenticated"
on public.pergunta
for insert
to authenticated
with check (true);

drop policy if exists "pergunta_update_authenticated" on public.pergunta;
create policy "pergunta_update_authenticated"
on public.pergunta
for update
to authenticated
using (true)
with check (true);

drop policy if exists "pergunta_delete_authenticated" on public.pergunta;
create policy "pergunta_delete_authenticated"
on public.pergunta
for delete
to authenticated
using (true);

drop policy if exists "alternativa_select_authenticated" on public.alternativa;
create policy "alternativa_select_authenticated"
on public.alternativa
for select
to authenticated
using (true);

drop policy if exists "alternativa_insert_authenticated" on public.alternativa;
create policy "alternativa_insert_authenticated"
on public.alternativa
for insert
to authenticated
with check (true);

drop policy if exists "alternativa_update_authenticated" on public.alternativa;
create policy "alternativa_update_authenticated"
on public.alternativa
for update
to authenticated
using (true)
with check (true);

drop policy if exists "alternativa_delete_authenticated" on public.alternativa;
create policy "alternativa_delete_authenticated"
on public.alternativa
for delete
to authenticated
using (true);
