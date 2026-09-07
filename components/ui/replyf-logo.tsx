import React from 'react';
import Image from 'next/image';

export interface ReplyfLogoProps {
  size?: number;
  variant?: 'adaptive' | 'gradient' | 'dark';
  className?: string;
  priority?: boolean;
}

export function ReplyfLogo({
  size = 36,
  variant = 'adaptive',
  className = '',
  priority = false,
}: ReplyfLogoProps) {
  if (variant === 'gradient') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/icons/replyf-logo-gradient.png"
          alt="Replyf logo"
          width={size}
          height={size}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/icons/replyf-logo-dark.png"
          alt="Replyf logo"
          width={size}
          height={size}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </div>
    );
  }

  // Adaptive: displays gradient logo in light mode, and dark logo in dark mode (night mode)
  return (
    <div
      className={`relative overflow-hidden rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Light theme logo */}
      <Image
        src="/icons/replyf-logo-gradient.png"
        alt="Replyf logo"
        width={size}
        height={size}
        className="h-full w-full object-cover dark:hidden"
        priority={priority}
      />
      {/* Dark / Night mode logo */}
      <Image
        src="/icons/replyf-logo-dark.png"
        alt="Replyf logo (dark mode)"
        width={size}
        height={size}
        className="h-full w-full object-cover hidden dark:block"
        priority={priority}
      />
    </div>
  );
}
