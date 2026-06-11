export type NotificationType = "Placement" | "Result" | "Event";

export interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
  viewed?: boolean;
}

export const TYPE_WEIGHTS: Record<NotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export const TYPE_COLORS: Record<NotificationType, string> = {
  Placement: "#1976d2",
  Result: "#388e3c",
  Event: "#f57c00",
};

export const TYPE_BG: Record<NotificationType, string> = {
  Placement: "#e3f2fd",
  Result: "#e8f5e9",
  Event: "#fff3e0",
};

const API_BASE = "http://4.224.186.213/evaluation-service/notifications";

const VIEWED_KEY = "campus_viewed_notifications";

export function getViewedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markViewed(id: string) {
  if (typeof window === "undefined") return;
  const ids = getViewedIds();
  ids.add(id);
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...ids]));
}

export function markAllViewed(ids: string[]) {
  if (typeof window === "undefined") return;
  const existing = getViewedIds();
  ids.forEach((id) => existing.add(id));
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...existing]));
}

export async function fetchNotifications(
  apiKey: string,
  params?: { limit?: number; type?: string }
): Promise<Notification[]> {
  const url = new URL(API_BASE);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.type) url.searchParams.set("type", params.type);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.notifications ?? [];
}

export function getTopNNotifications(
  notifications: Notification[],
  n: number
): Notification[] {
  return [...notifications]
    .sort((a, b) => {
      const wa = TYPE_WEIGHTS[a.Type] ?? 0;
      const wb = TYPE_WEIGHTS[b.Type] ?? 0;
      if (wb !== wa) return wb - wa;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    })
    .slice(0, n);
}

export function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return ts;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: string): string {
  const now = Date.now();
  const then = new Date(ts).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
