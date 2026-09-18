import type { Metadata } from 'next';

import { Providers } from '../providers';
import '@repo/ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Relay · HQ to kiosk lab',
  description: 'Offline-first kiosk and payment recovery demonstration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
