import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/Layout/BottomNav";
import Sidebar from "@/components/Layout/Sidebar";

export const metadata: Metadata = {
  title: "Novellia - AI 캐릭터 대화 플랫폼",
  description: "나만의 AI 캐릭터와 이야기를 써 내려가세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" />
      </head>
      <body className="antialiased flex min-h-screen">
        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
