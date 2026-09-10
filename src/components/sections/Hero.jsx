import Button from '../ui/Button';
import { ASSETS } from '../../assets/assets';

/**
 * Hero: a photograph of the campus arcade, sunk under a gradient that runs
 * from transparent at 37% to solid red at 70%, with the Sanskrit motto
 * carrying the type weight.
 */
export default function Hero() {
  return (
    <section className="relative isolate min-h-[400px] h-[calc(100svh-170px)] sm:min-h-0 sm:h-[531px] overflow-hidden bg-ctiks-clay">
      <img
        src={ASSETS.heroBackdrop.path}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(to bottom, rgba(170,19,19,0) 0%, rgba(170,19,19,0.2) 30%, rgba(170,19,19,0.7) 70%, #aa1313 100%)',
        }}
      />

      <div className="flex h-full flex-col items-center justify-center pt-[20%] sm:pt-[15%] pb-4 sm:pb-0 text-center">
        <p className="font-deva text-[44px] font-semibold uppercase text-ctiks-gold sm:text-[56px] lg:text-[70px]">
          ज्ञानमयं तपः
        </p>
        <p className="mt-1 px-6 font-motto text-[26px] font-semibold italic leading-[38.27px] tracking-[0.5px] text-white sm:text-[30px] lg:text-[36px]">
          Knowledge as disciplined pursuit
        </p>
        <Button variant="gold" href="/about-us" className="mt-8">
          Know more
        </Button>
      </div>
    </section>
  );
}
