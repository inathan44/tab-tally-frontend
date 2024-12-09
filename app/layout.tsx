import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ReactQueryClientProvider from './components/ReactQueryClientProvider';
import Navbar from '@/app/components/navbar/index';
import { Toaster } from '@/components/ui/toaster';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Tab Tally - Get Started',
  description: 'Easily split bills and keep track of who owes who.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryClientProvider>
      <html lang='en'>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navbar />
          <Toaster />
          {children}
        </body>
      </html>
    </ReactQueryClientProvider>
  );
}
