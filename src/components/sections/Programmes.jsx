import ProgrammeBlock from './ProgrammeBlock';
import { ASSETS } from '../../assets/assets';
import { PROGRAMMES } from '../../data/homepage';

/**
 * The three programme blocks, over a tiled paper texture. The texture is
 * decorative only, so it is a background layer rather than an <img>.
 */
export default function Programmes() {
  return (
    <section aria-label="Programmes" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-30 mix-blend-multiply"
        style={{
          backgroundImage: `url(${ASSETS.paperTexture.path})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'repeat-y',
        }}
      />

      <div className="flex flex-col gap-[60px] px-6 py-[60px]">
        {PROGRAMMES.map((p, index) => (
          <ProgrammeBlock key={p.title} {...p} reverse={index % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
