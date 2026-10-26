'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MSC_DISCIPLINES } from '@/features/academics/msc-content';

type Category = 'doctoral' | 'msc' | 'ug';

const categories: { key: Category; label: string }[] = [
  { key: 'doctoral', label: 'Doctoral Programme' },
  { key: 'msc', label: 'M.Sc. Programme' },
  { key: 'ug', label: 'UG Minor' },
];

const links = {
  doctoral: [{ label: 'Ph.D. Programme', href: '/academics/phd' }],
  msc: MSC_DISCIPLINES.map((discipline) => ({
    label: `M.Sc. in ${discipline.title}`,
    href: `/academics/msc/${discipline.slug}`,
  })),
  ug: [],
};

export default function AcademicsNavMenu({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>('doctoral');

  if (!open) return null;

  return (
    <div
      id="academics-submenu"
      className="z-50 max-h-[70vh] w-full overflow-y-auto rounded-xl border border-[#e5cfb2] bg-[#fffaf2] shadow-xl md:absolute md:left-0 md:top-full md:w-[min(560px,calc(100vw-32px))] md:overflow-hidden md:shadow-2xl"
    >
      <div className="relative">
        <ul className="border-[#ead7bd] p-2 md:w-[220px] md:border-r">
          {categories.map(({ key, label }) => {
            const selected = activeCategory === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-expanded={selected}
                  aria-controls={`academics-${key}-list`}
                  onMouseEnter={() => setActiveCategory(key)}
                  onFocus={() => setActiveCategory(key)}
                  onClick={() => setActiveCategory(key)}
                  className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left font-body text-sm font-semibold leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red ${selected ? 'bg-[#f7e7d2] text-[#8c201b]' : 'text-ctiks-maroon hover:bg-[#f9efe2]'}`}
                >
                  <span>{label}</span>
                  <span className="shrink-0 text-base leading-none text-[#92745e]" aria-hidden="true">›</span>
                </button>
                <ul
                  id={`academics-${key}-list`}
                  hidden={!selected}
                  aria-label={`${label} pages`}
                  className="px-2 pb-2 md:absolute md:inset-y-0 md:left-[220px] md:w-[calc(100%-220px)] md:px-4 md:py-3"
                >
                  {key === 'ug' ? (
                    <li className="rounded-lg px-3 py-3 font-body text-sm font-medium text-ctiks-maroon">
                      UG Minor <span className="ml-2 text-xs text-[#92745e]">Coming soon</span>
                    </li>
                  ) : (
                    links[key].map((page) => (
                      <li key={page.href}>
                        <Link
                          href={page.href}
                          onNavigate={onNavigate}
                          className="block rounded-lg px-3 py-2.5 font-body text-sm font-medium leading-snug text-ctiks-maroon transition-colors hover:bg-[#f7e7d2] hover:text-ctiks-red focus-visible:bg-[#f7e7d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red"
                        >
                          {page.label}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
