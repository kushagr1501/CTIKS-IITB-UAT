'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ASSETS } from '@/config/assets';
import { NAV_ITEMS } from '@/config/navigation';
import PeopleNavMenu from './PeopleNavMenu';
import AcademicsNavMenu from './AcademicsNavMenu';

export default function Nav() {
  const pathname = usePathname() ?? '/';
  return <NavigationMenu key={pathname} current={pathname} />;
}

function NavigationMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [academicsOpen, setAcademicsOpen] = useState(false);

  // Close menu when resizing to tablet/desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false); // md breakpoint
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav
      aria-label="Primary"
      className="bg-ctiks-sand sticky top-0 z-50 shadow-sm border-b border-ctiks-red/10"
    >
      {/* Mobile toggle bar */}
      <div className="mx-auto flex max-w-shell items-center justify-between px-6 py-4 md:hidden">
        <span className="font-display text-[18px] font-bold uppercase tracking-[2px] text-ctiks-red">
          Explore CTIKS
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="ctiks-nav-list"
          className="text-ctiks-red focus:outline-none p-1 transition-transform active:scale-95"
        >
          {open ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div
        id="ctiks-nav-list"
        className={`
          absolute left-0 top-full w-full bg-ctiks-sand border-b border-ctiks-red/10 shadow-xl md:shadow-none
          md:static md:block md:border-none md:bg-transparent md:w-auto
          transition-all duration-300 ease-in-out origin-top
          ${open ? 'visible opacity-100 scale-y-100' : 'invisible opacity-0 scale-y-0 md:visible md:opacity-100 md:scale-y-100'}
        `}
      >
        <ul className="mx-auto flex max-w-shell flex-col gap-8 px-8 py-8 md:flex-row md:items-center md:justify-center md:gap-3 lg:gap-6 xl:gap-9 md:px-4 lg:px-6 md:py-0 md:h-[73px]">
          {NAV_ITEMS.map((item) => {
            const isPeople = item.href === '/people';
            const isAcademics = item.href === '/academics';
            const active =
              item.href === current ||
              (item.href !== '/' && current.startsWith(`${item.href}/`)) ||
              item.children?.some((child) => child.href === current);
            return (
              <li
                key={item.label}
                className="relative flex w-full flex-col items-start gap-1.5 md:w-auto md:items-center group"
                onMouseEnter={() => {
                  if (!window.matchMedia('(hover: hover) and (min-width: 768px)').matches) return;
                  if (isPeople) {
                    setPeopleOpen(true);
                    setActivitiesOpen(false);
                    setAcademicsOpen(false);
                  } else if (isAcademics) {
                    setAcademicsOpen(true);
                    setPeopleOpen(false);
                    setActivitiesOpen(false);
                  } else if (item.children) {
                    setActivitiesOpen(true);
                    setPeopleOpen(false);
                    setAcademicsOpen(false);
                  }
                }}
                onMouseLeave={() => {
                  if (isPeople) setPeopleOpen(false);
                  if (isAcademics) setAcademicsOpen(false);
                  if (item.children) setActivitiesOpen(false);
                }}
                onFocus={(event) => {
                  if (event.target instanceof HTMLAnchorElement && event.target.getAttribute('href') === item.href) {
                    if (isPeople) setPeopleOpen(true);
                    if (isAcademics) setAcademicsOpen(true);
                    if (item.children) setActivitiesOpen(true);
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setActivitiesOpen(false);
                    setPeopleOpen(false);
                    setAcademicsOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setActivitiesOpen(false);
                    setPeopleOpen(false);
                    setAcademicsOpen(false);
                    event.currentTarget.querySelector('button')?.focus();
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <Link
                    href={item.href}
                    onNavigate={() => { setOpen(false); setPeopleOpen(false); setAcademicsOpen(false); setActivitiesOpen(false); }}
                    aria-current={active ? 'page' : undefined}
                    className={`
                    flex items-center justify-between w-full md:w-auto font-body text-[16px] md:text-[12px] lg:text-[14px] xl:text-[16px]
                    font-semibold uppercase tracking-wide leading-none transition-colors duration-200 whitespace-nowrap
                    ${active ? 'text-ctiks-red' : 'text-ctiks-maroon hover:text-ctiks-gold'}
                  `}
                  >
                    {item.label}
                  </Link>
                  {(item.children || isPeople || isAcademics) && (
                    <button
                      type="button"
                      aria-label={`Toggle ${item.label} submenu`}
                      aria-expanded={isPeople ? peopleOpen : isAcademics ? academicsOpen : activitiesOpen}
                      aria-controls={isPeople ? 'people-submenu' : isAcademics ? 'academics-submenu' : 'activities-submenu'}
                      onClick={() => {
                        if (isPeople) {
                          setPeopleOpen((value) => !value);
                          setAcademicsOpen(false);
                          setActivitiesOpen(false);
                        } else if (isAcademics) {
                          setAcademicsOpen((value) => !value);
                          setPeopleOpen(false);
                          setActivitiesOpen(false);
                        } else {
                          setActivitiesOpen((value) => !value);
                          setPeopleOpen(false);
                          setAcademicsOpen(false);
                        }
                      }}
                      className="rounded p-1 text-ctiks-maroon focus-visible:outline focus-visible:outline-2"
                    >
                      <img
                        src={ASSETS.chevronDown}
                        alt=""
                        aria-hidden="true"
                        className={`h-[20px] w-[20px] opacity-70 transition-transform ${(isPeople ? peopleOpen : isAcademics ? academicsOpen : activitiesOpen) ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
                {isPeople && <PeopleNavMenu open={peopleOpen} onNavigate={() => { setOpen(false); setPeopleOpen(false); }} />}
                {isAcademics && <AcademicsNavMenu open={academicsOpen} onNavigate={() => { setOpen(false); setAcademicsOpen(false); }} />}
                {item.children && activitiesOpen && (
                  <ul
                    id="activities-submenu"
                    className="z-50 w-full min-w-[220px] rounded-xl border border-[#e5cfb2] bg-[#fffaf2] p-2 shadow-xl md:absolute md:left-0 md:top-full md:shadow-2xl"
                  >
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onNavigate={() => {
                            setOpen(false);
                            setActivitiesOpen(false);
                          }}
                          aria-current={child.href === current ? 'page' : undefined}
                          className={`flex min-h-12 items-center rounded-lg px-3 py-2 font-body text-sm font-semibold leading-snug transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ctiks-red ${child.href === current ? 'bg-[#f7e7d2] text-[#8c201b]' : 'text-ctiks-maroon hover:bg-[#f9efe2]'}`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Animated Underline Indicator */}
                <span
                  aria-hidden="true"
                  className={`
                    h-0.5 rounded-[40px] transition-all duration-300 ease-out
                    ${active ? 'w-12 md:w-full bg-ctiks-red' : 'w-0 bg-ctiks-gold md:group-hover:w-full'}
                    ${!active && 'md:block hidden'}
                  `}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
