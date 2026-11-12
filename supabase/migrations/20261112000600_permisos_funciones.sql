-- =====================================================================
-- Endurecimiento: quién puede llamar cada función por la API (/rest/v1/rpc/...)
-- - Funciones de trigger: nadie las llama directo (los triggers se ejecutan igual).
-- - Funciones de administración y de la comunidad: solo usuarios con sesión (validan el rol por dentro).
-- - has_role: también anónimos, porque la usan las políticas públicas del blog y del catálogo de cursos.
-- =====================================================================

revoke execute on function
  public.comments_after(), public.comments_guard(), public.events_notify(), public.handle_new_user(),
  public.join_requests_auto(), public.levels_recalc(), public.likes_after(), public.likes_guard(),
  public.points_apply(), public.posts_after_insert(), public.posts_guard(), public.blog_posts_touch()
from public, anon, authenticated;

revoke execute on function
  public.adjust_points(uuid, int, text),
  public.set_member_role(uuid, public.app_role),
  public.set_member_status(uuid, public.account_status, timestamptz),
  public.set_member_membership(uuid, public.membership_tier),
  public.review_join_request(bigint, boolean),
  public.leaderboard(int, int),
  public.level_distribution(),
  public.course_outline(bigint),
  public.can_access_course(bigint),
  public.event_location(bigint),
  public.is_active_member(),
  public.is_staff(),
  public.is_member_reader()
from public, anon;

grant execute on function
  public.adjust_points(uuid, int, text),
  public.set_member_role(uuid, public.app_role),
  public.set_member_status(uuid, public.account_status, timestamptz),
  public.set_member_membership(uuid, public.membership_tier),
  public.review_join_request(bigint, boolean),
  public.leaderboard(int, int),
  public.level_distribution(),
  public.course_outline(bigint),
  public.can_access_course(bigint),
  public.event_location(bigint),
  public.is_active_member(),
  public.is_staff(),
  public.is_member_reader()
to authenticated;
