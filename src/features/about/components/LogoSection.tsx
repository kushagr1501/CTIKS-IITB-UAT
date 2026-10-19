import { ASSETS } from '@/config/assets';

const PARAGRAPHS = [
  "The emblem of the Centre for Traditional Indian Knowledge and Skills is conceived as a seal of continuity, where knowledge, skill, and lineage converge. It brings together three interwoven motifs: the padma (lotus), the kolam, and the Guru (Bṛhaspati) Yantra, each reflecting a dimension of India's living intellectual heritage.",
  'At the heart of the design blooms the lotus, a symbol of unfolding potential and clarity of thought. Surrounding it, the kolam evokes the quiet brilliance of knowledge woven into daily life: mathematics expressed as art, discipline expressed as grace.',
  'Subtle solar and floral accents suggest illumination and renewal, the blossoming of traditional skills in contemporary contexts. Together, these elements speak of a tradition not frozen in the past, but alive in practice: precise, luminous, and ever-unfolding. Through this seal, CTIKS affirms its role as a guardian of that living continuity, where mastery is at once intellectually rigorous and soulfully embodied.',
];

export default function LogoSection() {
  return (
    <section className="relative isolate overflow-hidden bg-ctiks-cream px-6 py-12 sm:px-12 md:px-16 lg:py-24">
      {/* Background Logo */}
      <img
        src={ASSETS.aboutLogoEmblem}
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 -z-10 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] sm:h-[450px] sm:w-[450px]"
      />
      
      <div className="mx-auto max-w-[900px]">
        <h2 className="font-display text-[28px] font-semibold text-ctiks-maroon sm:text-[36px] text-center">
          Our Logo — A Living Tradition
        </h2>

        <div className="mt-8 flex flex-col gap-6 font-body text-[17px] leading-[1.7] text-[#4a4235] sm:text-[19px] text-center">
          {PARAGRAPHS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 py-4" aria-hidden="true">
          <img src={ASSETS.dividerLine} alt="" className="h-px w-[80px] sm:w-[120px] opacity-70" />
          <img src={ASSETS.dividerOrnament} alt="" width={28} height={25} className="h-[25px] w-7 opacity-80" />
          <img src={ASSETS.dividerLine} alt="" className="h-px w-[80px] sm:w-[120px] opacity-70" />
        </div>
      </div>
    </section>
  );
}
