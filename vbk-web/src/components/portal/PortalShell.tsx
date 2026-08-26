"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cx, initials } from "@/lib/format";

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Broj u bedžu (npr. nove porudžbine). */
  badge?: number;
  /** Aktivan i za podrute (npr. /porudzbine/abc). */
  matchPrefix?: boolean;
}

export function PortalShell({
  nav,
  areaLabel,
  children,
}: {
  nav: NavItem[];
  areaLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { profile, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href;

  const navList = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cx(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
            isActive(item)
              ? "bg-blood-soft font-medium text-blood-dark"
              : "text-ink-soft hover:bg-paper hover:text-ink",
          )}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.badge ? (
            <span className="min-w-5 rounded-full bg-blood px-1.5 py-0.5 text-center text-xs font-semibold text-white">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-blood text-sm font-bold text-white">
        VBK
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-ink">Veterinarska banka krvi</span>
        <span className="block text-xs text-ink-mute">{areaLabel}</span>
      </span>
    </div>
  );

  const account = (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-semibold text-white">
          {initials(profile?.name ?? profile?.email ?? "?")}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-ink">
            {profile?.name}
          </span>
          <span className="block truncate text-xs text-ink-mute">{profile?.email}</span>
        </span>
        <button
          onClick={logout}
          aria-label="Odjavi se"
          className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-blood-soft hover:text-blood"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        {brand}
        {navList}
        {account}
      </aside>

      {/* Sidebar — mobilni drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col bg-surface">
            {brand}
            {navList}
            {account}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — samo mobilni */}
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Meni"
            className="rounded-md p-1.5 text-ink-soft hover:bg-paper"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="grid h-7 w-7 place-items-center rounded-md bg-blood text-[10px] font-bold text-white">
            VBK
          </span>
          <span className="text-sm font-semibold text-ink">{areaLabel}</span>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/** Zaglavlje stranice unutar portala. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
