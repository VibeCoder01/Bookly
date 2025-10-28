'use client';

import { cn } from '@/lib/utils';

interface LogoImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function LogoImage({ src, alt, size = 40, className }: LogoImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('object-contain', className)}
    />
  );
}

