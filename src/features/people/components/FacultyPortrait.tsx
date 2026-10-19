'use client';

import { useState } from 'react';

type FacultyPortraitProps = {
  name: string;
  image?: string;
  variant?: 'rectangle' | 'round';
};

const STYLES = {
  rectangle: {
    image: 'h-[220px] w-[180px] sm:h-[203px] sm:w-[170px] object-cover rounded sm:rounded-none shadow-sm sm:shadow-none',
    fallback: 'h-[220px] w-[180px] sm:h-[203px] sm:w-[170px] bg-[#f2ede4] border border-[#e2d8c6] flex flex-col items-center justify-center text-ctiks-maroon font-display text-2xl font-bold shadow-sm',
    width: 170,
    height: 203,
  },
  round: {
    image: 'h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full object-cover shadow-sm',
    fallback: 'h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-full bg-[#f2ede4] border border-[#e2d8c6] flex items-center justify-center text-ctiks-maroon font-display text-xl font-bold shadow-sm',
    width: 96,
    height: 96,
  },
};

function getInitials(name: string) {
  return name
    .replace(/^(Prof\.|Dr\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function FacultyPortrait({ name, image, variant = 'rectangle' }: FacultyPortraitProps) {
  const [failedImage, setFailedImage] = useState<string>();
  const style = STYLES[variant];

  if (!image || failedImage === image) {
    return <div role="img" aria-label={name} className={style.fallback}>{getInitials(name)}</div>;
  }

  return (
    <img
      src={image}
      alt={name}
      width={style.width}
      height={style.height}
      className={style.image}
      onError={() => setFailedImage(image)}
    />
  );
}
