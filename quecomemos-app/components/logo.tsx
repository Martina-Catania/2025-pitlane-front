import React from 'react';
import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center">
      <Image
        src="/logo.svg"
        alt="QueComemos Logo"
        width={160}
        height={56}
        className="h-12 w-auto dark:brightness-0 dark:invert"
        priority
      />
    </div>
  );
}