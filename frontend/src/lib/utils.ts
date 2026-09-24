import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Safely parses a backend ISO timestamp; returns null instead of "Invalid Date".
 *
 * The backend always authors timestamps in UTC (see app/utils/time_utils.py::utcnow),
 * but SQLite strips timezone info from datetimes on round-trip through SQLAlchemy, so
 * the API can return offset-less strings like "2026-09-24T10:15:30.123456". Without a
 * timezone marker, date-fns' parseISO (and native Date parsing) treats that string as
 * LOCAL time, silently shifting every displayed timestamp by the viewer's UTC offset.
 * Since every timestamp this app receives is UTC by backend convention, we append "Z"
 * whenever one is missing before parsing.
 */
export function parseBackendDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = typeof value === "string" && !HAS_TIMEZONE.test(value) ? `${value}Z` : value;
  const parsed = typeof normalized === "string" ? parseISO(normalized) : normalized;
  return isValid(parsed) ? parsed : null;
}

export function formatDateTime(value: string | null | undefined, fallback = "Unknown"): string {
  const date = parseBackendDate(value);
  return date ? format(date, "MMM d, HH:mm") : fallback;
}

export function formatTime(value: string | null | undefined, fallback = "--:--"): string {
  const date = parseBackendDate(value);
  return date ? format(date, "HH:mm") : fallback;
}

export function formatRelative(value: string | null | undefined, fallback = "unknown"): string {
  const date = parseBackendDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : fallback;
}

export function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value.toFixed(digits)}%`;
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || Number.isNaN(meters)) return "unknown";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function greetingForHour(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
