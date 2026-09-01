import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Радио-Т: Находки',
  description: 'Полезные темы из архива Радио-Т с категориями, уровнем сложности и точными таймкодами.',
  openGraph: {
    title: 'Радио-Т: Находки',
    description: 'Темы из архива Радио-Т, которые стоит услышать.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Радио-Т: Находки. Темы, которые стоит услышать' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Радио-Т: Находки',
    description: 'Темы из архива Радио-Т, которые стоит услышать.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className="dark"><body className={`${geist.variable} ${geistMono.variable}`}>{children}</body></html>;
}
