import { Metadata } from 'next';

export const metadata: Metadata = {
    icons: {
        icon: [
            {
                url: '/favicon.ico',
                sizes: 'any',
            },
            {
                url: '/icon.svg',
                type: 'image/svg+xml',
            },
        ],
        apple: [
            {
                url: '/apple-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    },
};
