import type { MetadataRoute } from 'next';

/**
 * Makes the portal installable. iPhones only allow web push for sites added to
 * the Home Screen, which is what this enables.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XLEVELSUP Employee Portal',
    short_name: 'XLEVELSUP',
    start_url: '/employee/dashboard',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/xlu_icon_192.png', sizes: '192x192', type: 'image/png' },
      { src: '/xlu_fav_icon.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
