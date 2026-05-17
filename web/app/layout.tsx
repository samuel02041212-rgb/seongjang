import type { Metadata } from "next";
import {
  Black_Han_Sans,
  Caveat,
  Nanum_Myeongjo,
  Noto_Sans_KR,
} from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/shell/site-footer";

import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["500", "600"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  variable: "--font-myeongjo",
  weight: ["400", "700"],
});

const blackHanSans = Black_Han_Sans({
  subsets: ["latin"],
  variable: "--font-black-han",
  weight: "400",
});

export const metadata: Metadata = {
  title: "성장 — 믿음 안에서 함께 자라는 공간",
  description:
    "말씀 묵상, 소그룹, 교제를 아우르는 커뮤니티. 성장에서 오늘의 걸음을 나눠 보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${noto.variable} ${caveat.variable} ${nanumMyeongjo.variable} ${blackHanSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <link rel="stylesheet" href="/css/chat.css" />
        <link rel="stylesheet" href="/css/meditation-bible.css" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
