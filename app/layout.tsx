import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Star Africa OS',
    template: '%s | Star Africa OS',
  },
  description: 'Star Africa\'s connected platform for bids, projects, procurement, finance, and reporting.',
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'STAR AFRICA OS',
    description: 'Business operations, connected',
    images: [{ url: '/og.png', width: 1732, height: 909, alt: 'STAR AFRICA OS — Business operations, connected' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STAR AFRICA OS',
    description: 'Business operations, connected',
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '32x32' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-UG">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
