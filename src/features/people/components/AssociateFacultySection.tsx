import AssociateFacultyCard from './AssociateFacultyCard';
import type { Faculty } from '../types';

export default function AssociateFacultySection({ faculty, title = 'Associate Faculty' }: { faculty: Faculty[]; title?: string }) {
  return (
    <section className="px-4 sm:px-8 md:px-12 lg:px-16 pb-16 sm:pb-24 pt-4 sm:pt-8 flex justify-center">
      <div className="mx-auto w-full max-w-[1120px] flex flex-col gap-8 sm:gap-10">
        <h2 className="font-body text-[22px] font-semibold leading-[1.2] text-[#3d5a4e] sm:text-[28px] lg:text-[32px]">
          {title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {faculty.map((person) => (
            <AssociateFacultyCard key={person.id ?? person.name} {...person} />
          ))}
        </div>
      </div>
    </section>
  );
}
