import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 | CodeGPT",
  description: "登录 CodeGPT 智能代码问答系统",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
