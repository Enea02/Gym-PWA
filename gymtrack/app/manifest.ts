import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GymTrack',
    short_name: 'GymTrack',
    description: 'Tracking allenamenti palestra',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0F0A',
    theme_color: '#A3E635',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
