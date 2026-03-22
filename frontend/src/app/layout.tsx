import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";
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
        {/* Mobile Header Logo */}
        <header className="md:hidden fixed top-0 left-0 w-full glass z-50 flex items-center justify-center py-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white">Novellia</h1>
          </Link>
        </header>

        <Sidebar />
        <div className="flex-1 md:pl-64 flex flex-col min-h-screen pt-16 md:pt-0">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
