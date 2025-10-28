'use client';

import { cn } from '@/lib/utils';

interface LogoImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

const ABSOLUTE_URL_PATTERN = /^(?:[a-zA-Z][a-zA-Z\d+.-]*:)?\/\//;

function resolveLogoSrc(path: string): string {
  if (!path) {
    return path;
  }

  if (path.startsWith('/') || path.startsWith('data:') || path.startsWith('blob:') || ABSOLUTE_URL_PATTERN.test(path)) {
    return path;
  }

  return `/${path.replace(/^\/+/, '')}`;
}

export function LogoImage({ src, alt, size = 40, className }: LogoImageProps) {
  const resolvedSrc = resolveLogoSrc(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('object-contain', className)}
    />
  );
}

