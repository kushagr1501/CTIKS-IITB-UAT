import AssociateFacultyCard from '../ui/AssociateFacultyCard';
import { ASSOCIATE_FACULTY } from '../../data/people';

export default function AssociateFacultySection() {
  return (
    <section className="px-4 sm:px-8 md:px-12 lg:px-16 pb-16 sm:pb-24 pt-4 sm:pt-8 flex justify-center">
      <div className="mx-auto w-full max-w-shell flex flex-col gap-8 sm:gap-10">
        <h2 className="font-body text-[22px] font-semibold leading-[1.2] text-[#3d5a4e] sm:text-[28px] lg:text-[32px]">
          Associate Faculty
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ASSOCIATE_FACULTY.map((person) => (
            <AssociateFacultyCard key={person.name} {...person} />
          ))}
        </div>
      </div>
    </section>
  );
}
