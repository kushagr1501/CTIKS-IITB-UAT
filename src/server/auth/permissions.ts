export const PERMISSIONS = [
  'faculty.read',
  'faculty.create',
  'faculty.update',
  'faculty.delete',
  'faculty.self.read',
  'faculty.self.update',
  'activity.read',
  'activity.create',
  'activity.update',
  'activity.delete',
  'research.read',
  'research.create',
  'research.update',
  'research.delete',
  'audit.read',
  'audit.export',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type AccountRole = 'ADMIN' | 'CORE_FACULTY';

const ROLE_PERMISSIONS: Record<AccountRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  CORE_FACULTY: ['faculty.self.read', 'faculty.self.update'],
};

export function hasPermission(role: string, permission: Permission) {
  return Object.hasOwn(ROLE_PERMISSIONS, role) && ROLE_PERMISSIONS[role as AccountRole].includes(permission);
}

export function canSignIn(role: string, linkedCategory?: string | null) {
  return role === 'ADMIN' || (role === 'CORE_FACULTY' && linkedCategory === 'CORE');
}
