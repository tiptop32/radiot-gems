import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

// Pages build (GITHUB_PAGES=true) publishes under tiptop32.github.io/radiot-gems;
// ordinary Cloudflare builds keep the site's own domain as metadata base.
const isPagesExport = process.env.GITHUB_PAGES === 'true';
const siteUrl = isPagesExport
  ? 'https://tiptop32.github.io/radiot-gems'
  : 'https://radiot-gems.nexus32t.chatgpt.site';
const metadataBase = new URL(siteUrl);

export const metadata: Metadata = {
  metadataBase,
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
  icons: {
    icon: isPagesExport ? `${siteUrl}/favicon.svg` : '/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru" className="dark"><body className={`${geist.variable} ${geistMono.variable}`}>{children}</body></html>;
}
