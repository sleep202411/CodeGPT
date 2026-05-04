import type { ReactNode } from "react";

type AuthPageShellProps = {
  title: string;
  children: ReactNode;
  className?: string;
  /** 注册等页面建议开启，减轻翻译扩展与 React 的冲突 */
  noTranslate?: boolean;
};

export function AuthPageShell({ title, children, className = "", noTranslate = false }: AuthPageShellProps) {
  return (
    <div
      className={`w-full min-h-screen bg-[#eef3fb] ${noTranslate ? "notranslate" : ""} ${className}`.trim()}
      translate={noTranslate ? "no" : undefined}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] items-center px-8 py-10">
        <div className="hidden w-1/2 items-center justify-center lg:flex">
          <div className="h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-200/50 to-blue-100/20 blur-xl" />
        </div>
        <div className="flex-1 rounded-2xl border border-[#dfe7f4] bg-white px-8 py-10 shadow-sm md:px-14 md:py-16 lg:max-w-[560px]">
          <div className="font-brand mb-4 text-center font-semibold text-[40px] leading-[40px] text-[#1f7be9]">
            {title}
          </div>
          <div className="border-b border-dashed border-[#d7dfea] pb-8 text-center text-[22px] font-semibold text-[#6b7a90]">
            CodeGPT
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
