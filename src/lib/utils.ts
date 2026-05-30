import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAMPM(timeStr?: string) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${mStr} ${ampm}`;
}

export function formatTimeRange(start?: string, end?: string) {
  if (start && end) return `${formatTimeAMPM(start)} - ${formatTimeAMPM(end)}`;
  if (start) return formatTimeAMPM(start);
  if (end) return formatTimeAMPM(end);
  return "";
}

export function calculateDiffDays(dateStr?: string) {
  if (!dateStr) return 0;
  const [year, month, day] = dateStr.split('-');
  const evDate = new Date(Number(year), Number(month) - 1, Number(day));
  const now = new Date();
  now.setHours(0,0,0,0);
  const diffTime = evDate.getTime() - now.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export const recordDocumentAccess = (id: string) => {
  try {
    const accessesRaw = localStorage.getItem('4h_recent_access') || '{}';
    const accesses = JSON.parse(accessesRaw);
    accesses[id] = new Date().toISOString();
    localStorage.setItem('4h_recent_access', JSON.stringify(accesses));
    window.dispatchEvent(new Event('local-storage-update'));
  } catch (e) {
    console.error(e);
  }
};
