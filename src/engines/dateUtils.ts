export function differenceInCalendarDays(later: Date, earlier: Date): number {
  const utc1 = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const utc2 = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function format(date: Date, pattern: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  if (pattern === 'yyyy-MM-dd') return `${y}-${m}-${d}`;
  if (pattern === 'dd MMM yyyy') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[date.getMonth()]} ${y}`;
  }
  return date.toISOString();
}
