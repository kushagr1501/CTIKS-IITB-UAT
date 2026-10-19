import type { Where } from 'better-auth/adapters';

/** Translate Better Auth's password-account identity into our single user foreign key. */
export function credentialAccountWhere(where: Where[] = []): Where[] | null {
  const virtualFields = new Set(['providerId', 'accountId']);
  if (
    where.some((condition) => virtualFields.has(condition.field)) &&
    where.some((condition) => condition.connector === 'OR')
  )
    throw new Error('Credential identity queries must use AND conditions.');
  const translated: Where[] = [];
  for (const condition of where) {
    if (!virtualFields.has(condition.field)) {
      translated.push(condition);
      continue;
    }
    if (
      (condition.operator && condition.operator !== 'eq') ||
      condition.mode === 'insensitive' ||
      typeof condition.value !== 'string'
    )
      throw new Error('Unsupported credential identity comparison.');
    if (condition.field === 'providerId') {
      if (condition.value !== 'credential') return null;
    } else translated.push({ ...condition, field: 'userId' });
  }
  return translated;
}
