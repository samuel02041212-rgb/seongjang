import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

import { ConditionalChatDock } from "@/components/chat/conditional-chat-dock";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/shell/site-footer";

import "./globals.css";

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
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
    <html lang="ko" className={`${noto.variable} h-full antialiased`}>
      <head>
        <link rel="stylesheet" href="/css/chat.css" />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <AppProviders>
          <div className="flex-1">{children}</div>
          <SiteFooter />
          <ConditionalChatDock />
        </AppProviders>
      </body>
    </html>
  );
}
