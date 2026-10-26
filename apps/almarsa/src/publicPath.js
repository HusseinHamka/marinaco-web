const base = (import.meta.env?.BASE_URL || '').replace(/\/$/, '');

export function publicUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) return normalized;
  return `${base}${normalized}`;
}

export function apiUrl(path) {
  return publicUrl(path.startsWith('/') ? path : `/${path}`);
}
