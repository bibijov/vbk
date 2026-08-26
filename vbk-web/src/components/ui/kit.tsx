"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { cx } from "@/lib/format";

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-blood text-white hover:bg-blood-dark disabled:bg-blood/50",
  secondary:
    "bg-surface text-ink border border-line hover:border-ink-mute disabled:text-ink-mute",
  ghost: "text-ink-soft hover:bg-navy-soft hover:text-navy",
  danger: "bg-surface text-blood border border-blood/40 hover:bg-blood-soft",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  loading = false,
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
        "disabled:cursor-not-allowed",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        BUTTON_STYLES[variant],
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-card border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------- Badge --------------------------------- */

export type BadgeTone = "neutral" | "ok" | "warn" | "info" | "blood";

const BADGE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-navy-soft text-navy",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  blood: "bg-blood-soft text-blood",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Polja --------------------------------- */

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-blood">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-mute">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-blood">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-mute focus:border-navy focus:outline-none " +
  "disabled:bg-paper disabled:text-ink-mute";

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 sm:p-8">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative w-full rounded-card border border-line bg-surface shadow-xl",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Zatvori"
            className="rounded-md p-1 text-ink-mute transition-colors hover:bg-paper hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------- Pomoćno --------------------------------- */

export function Spinner({ label = "Učitavanje…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-mute">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 text-ink-mute">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-mute">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-blood/30 bg-blood-soft px-3 py-2 text-sm text-blood-dark">
      {children}
    </p>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-lg border border-ok/30 bg-ok-soft px-3 py-2 text-sm text-ok">
      {children}
    </p>
  );
}
