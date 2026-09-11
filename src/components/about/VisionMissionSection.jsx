import { ASSETS } from '../../assets/assets';

const VISION_BODY =
  "The Centre for Traditional Indian Knowledge and Skills is envisioned to be a leading centre of excellence dedicated to the rigorous study, reconstruction, and contemporary application of India's scientific and artisanal knowledge traditions. The Centre aspires to create a scholarly environment where clarity of method, depth of inquiry, and integrity of interpretation are all seamlessly blended.";

const MISSION_ITEMS = [
  'To strengthen foundational scholarship in various domains of Indian Knowledge Systems (IKS).',
  'To revitalize traditional craft and artisanal traditions through modern research and support.',
  'To foster interdisciplinary research by bridging traditional wisdom with contemporary scientific methods.',
  'To create authentic educational resources and academic programs in IKS.',
  'To engage with the community through outreach, workshops, and international conferences.',
  'To act as a bridge between the wisdom of the past and the challenges of the future.',
];

export default function VisionMissionSection() {
  return (
    <section className="bg-ctiks-cream px-6 py-16 sm:px-12 md:px-16 lg:py-20 flex justify-center">
      <div className="mx-auto w-full max-w-shell">
        <div className="relative isolate px-8 py-16 sm:px-16 md:px-24">
          <img
            src={ASSETS.eventsPanel.path}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full drop-shadow-sm"
          />
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-[28px] font-semibold text-ctiks-maroon sm:text-[36px] text-center">
              Our Vision
            </h2>
            <p className="border-l-4 border-ctiks-gold pl-6 font-body text-[17px] leading-[1.7] text-[#4a4235] sm:text-[19px]">
              {VISION_BODY}
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-6">
            <h2 className="font-display text-[28px] font-semibold text-ctiks-maroon sm:text-[36px] text-center">
              Our Mission
            </h2>
            <ul className="flex flex-col gap-4">
              {MISSION_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-4">
                  <span aria-hidden="true" className="mt-1 text-[11px] text-ctiks-maroon shrink-0">
                    ◆
                  </span>
                  <span className="flex-1 font-body text-[17px] leading-[1.6] text-[#4a4235] sm:text-[19px]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
