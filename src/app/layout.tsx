import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { SITE_NAME, SITE_TAGLINE } from "@/config/site";
import { getCurrentUser, homeFor } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_TAGLINE,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href={user ? homeFor(user.role) : "/"} className="text-lg font-bold text-emerald-800">
              ⚾ {SITE_NAME}
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <span className="hidden text-slate-500 sm:inline">{user.email}</span>
                  <form action={logout}>
                    <button className="font-medium text-slate-700 hover:text-slate-900">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="font-medium text-slate-700 hover:text-slate-900">
                    Log in
                  </Link>
                  <Link href="/signup" className="font-medium text-emerald-800 hover:text-emerald-900">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} {SITE_NAME}
        </footer>
      </body>
    </html>
  );
}
