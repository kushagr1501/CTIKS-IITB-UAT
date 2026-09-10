import { ASSETS } from '../../assets/assets';

/**
 * The CTIKS action button.
 *
 * The shape is a Figma-exported SVG (an angled tab, not a rounded rect), so it
 * is rendered from the exported asset rather than redrawn in CSS. Designed
 * geometry is 227 x 53 with a 20 x 20 arrow leaf — both are set explicitly.
 */

const VARIANTS = {
  // Gold tab on the hero photograph, red label.
  gold: { shape: ASSETS.buttonGold, arrow: ASSETS.arrowRed, label: 'text-ctiks-red' },
  // Red tab on cream, white label. Used by the programme blocks and events panel.
  red: { shape: ASSETS.buttonRed, arrow: ASSETS.arrowWhite, label: 'text-white' },
  // Red tab on the sand announcement cards, sand label.
  redOnSand: { shape: ASSETS.buttonRed, arrow: ASSETS.arrowSand, label: 'text-ctiks-sand' },
};

export default function Button({
  children,
  href = '#',
  variant = 'red',
  className = '',
  ...rest
}) {
  const v = VARIANTS[variant] ?? VARIANTS.red;

  return (
    <a
      href={href}
      className={`group relative inline-flex h-[53px] w-[227px] shrink-0 items-center justify-center ${className}`}
      {...rest}
    >
      <img
        src={v.shape.path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      />
      <span className="relative flex items-center gap-2">
        <span
          className={`font-body text-[18px] font-semibold uppercase leading-none ${v.label}`}
        >
          {children}
        </span>
        <img
          src={v.arrow.path}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>
    </a>
  );
}
