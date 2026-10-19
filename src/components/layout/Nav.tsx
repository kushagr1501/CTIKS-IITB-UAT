'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ASSETS } from '@/config/assets';
import { NAV_ITEMS } from '@/config/navigation';

export default function Nav() {
  const pathname = usePathname() ?? '/';
  return <NavigationMenu key={pathname} current={pathname} />;
}

function NavigationMenu({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

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
        <ul className="mx-auto flex max-w-shell flex-col gap-8 px-8 py-8 md:flex-row md:items-center md:justify-center md:gap-4 lg:gap-[32px] xl:gap-[48px] md:px-4 lg:px-6 md:py-0 md:h-[73px]">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === current ||
              (item.href !== '/' && current.startsWith(`${item.href}/`)) ||
              item.children?.some((child) => child.href === current);
            return (
              <li
                key={item.label}
                className="relative flex flex-col items-start md:items-center gap-1.5 group"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setActivitiesOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setActivitiesOpen(false);
                    event.currentTarget.querySelector('button')?.focus();
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <Link
                    href={item.href}
                    onNavigate={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`
                    flex items-center justify-between w-full md:w-auto font-body text-[16px] md:text-[13px] lg:text-[15px] xl:text-[17px]
                    font-semibold uppercase tracking-wide leading-none transition-colors duration-200 whitespace-nowrap
                    ${active ? 'text-ctiks-red' : 'text-ctiks-maroon hover:text-ctiks-gold'}
                  `}
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      aria-label="Toggle Activities submenu"
                      aria-expanded={activitiesOpen}
                      aria-controls="activities-submenu"
                      onClick={() => setActivitiesOpen((value) => !value)}
                      className="rounded p-1 text-ctiks-maroon focus-visible:outline focus-visible:outline-2"
                    >
                      <img
                        src={ASSETS.chevronDown}
                        alt=""
                        aria-hidden="true"
                        className={`h-[20px] w-[20px] opacity-70 transition-transform ${activitiesOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>
                {item.children && activitiesOpen && (
                  <ul
                    id="activities-submenu"
                    className="w-full min-w-[190px] border-l border-ctiks-maroon/20 bg-ctiks-sand px-2 py-2 md:absolute md:left-0 md:top-full md:mt-2 md:rounded-md md:border md:shadow-lg"
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
                          className="block rounded px-4 py-3 text-sm font-medium text-ctiks-maroon hover:bg-white/60 focus:bg-white/60"
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
