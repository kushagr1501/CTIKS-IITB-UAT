import type { PublicFaculty } from '../types';
import CoreFacultySection from './CoreFacultySection';
import AssociateFacultySection from './AssociateFacultySection';

const otherCategories = [
  { category: 'ADJUNCT', title: 'Adjunct Faculty' },
  { category: 'ASSOCIATE', title: 'Associate Faculty' },
  { category: 'VISITING', title: 'Visiting Faculty' },
  { category: 'POST_DOCTORAL', title: 'Postdoctoral Researchers / Scholars' },
  { category: 'DOCTORAL_STUDENT', title: 'Doctoral Students' },
] as const;

function cardProps(person: PublicFaculty) {
  return {
    id: person.id,
    name: person.name,
    department: person.department,
    tags: person.interests,
    image: person.imageUrl || undefined,
    website: person.websiteUrl || undefined,
    biography: person.biography,
    publicEmail: person.publicEmail,
  };
}

export default function FacultyDirectory({ faculty }: { faculty: PublicFaculty[] }) {
  const core = faculty.filter((person) => person.category === 'CORE');
  if (!faculty.length)
    return <p className="px-6 py-20 text-center">People profiles will be available soon.</p>;
  return (
    <>
      {core.length > 0 && (
        <CoreFacultySection
          faculty={core.map((person) => ({
            ...cardProps(person),
            tags: person.interests.split(',').slice(0, 3).join(', '),
            profileUrl: `/people/${person.slug}`,
            role: person.designation || 'Core Faculty Member',
          }))}
        />
      )}
      {otherCategories.map(({ category, title }) => {
        const members = faculty.filter((person) => person.category === category);
        return members.length > 0 ? (
          <AssociateFacultySection key={category} title={title} faculty={members.map(cardProps)} />
        ) : null;
      })}
    </>
  );
}
