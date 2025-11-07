import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LP PIVOT",
  description: "競合サービスを分析して、差別化されたアイデアのLPを自動生成",
  openGraph: {
    title: "LP PIVOT",
    description: "競合サービスを分析して、差別化されたアイデアのLPを自動生成",
    url: "https://lp-pivot.com",
    siteName: "LP PIVOT",
    images: [
      {
        url: "/image/ogimage.jpg",
        width: 1200,
        height: 630,
        alt: "LP PIVOT - 競合分析からLP自動生成",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LP PIVOT",
    description: "競合サービスを分析して、差別化されたアイデアのLPを自動生成",
    images: ["/image/ogimage.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}