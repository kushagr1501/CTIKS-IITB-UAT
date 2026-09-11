import { ASSETS } from '../../assets/assets';

const DEVANAGARI = 'ज्ञानमयं तपः';
const BODY_LEAD_BEFORE = 'The guiding ethos of CTIKS is expressed in its motto: ';
const BODY_LEAD_AFTER =
  ', often rendered as "Knowledge itself is austerity," or more fully, "Knowledge as disciplined pursuit; learning as sacred transformation." Yet the English word austerity does not adequately convey the depth of tapas, which in Sanskrit signifies not severity or deprivation, but a generative inner discipline, a refining heat that illuminates, strengthens, and transforms.';
const BODY_REST =
  'In this spirit, knowledge at CTIKS is not understood as the passive accumulation of information, but as the very substance that shapes and directs enquiry.';

export default function MottoSection() {
  return (
    <section className="bg-ctiks-cream px-6 py-12 sm:px-12 md:px-16 lg:py-16">
      <div className="mx-auto max-w-shell">
        <h2 className="font-display text-[28px] font-semibold text-ctiks-maroon sm:text-[36px] text-center">
          Our Motto
        </h2>

        <div className="mt-8 flex flex-col gap-5 border border-ctiks-maroon/40 bg-white/40 p-8 shadow-[0px_4px_16px_rgba(130,13,13,0.04)] backdrop-blur-sm sm:p-12 text-center sm:text-left">
          <p className="font-deva text-[36px] font-semibold tracking-[2px] text-ctiks-maroon sm:text-[48px]">
            {DEVANAGARI}
          </p>
          <p className="font-motto text-[22px] font-semibold italic text-[#4a4235] sm:text-[26px]">
            jñānamayaṁ tapaḥ
          </p>
          <p className="font-body text-[13px] font-bold uppercase tracking-[1.5px] text-ctiks-red">
            Muṇḍakopaniṣad (1.1.9)
          </p>

          <img src={ASSETS.mottoCardDivider.path} alt="" aria-hidden="true" className="h-px w-full opacity-60 my-2" />

          <div className="flex flex-col gap-4 font-body text-[17px] leading-[1.7] text-[#4a4235] sm:text-[19px]">
            <p>
              {BODY_LEAD_BEFORE}
              <span className="font-deva font-bold text-ctiks-maroon mx-1">{DEVANAGARI}</span>
              {BODY_LEAD_AFTER}
            </p>
            <p>{BODY_REST}</p>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 py-4" aria-hidden="true">
          <img src={ASSETS.dividerLine.path} alt="" className="h-px w-[80px] sm:w-[120px] opacity-70" />
          <img src={ASSETS.dividerOrnament.path} alt="" width={28} height={25} className="h-[25px] w-7 opacity-80" />
          <img src={ASSETS.dividerLine.path} alt="" className="h-px w-[80px] sm:w-[120px] opacity-70" />
        </div>
      </div>
    </section>
  );
}
