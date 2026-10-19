import { FACULTY_CATEGORIES, type AuditRecord } from './types';

const fieldLabels: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  sections: 'Sections',
  eventStartAt: 'Start (IST)',
  eventEndAt: 'End (IST)',
  venue: 'Venue',
  registrationUrl: 'Link URL',
  linkLabel: 'Link label',
  name: 'Name',
  slug: 'Page URL name',
  category: 'Category',
  designation: 'Designation',
  department: 'Department',
  interests: 'Research interests',
  biography: 'Biography',
  imageUrl: 'Photo',
  websiteUrl: 'Website',
  publicEmail: 'Public email',
  displayOrder: 'Display order',
  status: 'Publication status',
  archived: 'Archived',
  visible: 'Visibility',
  submittedIdentifier: 'Email entered',
  rowCount: 'Entries exported',
  lastActivityAt: 'Last activity (IST)',
  expiredAt: 'Access expired (IST)',
  detectedAt: 'Expiry recorded (IST)',
  filters: 'Export options',
  actor: 'Person',
  action: 'Action',
  target: 'Affected profile',
  from: 'From date',
  to: 'Through date',
  loginEmail: 'Login email',
  role: 'Account role',
  loginDisabled: 'Linked login disabled',
};

const activityMessages: Record<string, string> = {
  ACTIVITY_CREATED: 'Website activity created.',
  ACTIVITY_UPDATED: 'Website activity updated.',
  ACTIVITY_SHOWN: 'Website activity made visible.',
  ACTIVITY_HIDDEN: 'Website activity hidden.',
  ACTIVITY_DELETED: 'Website activity deleted.',
  LOGIN_SUCCESS: 'Signed in successfully.',
  LOGIN_FAILED: 'Sign-in failed.',
  LOGOUT: 'Signed out.',
  PASSWORD_CHANGED: 'Password changed.',
  SESSION_EXPIRED: 'Session expired.',
  AUDIT_EXPORTED: 'Activity history exported as CSV.',
  FACULTY_CREATED: 'Faculty profile created.',
  FACULTY_ARCHIVED: 'Faculty profile archived.',
  FACULTY_RESTORED: 'Faculty profile restored as a draft.',
  FACULTY_SHOWN: 'Faculty profile made visible on the website.',
  FACULTY_HIDDEN: 'Faculty profile hidden from the website.',
  FACULTY_LOGIN_CREATED: 'Login created for this core faculty member.',
  FACULTY_DELETED: 'Faculty profile permanently deleted.',
  FACULTY_DRAFT_SAVED: 'Faculty member saved a private profile draft.',
  FACULTY_DRAFT_DISCARDED: 'Faculty member discarded their profile draft.',
  FACULTY_SELF_PUBLISHED: 'Faculty member published their profile changes.',
};

export function formatAuditTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function label(field: string) {
  if (Object.hasOwn(fieldLabels, field)) return fieldLabels[field];
  const words = field.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not set';
  if (field === 'displayOrder' && typeof value === 'number') return String(value + 1);
  if (typeof value === 'boolean') {
    if (field === 'visible') return value ? 'Visible' : 'Hidden';
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string') {
    if (field === 'role' && value === 'CORE_FACULTY') return 'Core faculty';
    if (field === 'category' && Object.hasOwn(FACULTY_CATEGORIES, value))
      return FACULTY_CATEGORIES[value as keyof typeof FACULTY_CATEGORIES];
    if (field === 'status' && ['DRAFT', 'PUBLISHED'].includes(value))
      return value === 'DRAFT' ? 'Draft' : 'Published';
    if (['lastActivityAt', 'expiredAt', 'detectedAt', 'eventStartAt', 'eventEndAt'].includes(field))
      return formatAuditTime(value);
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => formatValue(field, entry)).join(', ') || 'None';
  const fields = record(value);
  if (fields)
    return (
      Object.entries(fields)
        .map(([key, entry]) => `${label(key)}: ${formatValue(key, entry)}`)
        .join('; ') || 'None'
    );
  return String(value);
}

export function presentAuditEvent(event: Pick<AuditRecord, 'action' | 'before' | 'after' | 'details'>) {
  const before = record(event.before);
  const after = record(event.after);
  const removed = event.action === 'FACULTY_DELETED' || event.action === 'ACTIVITY_DELETED';
  const fields = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  const changes = fields
    .filter((field) => JSON.stringify(before?.[field]) !== JSON.stringify(after?.[field]))
    .filter((field) => before !== null || (after?.[field] !== '' && after?.[field] !== null))
    .filter((field) => !removed || (before?.[field] !== '' && before?.[field] !== null))
    .map((field) => ({
      field,
      label: label(field),
      before: formatValue(field, before?.[field]),
      after: formatValue(field, after?.[field]),
    }));
  const info = Object.entries(record(event.details) ?? {}).flatMap(([field, value]) => {
    if (field === 'filters') {
      // Pagination does not change which records are exported.
      value = Object.fromEntries(Object.entries(record(value) ?? {}).filter(([key]) => key !== 'page'));
      if (!Object.keys(value as Record<string, unknown>).length) return [];
    }
    return [{ field, label: label(field), value: formatValue(field, value) }];
  });
  let message = Object.hasOwn(activityMessages, event.action)
    ? activityMessages[event.action]
    : 'Activity recorded.';
  if (event.action === 'FACULTY_UPDATED')
    message =
      before && after && !changes.length ? 'Profile saved with no field changes.' : 'Updated profile fields.';
  return { changes, info, message, showPrevious: before !== null, removed };
}
