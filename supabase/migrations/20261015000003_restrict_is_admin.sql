-- is_admin() só precisa de ser executável por utilizadores autenticados
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
