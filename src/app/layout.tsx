import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Qiwa QR Gift',
  description: 'Qiwa Coffee QR kod ile hediye kampanyası',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/preline@2.0.3/dist/preline.min.css" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Toaster position="top-center" />
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/preline@2.0.3/dist/preline.min.js" strategy="lazyOnload" />
        <Script id="preline-init">
          {`
            window.addEventListener('load', () => {
              if (typeof window.__hs !== 'undefined') {
                window.__hs.init();
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
