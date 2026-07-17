'use client';

import React from 'react';

export interface MatnCoverProps extends React.SVGProps<SVGSVGElement> {
  title: string;
  author: string;
  category?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Splits Arabic text into lines while respecting word boundaries.
 */
function wrapArabicText(text: string, maxChars: number = 18): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidateLine = currentLine ? `${currentLine} ${word}` : word;
    if (candidateLine.length <= maxChars) {
      currentLine = candidateLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function MatnCover({
  title = '',
  author = '',
  category = 'متن علمي',
  width = '100%',
  height = '100%',
  className,
  ...props
}: MatnCoverProps) {
  // Clean category and replace separator arrow with a beautiful star ornament
  const formattedCategory = category
    ? category.replace(/\s*>\s*/g, ' ✦ ')
    : 'متن علمي';

  // Dynamic font sizing & text wrapping based on title length
  const titleLength = title.length;
  let maxChars = 18;
  let fontSize = 20;

  if (titleLength <= 15) {
    maxChars = 14;
    fontSize = 24;
  } else if (titleLength <= 30) {
    maxChars = 18;
    fontSize = 20;
  } else if (titleLength <= 55) {
    maxChars = 22;
    fontSize = 17;
  } else {
    maxChars = 26;
    fontSize = 14;
  }

  // Wrap text and limit to max 4 lines to prevent overflow
  const titleLines = wrapArabicText(title, maxChars).slice(0, 4);

  // Calculate text vertical centering inside the 120px height cartouche (center y = 180)
  const lineHeight = fontSize * 1.35;
  const totalHeight = titleLines.length * lineHeight;
  const startY = 180 - totalHeight / 2 + lineHeight / 2 - fontSize * 0.05;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 400"
      width={width}
      height={height}
      className={`select-none ${className || ''}`}
      style={{ direction: 'rtl' }}
      {...props}
    >
      <defs>
        {/* Soft elegant background gradient */}
        <linearGradient id="cover-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5FDFB" />
          <stop offset="50%" stopColor="#EBFBF8" />
          <stop offset="100%" stopColor="#DEF8F3" />
        </linearGradient>

        {/* Premium gold gradient for ornaments */}
        <linearGradient id="cover-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D315" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#A88420" />
        </linearGradient>

        {/* Soft shadow for the title frame */}
        <filter id="frame-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F7164" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* 1. Background */}
      <rect width="300" height="400" fill="url(#cover-bg-gradient)" />

      {/* 2. Outer Border (Deep Teal) */}
      <rect
        x="12"
        y="12"
        width="276"
        height="376"
        rx="10"
        fill="none"
        stroke="#0F7164"
        strokeWidth="2"
      />

      {/* 3. Inner Border (Thin Gold) */}
      <rect
        x="18"
        y="18"
        width="264"
        height="364"
        rx="6"
        fill="none"
        stroke="#D4AF37"
        strokeWidth="0.75"
        strokeDasharray="4,3"
        opacity="0.8"
      />

      {/* 4. Corner Ornaments */}
      {/* Top-Left */}
      <g transform="translate(18, 18)">
        <path d="M 0 12 L 0 0 L 12 0" stroke="#0F7164" strokeWidth="1.25" fill="none" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" />
      </g>
      {/* Top-Right */}
      <g transform="translate(282, 18)">
        <path d="M 0 12 L 0 0 L -12 0" stroke="#0F7164" strokeWidth="1.25" fill="none" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" />
      </g>
      {/* Bottom-Left */}
      <g transform="translate(18, 382)">
        <path d="M 0 -12 L 0 0 L 12 0" stroke="#0F7164" strokeWidth="1.25" fill="none" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" />
      </g>
      {/* Bottom-Right */}
      <g transform="translate(282, 382)">
        <path d="M 0 -12 L 0 0 L -12 0" stroke="#0F7164" strokeWidth="1.25" fill="none" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" />
      </g>

      {/* 5. Top Crest (Islamic Star / Rub el Hizb) */}
      <g transform="translate(150, 55)">
        {/* Outer 8-pointed star in deep teal */}
        <rect x="-11" y="-11" width="22" height="22" fill="#0F7164" rx="2" />
        <rect x="-11" y="-11" width="22" height="22" fill="#0F7164" rx="2" transform="rotate(45)" />
        {/* Inner gold star */}
        <rect x="-7" y="-7" width="14" height="14" fill="url(#cover-gold-gradient)" rx="1.5" />
        <rect x="-7" y="-7" width="14" height="14" fill="url(#cover-gold-gradient)" rx="1.5" transform="rotate(45)" />
        {/* Center dot */}
        <circle cx="0" cy="0" r="2.5" fill="#EBFBF8" />
      </g>

      {/* 6. Category Header */}
      <text
        x="150"
        y="96"
        textAnchor="middle"
        fontFamily="'IBM Plex Sans Arabic', sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="#0F7164"
        letterSpacing="0.5"
      >
        {formattedCategory}
      </text>

      {/* Thin Gold Divider under category */}
      <g transform="translate(150, 106)">
        <line x1="-30" y1="0" x2="30" y2="0" stroke="url(#cover-gold-gradient)" strokeWidth="0.75" />
        <polygon points="0,-2 2,0 0,2 -2,0" fill="#D4AF37" />
      </g>

      {/* 7. Central Title Cartouche (Traditional Islamic Shape) */}
      <g filter="url(#frame-shadow)">
        {/* Outer deep teal frame */}
        <path
          d="M 45 130 
             Q 45 120 60 120 
             L 135 120 
             Q 150 110 165 120 
             L 240 120 
             Q 255 120 255 130 
             L 255 230 
             Q 255 240 240 240 
             L 165 240 
             Q 150 250 135 240 
             L 60 240 
             Q 45 240 45 230 Z"
          fill="#0F7164"
          fillOpacity="0.02"
          stroke="#0F7164"
          strokeWidth="1.5"
        />
        {/* Inner gold accent line */}
        <path
          d="M 47 132 
             Q 47 122 62 122 
             L 136 122 
             Q 150 112 164 122 
             L 238 122 
             Q 253 122 253 132 
             L 253 228 
             Q 253 238 238 238 
             L 164 238 
             Q 150 248 136 238 
             L 62 238 
             Q 47 238 47 228 Z"
          fill="none"
          stroke="url(#cover-gold-gradient)"
          strokeWidth="0.75"
          opacity="0.8"
        />
      </g>

      {/* 8. Title Text (Dynamically Centered & Sized) */}
      <g>
        {titleLines.map((line, idx) => {
          const y = startY + idx * lineHeight;
          return (
            <text
              key={idx}
              x="150"
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight="700"
              fontFamily="'Amiri', 'IBM Plex Sans Arabic', serif"
              fill="#22252A"
            >
              {line}
            </text>
          );
        })}
      </g>

      {/* 9. Bottom Section (Gold Divider & Author) */}
      {/* Decorative Divider */}
      <g transform="translate(150, 276)">
        <line x1="-50" y1="0" x2="50" y2="0" stroke="url(#cover-gold-gradient)" strokeWidth="0.75" />
        <polygon points="0,-3 3,0 0,3 -3,0" fill="#D4AF37" />
        <circle cx="-25" cy="0" r="1.5" fill="#0F7164" />
        <circle cx="25" cy="0" r="1.5" fill="#0F7164" />
      </g>

      {/* "Author" Mini Label */}
      <text
        x="150"
        y="298"
        textAnchor="middle"
        fontFamily="'IBM Plex Sans Arabic', sans-serif"
        fontWeight="600"
        fontSize="9"
        fill="#D4AF37"
        letterSpacing="0.5"
      >
        تَأْلِيف
      </text>

      {/* Author Name */}
      <text
        x="150"
        y="318"
        textAnchor="middle"
        fontFamily="'Amiri', 'IBM Plex Sans Arabic', serif"
        fontWeight="700"
        fontSize="13.5"
        fill="#22252A"
      >
        {author || 'غير معروف'}
      </text>

      {/* 10. Footer Crest (Mini star at bottom center) */}
      <g transform="translate(150, 355)">
        <rect x="-6" y="-6" width="12" height="12" fill="#0F7164" rx="1" />
        <rect x="-6" y="-6" width="12" height="12" fill="#0F7164" rx="1" transform="rotate(45)" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" rx="0.5" />
        <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" rx="0.5" transform="rotate(45)" />
      </g>
    </svg>
  );
}

/**
 * Utility helper to generate standard Matn Cover SVG XML string.
 * Helpful if needed for static output, canvas drawing, or server rendering.
 */
export function generateMatnCoverSvgString({
  title = '',
  author = '',
  category = 'متن علمي',
}: {
  title: string;
  author: string;
  category?: string;
}): string {
  const formattedCategory = category
    ? category.replace(/\s*>\s*/g, ' ✦ ')
    : 'متن علمي';

  const titleLength = title.length;
  let maxChars = 18;
  let fontSize = 20;

  if (titleLength <= 15) {
    maxChars = 14;
    fontSize = 24;
  } else if (titleLength <= 30) {
    maxChars = 18;
    fontSize = 20;
  } else if (titleLength <= 55) {
    maxChars = 22;
    fontSize = 17;
  } else {
    maxChars = 26;
    fontSize = 14;
  }

  const titleLines = wrapArabicText(title, maxChars).slice(0, 4);
  const lineHeight = fontSize * 1.35;
  const totalHeight = titleLines.length * lineHeight;
  const startY = 180 - totalHeight / 2 + lineHeight / 2 - fontSize * 0.05;

  const textTags = titleLines
    .map((line, idx) => {
      const y = startY + idx * lineHeight;
      return `<text x="150" y="${y}" text-anchor="middle" dominant-baseline="middle" fontSize="${fontSize}" fontWeight="700" fontFamily="'Amiri', 'IBM Plex Sans Arabic', serif" fill="#22252A">${line}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400" style="direction: rtl;">
  <defs>
    <linearGradient id="cover-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5FDFB" />
      <stop offset="50%" stop-color="#EBFBF8" />
      <stop offset="100%" stop-color="#DEF8F3" />
    </linearGradient>
    <linearGradient id="cover-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5D315" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#A88420" />
    </linearGradient>
    <filter id="frame-shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F7164" flood-opacity="0.06" />
    </filter>
  </defs>
  <rect width="300" height="400" fill="url(#cover-bg-gradient)" />
  <rect x="12" y="12" width="276" height="376" rx="10" fill="none" stroke="#0F7164" stroke-width="2" />
  <rect x="18" y="18" width="264" height="364" rx="6" fill="none" stroke="#D4AF37" stroke-width="0.75" stroke-dasharray="4,3" opacity="0.8" />
  
  <!-- Corners -->
  <g transform="translate(18, 18)"><path d="M 0 12 L 0 0 L 12 0" stroke="#0F7164" stroke-width="1.25" fill="none" /><rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" /></g>
  <g transform="translate(282, 18)"><path d="M 0 12 L 0 0 L -12 0" stroke="#0F7164" stroke-width="1.25" fill="none" /><rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" /></g>
  <g transform="translate(18, 382)"><path d="M 0 -12 L 0 0 L 12 0" stroke="#0F7164" stroke-width="1.25" fill="none" /><rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" /></g>
  <g transform="translate(282, 382)"><path d="M 0 -12 L 0 0 L -12 0" stroke="#0F7164" stroke-width="1.25" fill="none" /><rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" transform="rotate(45)" /></g>
  
  <!-- Crest -->
  <g transform="translate(150, 55)">
    <rect x="-11" y="-11" width="22" height="22" fill="#0F7164" rx="2" />
    <rect x="-11" y="-11" width="22" height="22" fill="#0F7164" rx="2" transform="rotate(45)" />
    <rect x="-7" y="-7" width="14" height="14" fill="url(#cover-gold-gradient)" rx="1.5" />
    <rect x="-7" y="-7" width="14" height="14" fill="url(#cover-gold-gradient)" rx="1.5" transform="rotate(45)" />
    <circle cx="0" cy="0" r="2.5" fill="#EBFBF8" />
  </g>
  
  <text x="150" y="96" text-anchor="middle" fontFamily="'IBM Plex Sans Arabic', sans-serif" fontWeight="700" fontSize="10" fill="#0F7164" letterSpacing="0.5">${formattedCategory}</text>
  
  <g transform="translate(150, 106)">
    <line x1="-30" y1="0" x2="30" y2="0" stroke="url(#cover-gold-gradient)" stroke-width="0.75" />
    <polygon points="0,-2 2,0 0,2 -2,0" fill="#D4AF37" />
  </g>
  
  <!-- Title Cartouche -->
  <g filter="url(#frame-shadow)">
    <path d="M 45 130 Q 45 120 60 120 L 135 120 Q 150 110 165 120 L 240 120 Q 255 120 255 130 L 255 230 Q 255 240 240 240 L 165 240 Q 150 250 135 240 L 60 240 Q 45 240 45 230 Z" fill="#0F7164" fill-opacity="0.02" stroke="#0F7164" stroke-width="1.5" />
    <path d="M 47 132 Q 47 122 62 122 L 136 122 Q 150 112 164 122 L 238 122 Q 253 122 253 132 L 253 228 Q 253 238 238 238 L 164 238 Q 150 248 136 238 L 62 238 Q 47 238 47 228 Z" fill="none" stroke="url(#cover-gold-gradient)" stroke-width="0.75" opacity="0.8" />
  </g>
  
  <!-- Title Text -->
  <g>${textTags}</g>
  
  <!-- Bottom Divider -->
  <g transform="translate(150, 276)">
    <line x1="-50" y1="0" x2="50" y2="0" stroke="url(#cover-gold-gradient)" stroke-width="0.75" />
    <polygon points="0,-3 3,0 0,3 -3,0" fill="#D4AF37" />
    <circle cx="-25" cy="0" r="1.5" fill="#0F7164" />
    <circle cx="25" cy="0" r="1.5" fill="#0F7164" />
  </g>
  
  <text x="150" y="298" text-anchor="middle" fontFamily="'IBM Plex Sans Arabic', sans-serif" fontWeight="600" fontSize="9" fill="#D4AF37" letterSpacing="0.5">تَأْلِيف</text>
  <text x="150" y="318" text-anchor="middle" fontFamily="'Amiri', 'IBM Plex Sans Arabic', serif" fontWeight="700" fontSize="13.5" fill="#22252A">${author || 'غير معروف'}</text>
  
  <!-- Footer Crest -->
  <g transform="translate(150, 355)">
    <rect x="-6" y="-6" width="12" height="12" fill="#0F7164" rx="1" />
    <rect x="-6" y="-6" width="12" height="12" fill="#0F7164" rx="1" transform="rotate(45)" />
    <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" rx="0.5" />
    <rect x="-4" y="-4" width="8" height="8" fill="url(#cover-gold-gradient)" rx="0.5" transform="rotate(45)" />
  </g>
</svg>`;
}
