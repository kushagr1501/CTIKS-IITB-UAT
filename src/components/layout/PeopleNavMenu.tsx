'use client';

import Link from 'next/link';
import { FACULTY_CATEGORIES, type FacultyCategory } from '@/features/admin/types';

export default function PeopleNavMenu({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  if (!open) return null;

  return (
    <div
      id="people-submenu"
      className="z-50 max-h-[70vh] w-full overflow-y-auto rounded-xl border border-[#e5cfb2] bg-[#fffaf2] p-2 shadow-xl md:absolute md:left-0 md:top-full md:w-[255px] md:shadow-2xl"
    >
      <ul>
        {(Object.entries(FACULTY_CATEGORIES) as [FacultyCategory, string][]).map(([category, label]) => (
          <li key={category}>
            <Link
              href={`/people#${category.toLowerCase().replaceAll('_', '-')}`}
              onNavigate={onNavigate}
              className="flex min-h-12 items-center rounded-lg px-3 py-2 font-body text-sm font-semibold leading-snug text-ctiks-maroon transition-colors hover:bg-[#f7e7d2] focus-visible:bg-[#f7e7d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
