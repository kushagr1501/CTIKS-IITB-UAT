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
