'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FACULTY_CATEGORIES, type FacultyCategory } from '@/features/admin/types';

type MenuPerson = { name: string; slug: string; category: FacultyCategory; websiteUrl: string };

function safeWebsite(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

const nameLinkClass =
  'block rounded-lg px-3 py-2.5 font-body text-sm font-medium leading-snug text-ctiks-maroon transition-colors hover:bg-[#f7e7d2] hover:text-ctiks-red focus-visible:bg-[#f7e7d2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red';

export default function PeopleNavMenu({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const [people, setPeople] = useState<MenuPerson[] | null>(null);
  const [activeCategory, setActiveCategory] = useState<FacultyCategory>('CORE');
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open || people !== null) return;
    const controller = new AbortController();
    fetch('/api/people/menu', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load profiles.');
        return response.json() as Promise<{ people: MenuPerson[] }>;
      })
      .then((result) => {
        if (!Array.isArray(result.people)) throw new Error('Invalid profile list.');
        setPeople(result.people);
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [open, people, retry]);

  if (!open) return null;

  return (
    <div
      id="people-submenu"
      className="z-50 max-h-[70vh] w-full overflow-y-auto rounded-xl border border-[#e5cfb2] bg-[#fffaf2] shadow-xl md:absolute md:left-0 md:top-full md:max-h-none md:w-[min(650px,calc(100vw-32px))] md:overflow-hidden md:shadow-2xl"
    >
      <div className="relative">
        <ul className="border-[#ead7bd] p-2 md:w-[255px] md:border-r">
          {(Object.entries(FACULTY_CATEGORIES) as [FacultyCategory, string][]).map(([category, label]) => {
            const names = people?.filter((person) => person.category === category) ?? [];
            const selected = activeCategory === category;
            return (
              <li key={category}>
                <button
                  type="button"
                  aria-expanded={selected}
                  aria-controls={`people-${category}-list`}
                  onMouseEnter={() => setActiveCategory(category)}
                  onFocus={() => setActiveCategory(category)}
                  onClick={() => setActiveCategory(category)}
                  className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left font-body text-sm font-semibold leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red ${selected ? 'bg-[#f7e7d2] text-[#8c201b]' : 'text-ctiks-maroon hover:bg-[#f9efe2]'}`}
                >
                  <span>{label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-[#92745e]">
                    {people && names.length > 0 ? names.length : null}
                    <span aria-hidden="true" className="text-base leading-none">›</span>
                  </span>
                </button>
                <ul
                  id={`people-${category}-list`}
                  hidden={!selected}
                  aria-label={`${label} profiles`}
                  className="max-h-[300px] overflow-y-auto px-2 pb-2 md:absolute md:inset-y-0 md:left-[255px] md:max-h-none md:w-[calc(100%-255px)] md:px-4 md:py-3"
                >
                  {!people ? (
                    <li className="px-3 py-4 text-sm text-[#705c4c]">
                      {failed ? (
                        <button type="button" onClick={() => { setFailed(false); setRetry((value) => value + 1); }} className="font-semibold text-ctiks-red underline underline-offset-4">
                          Could not load profiles. Try again
                        </button>
                      ) : 'Loading profiles…'}
                    </li>
                  ) : names.length === 0 ? (
                    <li className="px-3 py-4 text-sm text-[#705c4c]">No published profiles yet.</li>
                  ) : (
                    names.map((person) => {
                      const website = safeWebsite(person.websiteUrl);
                      return (
                        <li key={person.slug}>
                          {person.category === 'CORE' ? (
                            <Link href={`/people/${person.slug}`} prefetch={false} onNavigate={onNavigate} className={nameLinkClass}>
                              {person.name}
                            </Link>
                          ) : website ? (
                            <a href={website} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className={nameLinkClass}>
                              {person.name} <span aria-hidden="true">↗</span><span className="sr-only"> (opens website in a new tab)</span>
                            </a>
                          ) : (
                            <span className={nameLinkClass}>
                              {person.name}
                            </span>
                          )}
                        </li>
                      );
                    })
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
