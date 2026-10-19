import Link from 'next/link';

export default function ProgrammeAction({
  href,
  children = 'Explore Programme',
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const content = (
    <>
      <img
        src="/assets/figma/programme-button.svg"
        width={307}
        height={53}
        alt=""
        aria-hidden="true"
        className="absolute left-0 top-0 max-w-full"
      />
      <span className="relative flex items-center gap-2 text-[14px] font-semibold uppercase text-white">
        {children}
        <img src="/assets/figma/programme-arrow.svg" alt="" aria-hidden="true" />
      </span>
    </>
  );
  const className = 'relative inline-flex h-[43px] w-[246px] max-w-full items-center justify-center';
  return href ? (
    <Link className={className} href={href}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      disabled
      className={`${className} cursor-default`}
      aria-label="Explore M.Sc. programme (not available yet)"
    >
      {content}
    </button>
  );
}
