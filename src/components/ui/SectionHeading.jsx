import { ASSETS } from '../../assets/assets';

/**
 * Centred section heading: ornament above, title below, optional short rule.
 * `icon` takes a key from ASSETS. `iconSize` preserves each ornament's own
 * designed box — they are different shapes, so they do not share one size.
 */
export default function SectionHeading({
  icon,
  iconSize = { width: 80, height: 48 },
  rule = false,
  children,
}) {
  const src = ASSETS[icon]?.path;

  return (
    <div className="flex flex-col items-center gap-[22px]">
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          width={iconSize.width}
          height={iconSize.height}
          style={{ width: iconSize.width, height: iconSize.height }}
        />
      )}
      <h2 className="text-center font-display text-[28px] font-bold uppercase leading-[33.6px] tracking-[2.8px] text-ctiks-red">
        {children}
      </h2>
      {rule && (
        <img
          src={ASSETS.ruleShort.path}
          alt=""
          aria-hidden="true"
          width={64}
          height={1}
          style={{ width: 64, height: 1 }}
        />
      )}
    </div>
  );
}
