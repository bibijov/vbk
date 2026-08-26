"use client";

import { Badge, type BadgeTone } from "@/components/ui/kit";
import {
  APPLICATION_STATUS_LABEL,
  CLINIC_STATUS_LABEL,
  DONOR_STATUS_LABEL,
  ORDER_STATUS_LABEL,
  type ApplicationStatus,
  type ClinicStatus,
  type DonorStatus,
  type OrderStatus,
} from "@/types";

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  new: "blood",
  confirmed: "info",
  preparing: "warn",
  dispatched: "info",
  completed: "ok",
  cancelled: "neutral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}

const CLINIC_TONE: Record<ClinicStatus, BadgeTone> = {
  pending: "warn",
  verified: "info",
  active: "ok",
  suspended: "blood",
};

export function ClinicStatusBadge({ status }: { status: ClinicStatus }) {
  return <Badge tone={CLINIC_TONE[status]}>{CLINIC_STATUS_LABEL[status]}</Badge>;
}

const DONOR_TONE: Record<DonorStatus, BadgeTone> = {
  candidate: "info",
  active: "ok",
  paused: "warn",
  retired: "neutral",
};

export function DonorStatusBadge({ status }: { status: DonorStatus }) {
  return <Badge tone={DONOR_TONE[status]}>{DONOR_STATUS_LABEL[status]}</Badge>;
}

const APPLICATION_TONE: Record<ApplicationStatus, BadgeTone> = {
  new: "blood",
  contacted: "info",
  approved: "ok",
  rejected: "neutral",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={APPLICATION_TONE[status]}>{APPLICATION_STATUS_LABEL[status]}</Badge>;
}

export function StockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold: number;
}) {
  const tone: BadgeTone = stock <= 0 ? "blood" : stock <= threshold ? "warn" : "ok";
  const label = stock <= 0 ? "Nema na stanju" : `${stock} na stanju`;
  return <Badge tone={tone}>{label}</Badge>;
}
