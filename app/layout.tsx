import type { Metadata } from 'next';
import './globals.css';

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
      </body>
    </html>
  );
}
