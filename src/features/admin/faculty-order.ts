import { FACULTY_CATEGORIES, type FacultyRecord } from './types';

type OrderedFaculty = Pick<FacultyRecord, 'id' | 'category' | 'displayOrder' | 'name'>;

const categoryOrder = Object.keys(FACULTY_CATEGORIES);
const nameOrder = new Intl.Collator('en');

export function sortFaculty<T extends OrderedFaculty>(faculty: readonly T[]): T[] {
  return [...faculty].sort(
    (left, right) =>
      categoryOrder.indexOf(left.category) - categoryOrder.indexOf(right.category) ||
      left.displayOrder - right.displayOrder ||
      nameOrder.compare(left.name, right.name) ||
      left.id.localeCompare(right.id, 'en'),
  );
}

export function replaceFacultyProfile(faculty: readonly FacultyRecord[], profile: FacultyRecord) {
  return sortFaculty([...faculty.filter((item) => item.id !== profile.id), profile]);
}

export function placeFacultyInCategory<T extends OrderedFaculty>(
  faculty: readonly T[],
  id: string,
  position?: number,
) {
  const ids = sortFaculty(faculty).filter((person) => person.id !== id).map((person) => person.id);
  const index = position === undefined ? ids.length : Math.max(0, Math.min(position, ids.length));
  ids.splice(index, 0, id);
  return ids.map((personId, displayOrder) => ({ id: personId, displayOrder }));
}
