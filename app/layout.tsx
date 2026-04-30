import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeGPT - 智能代码问答系统",
  description: "基于检索增强生成的智能代码问答系统，帮助你快速找到代码答案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="fonts-loading">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  const done = () => document.documentElement.classList.remove('fonts-loading');
  const timeout = setTimeout(done, 3000);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      clearTimeout(timeout);
      done();
    }).catch(() => {
      clearTimeout(timeout);
      done();
    });
  } else {
    done();
  }
})();
`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}