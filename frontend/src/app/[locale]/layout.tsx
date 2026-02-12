import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import QueryProvider from '@/components/providers/QueryProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    template: '%s | SoleTrade B2B',
    default: 'SoleTrade | Premier B2B Wholesale Platform',
  },
  description: "Your trusted source for wholesale shoes and apparel. Direct factory prices, quality assurance, and global shipping.",
  keywords: ["B2B", "Wholesale", "Shoes", "Apparel", "Sourcing", "Trade"],
  openGraph: {
    title: 'SoleTrade | Premier B2B Wholesale Platform',
    description: 'Your trusted source for wholesale shoes and apparel.',
    url: 'https://soletrade.com',
    siteName: 'SoleTrade',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
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

  if (!['en', 'zh'].includes(locale)) {
      notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <ToastContainer />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
