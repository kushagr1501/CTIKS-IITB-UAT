import FacultyCard from './FacultyCard';
import type { CoreFaculty } from '../types';

export default function CoreFacultySection({ faculty }: { faculty: CoreFaculty[] }) {
  return (
    <section className="px-4 sm:px-8 md:px-12 lg:px-16 pt-12 sm:pt-16 lg:pt-20 pb-8 flex justify-center">
      <div className="mx-auto w-full max-w-[1120px] flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-2 sm:gap-3">
          <h2 className="font-body text-[30px] font-bold leading-[1.2] tracking-[-0.5px] sm:tracking-[-0.9px] text-ctiks-red sm:text-[38px] lg:text-[45px]">
            Faculty Members
          </h2>
          <p className="font-body text-[22px] font-semibold leading-[1.2] text-[#3d5a4e] sm:text-[28px] lg:text-[32px]">
            Core Faculty
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
          {faculty.map((person) => (
            <FacultyCard key={person.id ?? person.name} {...person} />
          ))}
        </div>
      </div>
    </section>
  );
}
