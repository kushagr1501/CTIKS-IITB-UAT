import { ASSETS } from '@/config/assets';
import FacultyPortrait from './FacultyPortrait';
import type { CoreFaculty } from '../types';

/**
 * Core-faculty card: red vertical accent bar, a rectangular portrait, the
 * role rendered on a pill-shaped SVG badge, department, a short gold rule,
 * then research tags. Two per row on desktop.
 */
export default function FacultyCard({ name, role, department, tags, image, website, biography, publicEmail }: CoreFaculty) {
  const CardTag = website ? 'a' : 'article';
  const linkProps = website
    ? {
        href: website,
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${name}'s website (opens in new tab)`,
      }
    : {};

  return (
    <CardTag
      {...linkProps}
      className={`relative flex flex-col sm:flex-row gap-5 sm:gap-7 bg-white p-5 sm:p-7 lg:p-8 no-underline text-inherit transition-all duration-300 ${
        website
          ? 'group cursor-pointer hover:shadow-xl hover:-translate-y-1'
          : ''
      }`}
    >
      <span aria-hidden="true" className="absolute top-0 inset-x-0 h-1 sm:h-auto sm:inset-y-0 sm:left-0 sm:w-1 bg-ctiks-red" />

      {website && (
        <span
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-ctiks-gold/70 group-hover:text-ctiks-red group-hover:scale-110 transition-all duration-200"
          title="Open website in new tab"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
      )}

      <div className="shrink-0 flex justify-center sm:justify-start">
        <FacultyPortrait name={name} image={image} />
      </div>

      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <h3 className={`font-body text-[20px] sm:text-[22px] lg:text-[24px] font-semibold leading-[1.3] text-ctiks-maroon pr-6 sm:pr-0 ${website ? 'group-hover:text-ctiks-red transition-colors' : ''}`}>
          {name}
        </h3>

        <div className="relative flex h-[30px] w-full max-w-[345px] items-center justify-center">
          <img
            src={ASSETS.roleBadgeShape}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          />
          <span className="relative font-body text-[12px] sm:text-[14px] font-semibold uppercase tracking-[0.5px] sm:tracking-[0.65px] text-white px-3 truncate">
            {role}
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:gap-5">
          <p className="font-body text-[14px] sm:text-[16px] leading-[1.4] text-[#4a4235]">{department}</p>
          <span aria-hidden="true" className="h-1 w-11 bg-[#fbb841]" />
        </div>

        <p className="font-body text-[14px] sm:text-[16px] leading-[1.4] text-[#4a4235]">{tags}</p>
        {biography && <p className="font-body text-[14px] leading-relaxed text-[#4a4235]">{biography}</p>}
        {publicEmail && <p className="break-all font-body text-[14px] text-ctiks-red">{publicEmail}</p>}
      </div>
    </CardTag>
  );
}
