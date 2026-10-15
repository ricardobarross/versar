-- Quando um utilizador é criado no Auth com um e-mail pré-registado em public.admins,
-- liga-o automaticamente (preenche admins.user_id).
create or replace function public.link_admin_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.admins set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;
revoke execute on function public.link_admin_user() from public, anon, authenticated;

create trigger on_auth_user_created_link_admin
  after insert on auth.users
  for each row execute function public.link_admin_user();

-- Para dar acesso ao painel a alguém:
--   insert into public.admins (email, name) values ('email@exemplo.com', 'Nome');
-- e depois criar o utilizador em Authentication > Users > Add user (Auto Confirm).
