import FacultyPortrait from './FacultyPortrait';
import type { Faculty } from '../types';

/**
 * Associate-faculty card: thinner red accent, a circular avatar instead of
 * a rectangular portrait, no role badge. Three per row on desktop.
 */
export default function AssociateFacultyCard({ name, department, tags, image, website, biography, publicEmail }: Faculty) {
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
      className={`relative flex flex-col justify-between border-t-2 sm:border-t-0 sm:border-l-2 border-ctiks-red bg-white p-5 sm:p-7 lg:p-8 no-underline text-inherit transition-all duration-300 ${
        website
          ? 'group cursor-pointer hover:shadow-xl hover:-translate-y-1'
          : ''
      }`}
    >
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

      <div>
        <div className="flex items-center sm:items-start gap-4 sm:gap-6 pr-6 sm:pr-0">
          <FacultyPortrait name={name} image={image} variant="round" />
          <div className="flex-1 min-w-0">
            <h3 className={`pt-1 sm:pt-2 font-body text-[19px] sm:text-[22px] lg:text-[24px] font-semibold leading-[1.3] text-ctiks-maroon ${website ? 'group-hover:text-ctiks-red transition-colors' : ''}`}>
              {name}
            </h3>
          </div>
        </div>

        <div className="mt-5 sm:mt-7 flex flex-col gap-3 sm:gap-5">
          <p className="font-body text-[14px] sm:text-[16px] leading-[1.4] text-[#4a4235]">{department}</p>
          <span aria-hidden="true" className="h-1 w-11 bg-[#fbb841]" />
        </div>
      </div>

      <p className="mt-4 sm:mt-5 font-body text-[14px] sm:text-[16px] leading-[1.4] text-[#4a4235]">{tags}</p>
      {biography && <p className="mt-4 font-body text-[14px] leading-relaxed text-[#4a4235]">{biography}</p>}
      {publicEmail && <p className="mt-3 break-all font-body text-[14px] text-ctiks-red">{publicEmail}</p>}
    </CardTag>
  );
}
