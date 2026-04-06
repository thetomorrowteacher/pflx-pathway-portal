import type { Metadata } from 'next';
import './globals.css';
import Ticker from './components/Ticker';
import RoleGuard from './components/RoleGuard';

export const metadata: Metadata = {
  title: 'PFLX Core Pathway Development',
  description: 'Choose your pathway. Develop your skills. Build your projects.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Ticker />
        <RoleGuard />
      </body>
    </html>
  );
}
