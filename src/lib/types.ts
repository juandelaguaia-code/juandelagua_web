// Tipos de las tablas principales. Para regenerarlos completos: `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`
export type AppRole = 'owner' | 'admin' | 'moderator' | 'member';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'banned';
export type MembershipTier = 'free' | 'founder' | 'paid' | 'comp';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  location: string;
  links: { label: string; url: string }[];
  role: AppRole;
  status: AccountStatus;
  membership: MembershipTier;
  suspended_until: string | null;
  points: number;
  level: number;
  last_seen_at: string | null;
  created_at: string;
}

export const ROLE_RANK: Record<AppRole, number> = { owner: 4, admin: 3, moderator: 2, member: 1 };
export const ROLE_LABEL: Record<AppRole, string> = { owner: 'Dueño', admin: 'Admin', moderator: 'Moderador', member: 'Miembro' };
export const STATUS_LABEL: Record<AccountStatus, string> = { pending: 'Pendiente', active: 'Activo', suspended: 'Silenciado', banned: 'Expulsado' };
export const MEMBERSHIP_LABEL: Record<MembershipTier, string> = { free: 'Gratis', founder: 'Fundador', paid: 'Pagado', comp: 'Cortesía' };

export const hasRole = (p: Profile | null, min: AppRole) =>
  !!p && (p.status === 'active' || p.status === 'suspended') && ROLE_RANK[p.role] >= ROLE_RANK[min];

export const canRead = (p: Profile | null) => !!p && (p.status === 'active' || p.status === 'suspended');
export const canWrite = (p: Profile | null) =>
  !!p && (p.status === 'active' || (p.status === 'suspended' && !!p.suspended_until && new Date(p.suspended_until) < new Date()));

export const PROFILE_COLUMNS = 'id, username, full_name, avatar_url, bio, location, links, role, status, membership, suspended_until, points, level, last_seen_at, created_at';
