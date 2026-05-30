export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  wait = 400,
): (...args: Parameters<T>) => void {
  let t: number | null = null;
  return (...args: Parameters<T>) => {
    if (t !== null) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
