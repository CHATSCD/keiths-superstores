'use client';

import React from 'react';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="no-print shadow-md">
      <div className="max-w-lg mx-auto">
        <Image
          src="/logo.svg"
          alt="Keith's Superstores — The Fastest And Friendliest"
          width={500}
          height={120}
          className="w-full h-auto"
          priority
        />
      </div>
    </header>
  );
}
