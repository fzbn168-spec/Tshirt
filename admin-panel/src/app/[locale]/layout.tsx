import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import QueryProvider from '@/components/providers/QueryProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'SoleTrade Admin Panel',
  description: "Administrative Dashboard for SoleTrade B2B Platform",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  // Validate locale (add more if needed)
  if (!['en', 'zh'].includes(locale)) {
      notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900`}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <main className="flex-grow">
              {children}
            </main>
            <ToastContainer />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
