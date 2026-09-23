import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Base SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="pageGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
    <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background with subtle border -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="4" stroke-opacity="0.6" />

  <!-- Open Bible & Sacred Geometry Group -->
  <g filter="url(#subtleShadow)">
    <!-- Book Spine & Shadow -->
    <path d="M256 160 L256 370" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
    
    <!-- Left Page -->
    <path d="M256 180 C210 165 140 165 96 182 L96 352 C140 336 210 336 256 352 Z" fill="url(#pageGrad)" />
    <!-- Right Page -->
    <path d="M256 180 C302 165 372 165 416 182 L416 352 C372 336 302 336 256 352 Z" fill="url(#pageGrad)" />

    <!-- Left text lines simulation -->
    <line x1="126" y1="210" x2="226" y2="204" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="235" x2="226" y2="229" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="260" x2="226" y2="254" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="285" x2="200" y2="280" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

    <!-- Right text lines simulation -->
    <line x1="286" y1="204" x2="386" y2="210" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="229" x2="386" y2="235" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="254" x2="386" y2="260" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="279" x2="360" y2="284" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

    <!-- Golden Cross at Center Above / Bookmark Ribbon -->
    <path d="M256 150 L256 390" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
    <path d="M250 375 L256 395 L262 375 Z" fill="url(#goldGrad)" />
    
    <!-- Small Golden Cross Emblem Above -->
    <path d="M256 100 L256 142 M242 114 L270 114" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round" />
  </g>

  <!-- Clean App Branding Monogram -->
  <text x="256" y="438" font-family="'Cinzel', Georgia, serif" font-size="34" font-weight="700" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="4">RAMELA</text>
</svg>`;

// 2. Maskable SVG Icon with safe-zone margin (Android requirement: central 80% circle)
const maskableSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <linearGradient id="pageGradMask" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>
  </defs>

  <!-- Full bleed background without rounded corners for maskable -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Scaled group inside the 80% safe zone (center at 256, scale ~0.78) -->
  <g transform="translate(56, 56) scale(0.78)">
    <rect x="0" y="0" width="512" height="512" rx="64" fill="none" stroke="url(#goldGradMask)" stroke-width="4" stroke-opacity="0.5" />
    
    <!-- Open Bible -->
    <path d="M256 180 C210 165 140 165 96 182 L96 352 C140 336 210 336 256 352 Z" fill="url(#pageGradMask)" />
    <path d="M256 180 C302 165 372 165 416 182 L416 352 C372 336 302 336 256 352 Z" fill="url(#pageGradMask)" />

    <line x1="126" y1="210" x2="226" y2="204" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="235" x2="226" y2="229" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="260" x2="226" y2="254" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="126" y1="285" x2="200" y2="280" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

    <line x1="286" y1="204" x2="386" y2="210" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="229" x2="386" y2="235" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="254" x2="386" y2="260" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
    <line x1="286" y1="279" x2="360" y2="284" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />

    <!-- Golden Ribbon -->
    <path d="M256 150 L256 390" stroke="url(#goldGradMask)" stroke-width="6" stroke-linecap="round" />
    <path d="M250 375 L256 395 L262 375 Z" fill="url(#goldGradMask)" />
    
    <!-- Small Golden Cross -->
    <path d="M256 100 L256 142 M242 114 L270 114" stroke="url(#goldGradMask)" stroke-width="5" stroke-linecap="round" />

    <text x="256" y="438" font-family="'Cinzel', Georgia, serif" font-size="36" font-weight="700" fill="url(#goldGradMask)" text-anchor="middle" letter-spacing="4">RAMELA</text>
  </g>
</svg>`;

async function run() {
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  console.log('Written icon.svg');

  const svgBuffer = Buffer.from(svgContent);
  const maskableSvgBuffer = Buffer.from(maskableSvgContent);

  // Generate pwa-192x192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // Generate pwa-512x512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // Generate pwa-maskable-512x512.png
  await sharp(maskableSvgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // Generate apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  console.log('All PWA icons generated successfully.');
}

run().catch(console.error);
