import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-6">
      <div className="w-full max-w-md rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] p-8 text-center">
        <h1 className="text-2xl font-semibold text-[var(--app-text)]">页面不存在</h1>
        <p className="mt-2 text-sm text-[var(--app-text-muted)]">你访问的页面已被移除或地址错误。</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-[var(--app-primary)] px-4 text-sm text-white hover:opacity-90"
        >
          返回首页
        </Link>
      </div>
    </main>
  );
}
